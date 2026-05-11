import wmi
import hashlib
import datetime
from typing import Optional
from backend.app.core.config import settings

class LicenseService:
    @staticmethod
    def get_hwid() -> str:
        try:
            c = wmi.WMI()
            # Obtenemos el serial del baseboard (placa madre)
            for board in c.Win32_BaseBoard():
                return str(board.SerialNumber).strip()
        except Exception:
            # Fallback si falla WMI (puedes usar el serial del disco o MAC)
            import platform
            return platform.node()
        return "UNKNOWN_HWID"

    @classmethod
    def generate_license_hash(cls, hwid: str) -> str:
        # Algoritmo simple: SHA256(HWID + SECRET)
        combined = f"{hwid}{settings.SECRET_KEY}"
        return hashlib.sha256(combined.encode()).hexdigest()

    @classmethod
    def verify_license(cls, hwid: str, key: str) -> bool:
        expected = cls.generate_license_hash(hwid)
        return key == expected

    @staticmethod
    def check_trial_status(install_date: datetime.datetime) -> dict:
        now = datetime.datetime.utcnow()
        diff = now - install_date
        days_passed = diff.days
        is_expired = days_passed > 30
        return {
            "days_passed": days_passed,
            "days_remaining": max(0, 30 - days_passed),
            "is_expired": is_expired
        }
