from decimal import Decimal

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Customer, Product


def seed() -> None:
    with SessionLocal() as db:
        if db.scalar(select(Product.id).limit(1)) is None:
            db.add_all(
                [
                    Product(
                        sku="LAP-001",
                        name="Developer Laptop",
                        description="14-inch laptop for engineering teams",
                        price=Decimal("1299.00"),
                        stock_quantity=12,
                    ),
                    Product(
                        sku="MON-001",
                        name="27-inch Monitor",
                        description="USB-C productivity display",
                        price=Decimal("349.00"),
                        stock_quantity=8,
                    ),
                    Product(
                        sku="KEY-001",
                        name="Mechanical Keyboard",
                        description="Compact wireless keyboard",
                        price=Decimal("129.00"),
                        stock_quantity=4,
                    ),
                ]
            )
        if db.scalar(select(Customer.id).limit(1)) is None:
            db.add_all(
                [
                    Customer(name="Asha Rao", email="asha@example.com", phone="+91 90000 00001"),
                    Customer(name="Rohan Mehta", email="rohan@example.com", phone="+91 90000 00002"),
                ]
            )
        db.commit()


if __name__ == "__main__":
    seed()
    print("Demo data inserted.")
