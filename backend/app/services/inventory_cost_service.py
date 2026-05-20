from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models.purchasing import InventoryMovement, CostingConfig
from app.models.business import Product

class InventoryCostService:
    @staticmethod
    def get_costing_method(db: Session) -> str:
        config = db.query(CostingConfig).first()
        if not config:
            config = CostingConfig(method="weighted_average")
            db.add(config)
            db.commit()
            db.refresh(config)
        return config.method

    @staticmethod
    def set_costing_method(db: Session, method: str) -> CostingConfig:
        if method not in ("fifo", "weighted_average"):
            raise HTTPException(status_code=400, detail="Método de costeo inválido. Use 'fifo' o 'weighted_average'")
        config = db.query(CostingConfig).first()
        if not config:
            config = CostingConfig(method=method)
            db.add(config)
        else:
            config.method = method
        db.commit()
        db.refresh(config)
        return config

    @staticmethod
    def record_inbound_movement(db: Session, product_id: int, quantity: int,
                                 unit_cost_bs: float, reference_type: str,
                                 reference_id: int = None):
        total_cost_bs = quantity * unit_cost_bs
        movement = InventoryMovement(
            product_id=product_id,
            movement_type="in",
            quantity=quantity,
            unit_cost_bs=unit_cost_bs,
            total_cost_bs=total_cost_bs,
            reference_type=reference_type,
            reference_id=reference_id,
            remaining_quantity=quantity
        )
        db.add(movement)
        return movement

    @staticmethod
    def record_outbound_movement(db: Session, product_id: int, quantity: int,
                                  unit_cost_bs: float, total_cost_bs: float,
                                  reference_type: str, reference_id: int = None):
        movement = InventoryMovement(
            product_id=product_id,
            movement_type="out",
            quantity=quantity,
            unit_cost_bs=unit_cost_bs,
            total_cost_bs=total_cost_bs,
            reference_type=reference_type,
            reference_id=reference_id,
            remaining_quantity=None
        )
        db.add(movement)
        return movement

    @staticmethod
    def apply_weighted_average(db: Session, product_id: int,
                                inbound_qty: int, inbound_cost_bs: float):
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        current_stock = product.stock_quantity
        current_cost = product.cost_price_bs

        new_stock = current_stock + inbound_qty
        if new_stock > 0:
            new_avg = ((current_stock * current_cost) + (inbound_qty * inbound_cost_bs)) / new_stock
            product.cost_price_bs = round(new_avg, 2)
        else:
            product.cost_price_bs = inbound_cost_bs

        product.stock_quantity = new_stock
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def apply_fifo_inbound(db: Session, product_id: int, inbound_qty: int,
                            inbound_cost_bs: int, reference_type: str,
                            reference_id: int = None):
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        product.stock_quantity += inbound_qty
        db.commit()
        db.refresh(product)

        return InventoryCostService.record_inbound_movement(
            db, product_id, inbound_qty, inbound_cost_bs,
            reference_type, reference_id
        )

    @staticmethod
    def calculate_fifo_cogs(db: Session, product_id: int, quantity: int) -> float:
        layers = db.query(InventoryMovement).filter(
            InventoryMovement.product_id == product_id,
            InventoryMovement.movement_type == "in",
            InventoryMovement.remaining_quantity > 0
        ).order_by(InventoryMovement.created_at).all()

        total_cost = 0.0
        remaining = quantity

        for layer in layers:
            if remaining <= 0:
                break
            available = layer.remaining_quantity
            consume = min(available, remaining)
            total_cost += consume * layer.unit_cost_bs
            layer.remaining_quantity -= consume
            remaining -= consume

        if remaining > 0:
            fallback = db.query(Product).filter(Product.id == product_id).first()
            total_cost += remaining * (fallback.cost_price_bs if fallback else 0)
            remaining = 0

        db.commit()
        return total_cost

    @staticmethod
    def consume_fifo_stock(db: Session, product_id: int, quantity: int,
                            reference_type: str, reference_id: int = None) -> dict:
        total_cost = InventoryCostService.calculate_fifo_cogs(db, product_id, quantity)
        if total_cost == 0 and quantity > 0:
            product = db.query(Product).filter(Product.id == product_id).first()
            total_cost = quantity * (product.cost_price_bs if product else 0)

        unit_cost = round(total_cost / quantity, 2) if quantity > 0 else 0

        InventoryCostService.record_outbound_movement(
            db, product_id, quantity, unit_cost, total_cost,
            reference_type, reference_id
        )

        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            product.stock_quantity -= quantity
            db.commit()

        return {"unit_cost_bs": unit_cost, "total_cost_bs": total_cost}

    @staticmethod
    def get_kardex(db: Session, product_id: int = None, skip: int = 0, limit: int = 100):
        query = db.query(InventoryMovement)
        if product_id:
            query = query.filter(InventoryMovement.product_id == product_id)
        total = query.count()
        movements = query.order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()
        return {"movements": movements, "total": total}
