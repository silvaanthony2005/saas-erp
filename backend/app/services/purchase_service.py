from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.purchasing import (
    PurchaseInvoice, PurchaseInvoiceDetail, Supplier,
    AccountsPayable, PaymentSchedule
)
from app.models.business import Product
from app.schemas.purchasing import PurchaseInvoiceCreate, PaymentScheduleCreate
from app.services.inventory_cost_service import InventoryCostService
from app.services.accounting_service import AccountingService
from datetime import date

class PurchaseService:
    @staticmethod
    def create_purchase(db: Session, data: PurchaseInvoiceCreate):
        supplier = db.query(Supplier).filter(Supplier.id == data.supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

        invoice = PurchaseInvoice(
            invoice_number=data.invoice_number,
            supplier_id=data.supplier_id,
            subtotal_bs=data.subtotal_bs,
            tax_bs=data.tax_bs,
            total_bs=data.total_bs,
            exchange_rate=data.exchange_rate,
            payment_type=data.payment_type,
            invoice_date=datetime.strptime(data.invoice_date, "%Y-%m-%d").date() if data.invoice_date else None,
            due_date=datetime.strptime(data.due_date, "%Y-%m-%d").date() if data.due_date else None,
            notes=data.notes,
            status="active"
        )
        db.add(invoice)
        db.flush()

        costing_method = InventoryCostService.get_costing_method(db)

        details = []
        for d in data.details:
            product = db.query(Product).filter(Product.id == d.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Producto ID {d.product_id} no encontrado")

            subtotal = d.quantity * d.unit_cost_bs

            detail = PurchaseInvoiceDetail(
                purchase_invoice_id=invoice.id,
                product_id=d.product_id,
                quantity=d.quantity,
                unit_cost_bs=d.unit_cost_bs,
                subtotal_bs=subtotal
            )
            db.add(detail)
            details.append(detail)

            if costing_method == "weighted_average":
                InventoryCostService.apply_weighted_average(
                    db, d.product_id, d.quantity, d.unit_cost_bs
                )
                InventoryCostService.record_inbound_movement(
                    db, d.product_id, d.quantity, d.unit_cost_bs,
                    "purchase", invoice.id
                )
            else:
                InventoryCostService.apply_fifo_inbound(
                    db, d.product_id, d.quantity, d.unit_cost_bs,
                    "purchase", invoice.id
                )

        if data.payment_type == "credit":
            ap = AccountsPayable(
                purchase_invoice_id=invoice.id,
                total_amount_bs=data.total_bs,
                remaining_balance_bs=data.total_bs,
                due_date=datetime.strptime(data.due_date, "%Y-%m-%d").date() if data.due_date else None,
                status="pending"
            )
            db.add(ap)

        AccountingService.register_entry(
            db,
            entry_type="expense",
            amount_bs=data.total_bs,
            description=f"Compra #{data.invoice_number} - {supplier.company_name}",
            category="Inventory",
            reference_id=invoice.id
        )

        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def get_purchases(db: Session, skip: int = 0, limit: int = 100, supplier_id: int = None):
        query = db.query(PurchaseInvoice)
        if supplier_id:
            query = query.filter(PurchaseInvoice.supplier_id == supplier_id)
        total = query.count()
        invoices = query.order_by(PurchaseInvoice.created_at.desc()).offset(skip).limit(limit).all()
        return {"purchases": invoices, "total": total}

    @staticmethod
    def get_purchase_by_id(db: Session, purchase_id: int):
        invoice = db.query(PurchaseInvoice).filter(PurchaseInvoice.id == purchase_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Factura de compra no encontrada")
        return invoice

    @staticmethod
    def cancel_purchase(db: Session, purchase_id: int):
        invoice = db.query(PurchaseInvoice).filter(PurchaseInvoice.id == purchase_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Factura de compra no encontrada")
        if invoice.status == "cancelled":
            raise HTTPException(status_code=400, detail="La factura ya está anulada")

        invoice.status = "cancelled"
        for detail in invoice.details:
            product = db.query(Product).filter(Product.id == detail.product_id).first()
            if product:
                product.stock_quantity -= detail.quantity
                if product.stock_quantity < 0:
                    product.stock_quantity = 0

        if invoice.accounts_payable:
            invoice.accounts_payable.status = "cancelled"

        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def get_accounts_payable(db: Session, skip: int = 0, limit: int = 100, status: str = None):
        query = db.query(AccountsPayable)
        if status:
            query = query.filter(AccountsPayable.status == status)
        total = query.count()
        aps = query.order_by(AccountsPayable.due_date.asc()).offset(skip).limit(limit).all()
        return {"accounts_payable": aps, "total": total}

    @staticmethod
    def get_ap_by_id(db: Session, ap_id: int):
        ap = db.query(AccountsPayable).filter(AccountsPayable.id == ap_id).first()
        if not ap:
            raise HTTPException(status_code=404, detail="Cuenta por pagar no encontrada")
        return ap

    @staticmethod
    def make_payment(db: Session, data: PaymentScheduleCreate):
        ap = db.query(AccountsPayable).filter(AccountsPayable.id == data.accounts_payable_id).first()
        if not ap:
            raise HTTPException(status_code=404, detail="Cuenta por pagar no encontrada")
        if ap.remaining_balance_bs <= 0:
            raise HTTPException(status_code=400, detail="La cuenta ya está totalmente pagada")
        if data.amount_bs > ap.remaining_balance_bs:
            raise HTTPException(status_code=400, detail="El pago excede el saldo pendiente")
        if data.amount_bs <= 0:
            raise HTTPException(status_code=400, detail="El monto del pago debe ser positivo")

        payment = PaymentSchedule(
            accounts_payable_id=data.accounts_payable_id,
            amount_bs=data.amount_bs,
            payment_date=datetime.strptime(data.payment_date, "%Y-%m-%d") if data.payment_date else datetime.utcnow(),
            payment_method=data.payment_method,
            notes=data.notes,
            is_paid=1
        )
        db.add(payment)

        ap.remaining_balance_bs -= data.amount_bs
        if ap.remaining_balance_bs <= 0:
            ap.status = "paid"
            ap.remaining_balance_bs = 0
            if ap.purchase_invoice:
                ap.purchase_invoice.payment_type = "paid"
        else:
            ap.status = "partially_paid"

        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def get_payment_schedules(db: Session, ap_id: int):
        return db.query(PaymentSchedule).filter(
            PaymentSchedule.accounts_payable_id == ap_id
        ).order_by(PaymentSchedule.payment_date.desc()).all()

    @staticmethod
    def get_cxpsummary(db: Session):
        total_pending = db.query(
            db.query(AccountsPayable).filter(
                AccountsPayable.status.in_(["pending", "partially_paid"])
            ).with_entities(
                db.func.sum(AccountsPayable.remaining_balance_bs)
            ).scalar() or 0.0
        ).scalar() or 0.0
        total_overdue = db.query(
            db.query(AccountsPayable).filter(
                AccountsPayable.status.in_(["pending", "partially_paid"]),
                AccountsPayable.due_date < date.today()
            ).with_entities(
                db.func.sum(AccountsPayable.remaining_balance_bs)
            ).scalar() or 0.0
        ).scalar() or 0.0
        total_paid = db.query(
            db.query(AccountsPayable).filter(
                AccountsPayable.status == "paid"
            ).with_entities(
                db.func.sum(AccountsPayable.total_amount_bs)
            ).scalar() or 0.0
        ).scalar() or 0.0

        return {
            "total_pending_bs": total_pending,
            "total_overdue_bs": total_overdue,
            "total_paid_bs": total_paid
        }

    @staticmethod
    def get_supplier_balance(db: Session, supplier_id: int):
        aps = db.query(AccountsPayable).join(
            PurchaseInvoice, AccountsPayable.purchase_invoice_id == PurchaseInvoice.id
        ).filter(
            PurchaseInvoice.supplier_id == supplier_id,
            AccountsPayable.status.in_(["pending", "partially_paid"])
        ).all()

        total_debt = sum(ap.remaining_balance_bs for ap in aps)
        return {
            "supplier_id": supplier_id,
            "total_debt_bs": total_debt,
            "active_aps": len(aps),
            "aps": aps
        }
