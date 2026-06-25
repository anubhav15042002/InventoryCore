from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.inventory_transaction import InventoryTransaction
from app.schemas.inventory import InventoryTransactionRead

router = APIRouter()


@router.get("", response_model=list[InventoryTransactionRead])
def list_inventory_transactions(db: Session = Depends(get_db)) -> list[InventoryTransaction]:
    statement = select(InventoryTransaction).order_by(InventoryTransaction.created_at.desc())
    return list(db.scalars(statement).all())

