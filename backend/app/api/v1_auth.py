from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_role,
)
from app.models.core import User

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    full_name: str
    role: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str = ""
    role: str = "cajero"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    is_active: bool
    role: str

@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
    )

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("dueño")),
):
    users = db.query(User).all()
    return [UserResponse(id=u.id, username=u.username, full_name=u.full_name, is_active=u.is_active, role=u.role) for u in users]

@router.post("/users", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("dueño")),
):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=data.username,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, username=user.username, full_name=user.full_name, is_active=user.is_active, role=user.role)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("dueño")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.username is not None:
        user.username = data.username
    if data.password is not None:
        user.hashed_password = hash_password(data.password)
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, username=user.username, full_name=user.full_name, is_active=user.is_active, role=user.role)

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("dueño")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
