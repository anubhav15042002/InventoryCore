from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InventoryTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    change_quantity: int
    transaction_type: str
    reference_id: int | None
    note: str | None
    created_at: datetime

