from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.purchasing import Supplier
from app.schemas.purchasing import SupplierCreate

class SupplierService:
    @staticmethod
    def get_suppliers(db: Session, skip: int = 0, limit: int = 100, search: str = ""):
        query = db.query(Supplier)
        if search:
            query = query.filter(
                Supplier.company_name.ilike(f"%{search}%") |
                Supplier.dni_rif.ilike(f"%{search}%")
            )
        total = query.count()
        suppliers = query.order_by(Supplier.company_name).offset(skip).limit(limit).all()
        return {"suppliers": suppliers, "total": total}

    @staticmethod
    def get_supplier_by_id(db: Session, supplier_id: int):
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        return supplier

    @staticmethod
    def create_supplier(db: Session, data: SupplierCreate, current_user=None):
        user_id = current_user.id if current_user else None
        existing = db.query(Supplier).filter(Supplier.dni_rif == data.dni_rif).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un proveedor con ese RIF/DNI")
        supplier_data = data.model_dump()
        supplier_data["created_by"] = user_id
        supplier = Supplier(**supplier_data)
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier

    @staticmethod
    def update_supplier(db: Session, supplier_id: int, data: dict, current_user=None):
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        if "dni_rif" in data and data["dni_rif"] != supplier.dni_rif:
            existing = db.query(Supplier).filter(Supplier.dni_rif == data["dni_rif"]).first()
            if existing:
                raise HTTPException(status_code=400, detail="Ya existe otro proveedor con ese RIF/DNI")
        for key, value in data.items():
            setattr(supplier, key, value)
        db.commit()
        db.refresh(supplier)
        return supplier

    @staticmethod
    def delete_supplier(db: Session, supplier_id: int):
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        from app.models.purchasing import PurchaseInvoice
        invoice_count = db.query(PurchaseInvoice).filter(
            PurchaseInvoice.supplier_id == supplier_id
        ).count()
        if invoice_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar: el proveedor tiene {invoice_count} factura(s) asociada(s)"
            )
        db.delete(supplier)
        db.commit()
        return {"message": "Proveedor eliminado con éxito"}
