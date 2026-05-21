from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from datetime import datetime, date
from typing import List
from app.models.business import Receivable, ReceivablePayment, ReceivableSchedule, Customer
from app.services.exchange_rate_service import ExchangeRateService

class CxCService:
    @staticmethod
    def get_receivables(db: Session, skip: int = 0, limit: int = 100,
                         status: str = None, customer_id: int = None):
        query = db.query(Receivable)
        if status:
            query = query.filter(Receivable.status.in_(["pending", "partially_paid"]))
        if customer_id:
            query = query.filter(Receivable.customer_id == customer_id)
        total = query.count()
        items = query.order_by(Receivable.created_at.desc()).offset(skip).limit(limit).all()
        return {"receivables": items, "total": total}

    @staticmethod
    def get_receivable_by_id(db: Session, receivable_id: int):
        r = db.query(Receivable).filter(Receivable.id == receivable_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="CxC no encontrada")
        return r

    @staticmethod
    def make_payment(db: Session, receivable_id: int, amount_bs: float,
                     payment_method: str = "cash", reference_number: str = None, current_user=None):
        user_id = current_user.id if current_user else None
        receivable = db.query(Receivable).filter(Receivable.id == receivable_id).first()
        if not receivable:
            raise HTTPException(status_code=404, detail="CxC no encontrada")
        if receivable.remaining_usd <= 0:
            raise HTTPException(status_code=400, detail="La CxC ya está totalmente pagada")

        current_rate_obj = ExchangeRateService.get_current_rate(db)
        current_rate = current_rate_obj.rate if current_rate_obj else 1.0

        if amount_bs <= 0:
            raise HTTPException(status_code=400, detail="El monto en Bs debe ser positivo")

        amount_usd = round(amount_bs / current_rate, 2)

        # Si el monto en Bs es tan pequeño que no alcanza $0.01, rechazar
        min_bs = round(0.01 * current_rate, 2)
        if amount_usd < 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"El monto mínimo es Bs {min_bs:.2f} (equivalente a $0.01 a tasa {current_rate:.2f})"
            )

        if amount_usd > receivable.remaining_usd:
            max_bs = round(receivable.remaining_usd * current_rate, 2)
            raise HTTPException(
                status_code=400,
                detail=f"El pago excede el saldo pendiente. Máximo: Bs {max_bs:.2f} (${receivable.remaining_usd:.2f} a tasa {current_rate:.2f})"
            )

        payment = ReceivablePayment(
            receivable_id=receivable.id,
            amount_usd=amount_usd,
            amount_bs=amount_bs,
            exchange_rate=current_rate,
            payment_method=payment_method,
            reference_number=reference_number,
            created_by=user_id
        )
        db.add(payment)

        receivable.remaining_usd = round(receivable.remaining_usd - amount_usd, 2)
        if receivable.remaining_usd <= 0:
            receivable.status = "paid"
            receivable.remaining_usd = 0
        else:
            receivable.status = "partially_paid"

        # Auto-marcar cuotas del cronograma como pagadas
        pending = db.query(ReceivableSchedule).filter(
            ReceivableSchedule.receivable_id == receivable_id,
            ReceivableSchedule.status == "pending"
        ).order_by(ReceivableSchedule.due_date.asc()).all()

        remaining_to_assign = amount_usd
        for inst in pending:
            if remaining_to_assign <= 0:
                break
            if inst.amount_usd <= remaining_to_assign:
                inst.status = "paid"
                remaining_to_assign = round(remaining_to_assign - inst.amount_usd, 2)
            else:
                # Pago parcial de la cuota: no marcamos como pagada
                break

        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def get_payment_history(db: Session, receivable_id: int):
        return db.query(ReceivablePayment).filter(
            ReceivablePayment.receivable_id == receivable_id
        ).order_by(ReceivablePayment.payment_date.desc()).all()

    @staticmethod
    def get_summary(db: Session):
        total_pending_usd = db.query(
            func.sum(Receivable.remaining_usd)
        ).filter(
            Receivable.status.in_(["pending", "partially_paid"])
        ).scalar() or 0.0

        total_overdue_usd = db.query(
            func.sum(Receivable.remaining_usd)
        ).filter(
            Receivable.status.in_(["pending", "partially_paid"]),
            Receivable.due_date < date.today()
        ).scalar() or 0.0

        total_paid_usd = db.query(
            func.sum(Receivable.total_usd)
        ).filter(
            Receivable.status == "paid"
        ).scalar() or 0.0

        return {
            "total_pending_usd": total_pending_usd,
            "total_overdue_usd": total_overdue_usd,
            "total_paid_usd": total_paid_usd
        }

    @staticmethod
    def get_customer_balance(db: Session, customer_id: int):
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        receivables = db.query(Receivable).filter(
            Receivable.customer_id == customer_id,
            Receivable.status.in_(["pending", "partially_paid"])
        ).all()

        total_debt_usd = sum(r.remaining_usd for r in receivables)
        return {
            "customer_id": customer_id,
            "customer_name": f"{customer.first_name} {customer.last_name}",
            "total_debt_usd": total_debt_usd,
            "credit_limit_usd": customer.credit_limit_usd,
            "available_credit_usd": max(0, customer.credit_limit_usd - total_debt_usd),
            "active_receivables": len(receivables)
        }

    @staticmethod
    def get_schedule(db: Session, receivable_id: int):
        receivable = db.query(Receivable).filter(Receivable.id == receivable_id).first()
        if not receivable:
            raise HTTPException(status_code=404, detail="CxC no encontrada")
        items = db.query(ReceivableSchedule).filter(
            ReceivableSchedule.receivable_id == receivable_id
        ).order_by(ReceivableSchedule.due_date.asc()).all()
        return [
            {
                "id": s.id,
                "amount_usd": s.amount_usd,
                "due_date": s.due_date.isoformat(),
                "status": s.status,
                "notes": s.notes
            }
            for s in items
        ]

    @staticmethod
    def setup_schedule(db: Session, receivable_id: int, installments: List[dict]):
        receivable = db.query(Receivable).filter(Receivable.id == receivable_id).first()
        if not receivable:
            raise HTTPException(status_code=404, detail="CxC no encontrada")

        total_planned = sum(i["amount_usd"] for i in installments)
        if abs(total_planned - receivable.total_usd) > 0.05:
            raise HTTPException(
                status_code=400,
                detail=f"La suma de cuotas (${total_planned:.2f}) debe ser igual al total de la CxC (${receivable.total_usd:.2f})"
            )

        db.query(ReceivableSchedule).filter(
            ReceivableSchedule.receivable_id == receivable_id
        ).delete()

        for inst in installments:
            try:
                parsed_date = date.fromisoformat(inst["due_date"])
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Fecha inválida: {inst['due_date']}. Use YYYY-MM-DD")
            item = ReceivableSchedule(
                receivable_id=receivable_id,
                amount_usd=inst["amount_usd"],
                due_date=parsed_date,
                notes=inst.get("notes", "")
            )
            db.add(item)

        db.commit()
        return CxCService.get_schedule(db, receivable_id)
