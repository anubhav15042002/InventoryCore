from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.models.inventory_transaction import InventoryTransaction
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate


def get_order_or_404(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def get_order_for_update_or_404(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
        .with_for_update()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def create_order(db: Session, payload: OrderCreate) -> Order:
    if db.get(Customer, payload.customer_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    product_ids = sorted(item.product_id for item in payload.items)
    products = db.scalars(
        select(Product).where(Product.id.in_(product_ids)).order_by(Product.id).with_for_update()
    ).all()
    product_by_id = {product.id: product for product in products}

    missing_ids = [product_id for product_id in product_ids if product_id not in product_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {missing_ids}",
        )

    for item in payload.items:
        product = product_by_id[item.product_id]
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Insufficient stock for {product.sku}. "
                    f"Available: {product.stock_quantity}, requested: {item.quantity}"
                ),
            )

    order = Order(customer_id=payload.customer_id, status=OrderStatus.PLACED.value)
    db.add(order)
    db.flush()

    total_amount = Decimal("0.00")
    for item in payload.items:
        product = product_by_id[item.product_id]
        subtotal = product.price * item.quantity
        product.stock_quantity -= item.quantity
        total_amount += subtotal
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
                subtotal=subtotal,
            )
        )
        db.add(
            InventoryTransaction(
                product_id=product.id,
                change_quantity=-item.quantity,
                transaction_type="order_placed",
                reference_id=order.id,
            )
        )

    order.total_amount = total_amount
    db.commit()
    return get_order_or_404(db, order.id)


def update_order_status(db: Session, order_id: int, new_status: OrderStatus) -> Order:
    order = get_order_for_update_or_404(db, order_id)
    current_status = OrderStatus(order.status)

    if current_status == new_status:
        return order
    if current_status in {OrderStatus.COMPLETED, OrderStatus.CANCELLED}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot change a {current_status.value} order",
        )

    if new_status == OrderStatus.CANCELLED:
        product_ids = sorted(item.product_id for item in order.items)
        products = db.scalars(
            select(Product).where(Product.id.in_(product_ids)).order_by(Product.id).with_for_update()
        ).all()
        product_by_id = {product.id: product for product in products}
        for item in order.items:
            product_by_id[item.product_id].stock_quantity += item.quantity
            db.add(
                InventoryTransaction(
                    product_id=item.product_id,
                    change_quantity=item.quantity,
                    transaction_type="order_cancelled",
                    reference_id=order.id,
                )
            )

    order.status = new_status.value
    db.commit()
    return get_order_or_404(db, order.id)
