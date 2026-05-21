from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from typing import List
from app.core.database import get_db
from app.core.auth import require_role, require_license
from app.schemas.purchasing import (
    CostingConfigResponse, CostingConfigUpdate,
    InventoryMovementResponse
)
from app.services.inventory_cost_service import InventoryCostService

router = APIRouter()

class PaginatedMovements(BaseModel):
    movements: List[InventoryMovementResponse]
    total: int
    page: int
    page_size: int

@router.get("/method", response_model=CostingConfigResponse)
def read_costing_method(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    method = InventoryCostService.get_costing_method(db)
    from app.models.purchasing import CostingConfig as CC
    config = db.query(CC).first()
    if not config:
        config = CC(method=method)
        db.add(config)
        db.commit()
        db.refresh(config)
    return CostingConfigResponse(method=config.method, updated_at=config.updated_at)

@router.put("/method", response_model=CostingConfigResponse)
def update_costing_method(
    data: CostingConfigUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    config = InventoryCostService.set_costing_method(db, data.method)
    return CostingConfigResponse(method=config.method, updated_at=config.updated_at)

@router.get("/kardex", response_model=PaginatedMovements)
def read_kardex(
    product_id: Optional[int] = Query(None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    result = InventoryCostService.get_kardex(db, product_id=product_id, skip=skip, limit=limit)
    movements = []
    for m in result["movements"]:
        m_data = InventoryMovementResponse.model_validate(m).model_dump()
        m_data["product_name"] = m.product.name if m.product else None
        movements.append(InventoryMovementResponse(**m_data))
    return PaginatedMovements(
        movements=movements,
        total=result["total"],
        page=(skip // limit) + 1,
        page_size=limit
    )
