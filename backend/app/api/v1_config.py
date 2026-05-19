from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.exchange_rate_service import ExchangeRateService
from pydantic import BaseModel
import datetime

router = APIRouter()

class ExchangeRateResponse(BaseModel):
    rate: float
    source: str
    updated_at: datetime.datetime
    is_stale: bool

class ManualRateUpdate(BaseModel):
    rate: float

@router.get("/current", response_model=ExchangeRateResponse)
def get_current_rate(db: Session = Depends(get_db)):
    rate_obj = ExchangeRateService.get_current_rate(db)
    if not rate_obj:
        # Intentar obtenerla en el momento si no hay ninguna
        val = ExchangeRateService.fetch_bcv_rate()
        if val:
            rate_obj = ExchangeRateService.update_rate(db, val, source="BCV")
        else:
            raise HTTPException(status_code=404, detail="No exchange rate found and could not fetch from API. Manual input required.")
    
    return {
        "rate": rate_obj.rate,
        "source": rate_obj.source,
        "updated_at": rate_obj.updated_at,
        "is_stale": ExchangeRateService.is_rate_stale(rate_obj)
    }

@router.post("/manual")
def update_rate_manual(data: ManualRateUpdate, db: Session = Depends(get_db)):
    if data.rate <= 0:
        raise HTTPException(status_code=400, detail="Rate must be greater than zero")
    
    rate_obj = ExchangeRateService.update_rate(db, data.rate, source="Manual")
    return {"message": "Rate updated manually", "rate": rate_obj.rate}
