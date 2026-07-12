from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import List, Optional

# Base schema for Sale fields
class SaleBase(BaseModel):
    order_id: str
    order_date: date
    ship_date: date
    ship_mode: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    segment: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    region: Optional[str] = None
    product_id: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    product_name: Optional[str] = None
    sales: float
    quantity: int
    discount: float
    profit: float

class SaleResponse(SaleBase):
    row_id: int

    model_config = ConfigDict(from_attributes=True)

class PaginatedSales(BaseModel):
    total_records: int
    page: int
    limit: int
    records: List[SaleResponse]

class UploadResponse(BaseModel):
    uploaded_rows: int
    duplicate_rows: int
    invalid_rows: int

# KPI Response Schema
class KPIResponse(BaseModel):
    total_sales: float
    total_profit: float
    total_orders: int
    total_customers: int
    average_order_value: float
    profit_margin: float
    average_discount: float
    total_quantity_sold: int

# Dropdown options response schema
class FilterOptionsResponse(BaseModel):
    categories: List[str]
    sub_categories: List[str]
    regions: List[str]
    states: List[str]
    segments: List[str]
    min_date: Optional[date] = None
    max_date: Optional[date] = None

# Business Insights Response Schema
class InsightsResponse(BaseModel):
    best_performing_category: Optional[str] = None
    lowest_profit_category: Optional[str] = None
    highest_sales_region: Optional[str] = None
    fastest_growing_month: Optional[str] = None
    product_highest_sales: Optional[str] = None
    customer_highest_spending: Optional[str] = None
    discount_impact_status: Optional[str] = None
