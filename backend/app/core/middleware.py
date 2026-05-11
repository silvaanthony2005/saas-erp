from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from backend.app.core.database import SessionLocal
from backend.app.models.core import License
from backend.app.services.license_service import LicenseService
import datetime

class LicenseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Excluir rutas de activación y documentación
        path = request.url.path
        if path.startswith("/api/v1/activate") or path.startswith("/docs") or path.startswith("/openapi.json") or path == "/":
            return await call_next(request)

        db = SessionLocal()
        license_info = db.query(License).first()
        
        if not license_info:
            # Si no hay registro, creamos uno con el HWID actual (inicio de trial)
            hwid = LicenseService.get_hwid()
            license_info = License(hwid=hwid, install_date=datetime.datetime.utcnow(), is_active=False)
            db.add(license_info)
            db.commit()
            db.refresh(license_info)

        # Si ya está activado permanentemente, procedemos
        if license_info.is_active:
            db.close()
            return await call_next(request)

        # Verificar trial
        trial = LicenseService.check_trial_status(license_info.install_date)
        if trial["is_expired"]:
            db.close()
            raise HTTPException(status_code=403, detail="Trial expired. Please activate your license.")

        db.close()
        return await call_next(request)
