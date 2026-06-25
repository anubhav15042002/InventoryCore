from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory_transaction import InventoryTransaction
from app.models.product import Product
from app.schemas.product import StockAdjustment


def adjust_stock(db: Session, product_id: int, adjustment: StockAdjustment) -> Product:
    product = db.scalar(select(Product).where(Product.id == product_id).with_for_update())
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    new_quantity = product.stock_quantity + adjustment.quantity_delta
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stock adjustment would make inventory negative",
        )

    product.stock_quantity = new_quantity
    db.add(
        InventoryTransaction(
            product_id=product.id,
            change_quantity=adjustment.quantity_delta,
            transaction_type="manual_adjustment",
            note=adjustment.note,
        )
    )
    db.commit()
    db.refresh(product)
    return product

