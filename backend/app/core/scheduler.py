import asyncio
from app.core.database import SessionLocal
from app.services.exchange_rate_service import ExchangeRateService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def update_exchange_rate_task():
    """
    Tarea periódica para actualizar la tasa del BCV.
    """
    while True:
        db = None
        try:
            db = SessionLocal()
            logger.info("Intentando actualizar tasa BCV...")
            rate = ExchangeRateService.fetch_bcv_rate()
            
            if rate:
                ExchangeRateService.update_rate(db, rate, source="BCV")
                logger.info(f"Tasa BCV actualizada exitosamente: {rate}")
            else:
                logger.warning("No se pudo obtener la tasa BCV de la API.")
        except Exception as e:
            logger.error(f"Error en la tarea de actualización de tasa: {e}")
        finally:
            if db:
                db.close()
        
        # Esperar 24 horas (86400 segundos) para la próxima actualización
        # En una app de escritorio, esto se ejecuta mientras el launcher esté abierto
        await asyncio.sleep(86400)
