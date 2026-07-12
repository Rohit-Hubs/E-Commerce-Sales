from sqlalchemy import Column, Integer, String, Date, Numeric
from database import Base

class Sale(Base):
    __tablename__ = "sales"

    row_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), nullable=False)
    order_date = Column(Date, nullable=False, index=True)
    ship_date = Column(Date, nullable=False)
    ship_mode = Column(String(50))
    customer_id = Column(String(50), nullable=False, index=True)
    customer_name = Column(String(100))
    segment = Column(String(50))
    country = Column(String(100))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column(String(20))
    region = Column(String(50), index=True)
    product_id = Column(String(50), nullable=False, index=True)
    category = Column(String(100), index=True)
    sub_category = Column(String(100))
    product_name = Column(String(255))
    sales = Column(Numeric(12, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    discount = Column(Numeric(5, 2), nullable=False)
    profit = Column(Numeric(12, 2), nullable=False)
