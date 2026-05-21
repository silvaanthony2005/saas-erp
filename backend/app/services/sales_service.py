from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models.business import Transaction, TransactionDetail, Product, Customer, SalePayment, Receivable
from app.models.accounting import AccountingEntry
from app.schemas.sales import SaleCreate
from app.services.exchange_rate_service import ExchangeRateService
from app.services.inventory_cost_service import InventoryCostService
from app.services.accounting_service import AccountingService

class SalesService:
    @staticmethod
    def create_sale(db: Session, sale_data: SaleCreate):
        try:
            current_rate_obj = ExchangeRateService.get_current_rate(db)
            exchange_rate = current_rate_obj.rate if current_rate_obj else 1.0

            if sale_data.customer_id:
                customer = db.query(Customer).filter(Customer.id == sale_data.customer_id).first()
                if not customer:
                    raise HTTPException(status_code=404, detail="Customer not found")

            costing_method = InventoryCostService.get_costing_method(db)
            total_amount_bs = 0.0
            total_usd = 0.0
            total_cogs_bs = 0.0
            details_to_create = []
            is_credit = sale_data.is_credit

            for item in sale_data.details:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if not product:
                    raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")

                if product.stock_quantity < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient stock for product {product.name}. Available: {product.stock_quantity}"
                    )

                if costing_method == "fifo":
                    cogs = InventoryCostService.consume_fifo_stock(
                        db, item.product_id, item.quantity, "sale"
                    )
                    cogs_unit = cogs["unit_cost_bs"]
                    cogs_total = cogs["total_cost_bs"]
                else:
                    cogs_unit = product.cost_price_bs
                    cogs_total = cogs_unit * item.quantity
                    product.stock_quantity -= item.quantity
                    InventoryCostService.record_outbound_movement(
                        db, item.product_id, item.quantity,
                        cogs_unit, cogs_total, "sale"
                    )

                total_cogs_bs += cogs_total

                line_total_bs = item.unit_price_bs * item.quantity
                line_total_usd = (item.unit_price_usd or (item.unit_price_bs / exchange_rate)) * item.quantity
                total_amount_bs += line_total_bs
                total_usd += line_total_usd

                details_to_create.append(
                    TransactionDetail(
                        product_id=item.product_id,
                        quantity=item.quantity,
                        unit_price_bs=item.unit_price_bs,
                        unit_price_usd=item.unit_price_usd or (item.unit_price_bs / exchange_rate),
                        product_name=product.name
                    )
                )

            payment_method_str = "credit" if is_credit else "split"
            db_sale = Transaction(
                type="sale",
                total_amount_bs=total_amount_bs,
                total_usd=total_usd,
                exchange_rate=exchange_rate,
                payment_method=payment_method_str,
                customer_id=sale_data.customer_id,
                details=details_to_create
            )
            db.add(db_sale)
            db.flush()

            # Procesar pagos
            if is_credit:
                if not sale_data.customer_id:
                    raise HTTPException(status_code=400, detail="Crédito requiere un cliente")
                if customer.category != "exclusive":
                    raise HTTPException(status_code=400, detail="Solo clientes exclusivos pueden comprar a crédito")
                from app.models.business import Receivable
                existing_debt = db.query(func.coalesce(func.sum(Receivable.remaining_usd), 0)).filter(
                    Receivable.customer_id == customer.id,
                    Receivable.status.in_(["pending", "partially_paid"])
                ).scalar() or 0.0
                total_debt_usd = existing_debt + total_usd
                available_credit = customer.credit_limit_usd - existing_debt
                if total_debt_usd > customer.credit_limit_usd:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Límite de crédito excedido. Deuda actual: ${existing_debt:.2f}, "
                               f"disponible: ${max(0, available_credit):.2f}, necesario: ${total_usd:.2f}"
                    )
                receivable = Receivable(
                    sale_id=db_sale.id,
                    customer_id=customer.id,
                    total_usd=total_usd,
                    remaining_usd=total_usd,
                    exchange_rate_at_sale=exchange_rate,
                    status="pending"
                )
                db.add(receivable)
                pmt_desc = "Crédito"
            else:
                payments = sale_data.payments or []
                if not payments:
                    raise HTTPException(status_code=400, detail="Debe incluir al menos un método de pago")

                payment_sum = sum(p.amount_bs for p in payments)
                if abs(payment_sum - total_amount_bs) > 0.02:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Suma de pagos ({payment_sum:.2f}) no coincide con el total ({total_amount_bs:.2f})"
                    )

                for pmt in payments:
                    db_pmt = SalePayment(
                        sale_id=db_sale.id,
                        payment_method=pmt.payment_method,
                        amount_bs=pmt.amount_bs,
                        amount_usd=pmt.amount_usd or (pmt.amount_bs / (pmt.exchange_rate or exchange_rate)),
                        reference_number=pmt.reference_number,
                        exchange_rate=pmt.exchange_rate or exchange_rate
                    )
                    db.add(db_pmt)
                pmt_desc = ", ".join(p.payment_method for p in payments)

            # Registrar ingreso contable
            income_entry = AccountingEntry(
                entry_type="income",
                amount_bs=total_amount_bs,
                description=f"Venta #{db_sale.id} ({pmt_desc})",
                category="Ventas",
                reference_id=db_sale.id
            )
            db.add(income_entry)

            AccountingService.register_entry(
                db,
                entry_type="expense",
                amount_bs=total_cogs_bs,
                description=f"COGS Venta #{db_sale.id}",
                category="COGS",
                reference_id=db_sale.id
            )

            db.commit()
            db.refresh(db_sale)
            return db_sale
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Transaction failed and rolled back: {str(e)}")

    @staticmethod
    def get_sales(db: Session, skip: int = 0, limit: int = 100):
        sales = db.query(Transaction).filter(Transaction.type == "sale").order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()
        return sales

    @staticmethod
    def get_sale_by_id(db: Session, sale_id: int):
        sale = db.query(Transaction).filter(Transaction.id == sale_id, Transaction.type == "sale").first()
        return sale
