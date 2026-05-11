import os
import hashlib
import platform
import subprocess
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "StellarERP"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = hashlib.sha256(platform.node().encode()).hexdigest()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 

    @property
    def APPDATA_PATH(self) -> Path:
        if platform.system() == "Windows":
            path = Path(os.getenv("APPDATA", "./")) / "StellarERP"
        else:
            path = Path.home() / ".config" / "StellarERP"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def DATABASE_URL(self) -> str:
        db_file = self.APPDATA_PATH / "app_secure.db"
        return f"sqlite:///{db_file}"

    def get_hardware_id(self) -> str:
        try:
            if platform.system() == "Windows":
                cmd = "wmic csproduct get uuid"
                uuid = subprocess.check_output(cmd, shell=True).decode().split("\n")[1].strip()
                return hashlib.sha256(uuid.encode()).hexdigest()
        except:
            pass
        return hashlib.sha256(platform.node().encode()).hexdigest()

    class Config:
        case_sensitive = True

settings = Settings()

