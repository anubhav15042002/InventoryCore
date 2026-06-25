from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.schemas.dashboard import DashboardSummary

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    return DashboardSummary(
        products=db.scalar(select(func.count()).select_from(Product)) or 0,
        customers=db.scalar(select(func.count()).select_from(Customer)) or 0,
        orders=db.scalar(select(func.count()).select_from(Order)) or 0,
        low_stock_products=(
            db.scalar(select(func.count()).select_from(Product).where(Product.stock_quantity <= 5))
            or 0
        ),
    )

