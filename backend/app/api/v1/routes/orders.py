from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate
from app.services.order_service import create_order, get_order_or_404, update_order_status

router = APIRouter()


@router.get("", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db)) -> list[Order]:
    statement = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    return list(db.scalars(statement).all())


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def place_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    return create_order(db, payload)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    return get_order_or_404(db, order_id)


@router.patch("/{order_id}/status", response_model=OrderRead)
def change_order_status(
    order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db)
) -> Order:
    return update_order_status(db, order_id, payload.status)

