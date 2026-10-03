from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.core.database import get_db
from app.core.config import settings
from app.core.auth import verify_password, create_access_token, get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# ── Demo users: works on Vercel even without a writable SQLite DB ──────────────
DEMO_USERS = {
    "c1001@upay.com": {
        "password": "pass123",
        "id": 1001,
        "role": "customer",
        "customer_id": "C1001",
        "display_name": "Demo Customer",
    },
    "authority@upay.com": {
        "password": "auth123",
        "id": 9001,
        "role": "authority",
    },
}

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> Any:
    # ── Demo shortcut (Vercel / no-DB environments) ────────────────────────────
    demo = DEMO_USERS.get(request.email)
    if demo and request.password == demo["password"]:
        access_token = create_access_token(
            data={"sub": str(demo["id"]), "role": demo["role"]},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        user_data: dict = {
            "id": demo["id"],
            "email": request.email,
            "role": demo["role"],
        }
        if demo["role"] == "customer":
            user_data["customer_id"] = demo["customer_id"]
            user_data["display_name"] = demo["display_name"]
        return {"access_token": access_token, "token_type": "bearer", "user": user_data}

    # ── Fallback: real DB lookup (works locally with seeded data) ──────────────
    try:
        user = db.query(User).filter(User.email == request.email).first()
        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role},
            expires_delta=access_token_expires,
        )
        user_data = {"id": user.id, "email": user.email, "role": user.role}
        if user.role == "customer" and user.customer:
            user_data["customer_id"] = user.customer.customer_id
            user_data["display_name"] = user.customer.display_name
        return {"access_token": access_token, "token_type": "bearer", "user": user_data}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)) -> Any:
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
    }
    if current_user.role == "customer" and current_user.customer:
        user_data["customer_id"] = current_user.customer.customer_id
        user_data["display_name"] = current_user.customer.display_name
    return user_data
