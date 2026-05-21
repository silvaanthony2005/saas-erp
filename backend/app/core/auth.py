from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.database import get_db, SessionLocal
from app.models.core import User, License

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer(auto_error=False)

ROLES = {
    "dueño": 3,
    "supervisor": 2,
    "cajero": 1,
}

LICENSE_MODULES = {
    "pos": "has_pos_module",
    "inventory": "has_inventory_module",
    "hr": "has_hr_module",
    "accounting": "has_accounting_module",
}

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

def require_role(*roles: str):
    async def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return dependency

def require_license(module: str):
    async def dependency(db: Session = Depends(get_db)):
        license_info = db.query(License).first()
        if not license_info:
            raise HTTPException(status_code=403, detail="No license found")
        flag = LICENSE_MODULES.get(module)
        if flag and not getattr(license_info, flag, False):
            raise HTTPException(status_code=403, detail=f"License does not include {module} module")
    return dependency

def seed_admin_user():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == "dueño").first()
        if existing:
            return
        admin = User(
            username="admin",
            full_name="Administrador",
            hashed_password=hash_password("admin123"),
            is_active=True,
            role="dueño",
        )
        db.add(admin)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
