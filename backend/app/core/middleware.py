from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.database import SessionLocal
from app.models.core import License
from app.services.license_service import LicenseService
import datetime

class LicenseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        if path.startswith("/api/v1/activate") or path.startswith("/docs") or path.startswith("/openapi.json") or path == "/":
            return await call_next(request)
        
        if method == "OPTIONS":
            return await call_next(request)

        db = SessionLocal()
        license_info = db.query(License).first()
        
        if not license_info:
            hwid = LicenseService.get_hwid()
            license_info = License(hwid=hwid, install_date=datetime.datetime.utcnow(), is_active=False)
            db.add(license_info)
            db.commit()
            db.refresh(license_info)

        if license_info.is_active:
            db.close()
            return await call_next(request)

        trial = LicenseService.check_trial_status(license_info.install_date)
        if trial["is_expired"]:
            db.close()
            raise HTTPException(status_code=403, detail="Trial expired. Please activate your license.")

        db.close()
        return await call_next(request)