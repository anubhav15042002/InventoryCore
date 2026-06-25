from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    sku: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()


class ProductCreate(ProductBase):
    stock_quantity: int = Field(default=0, ge=0)


class ProductUpdate(ProductBase):
    pass


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stock_quantity: int
    created_at: datetime
    updated_at: datetime


class StockAdjustment(BaseModel):
    quantity_delta: int
    note: str | None = Field(default=None, max_length=255)

    @field_validator("quantity_delta")
    @classmethod
    def quantity_must_change(cls, value: int) -> int:
        if value == 0:
            raise ValueError("quantity_delta must not be zero")
        return value

