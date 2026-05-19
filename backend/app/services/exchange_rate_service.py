import requests
from sqlalchemy.orm import Session
from app.models.exchange_rate import ExchangeRate
import datetime

class ExchangeRateService:
    @staticmethod
    def fetch_bcv_rate():
        """
        Obtiene la tasa oficial del Dólar desde DolarAPI (BCV).
        """
        try:
            response = requests.get("https://ve.dolarapi.com/v1/dolares/oficial", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return float(data.get("promedio", 0))
        except Exception as e:
            print(f"Error fetching BCV rate: {e}")
        return None

    @staticmethod
    def update_rate(db: Session, rate: float, source: str = "BCV"):
        """
        Actualiza o crea el registro de la tasa de cambio en la base de datos.
        """
        existing_rate = db.query(ExchangeRate).first()
        if existing_rate:
            existing_rate.rate = rate
            existing_rate.source = source
            existing_rate.updated_at = datetime.datetime.utcnow()
        else:
            new_rate = ExchangeRate(rate=rate, source=source)
            db.add(new_rate)
        
        db.commit()
        if existing_rate:
            db.refresh(existing_rate)
            return existing_rate
        return new_rate

    @staticmethod
    def get_current_rate(db: Session):
        """
        Retorna la tasa actual almacenada.
        """
        return db.query(ExchangeRate).first()

    @staticmethod
    def is_rate_stale(rate_obj: ExchangeRate):
        """
        Verifica si la tasa tiene más de 24 horas.
        """
        if not rate_obj:
            return True
        diff = datetime.datetime.utcnow() - rate_obj.updated_at
        return diff.total_seconds() > 86400
