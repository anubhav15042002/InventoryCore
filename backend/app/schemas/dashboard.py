from pydantic import BaseModel


class DashboardSummary(BaseModel):
    products: int
    customers: int
    orders: int
    low_stock_products: int

