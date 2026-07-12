import io
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, Dict, Any, List
import pandas as pd
from sqlalchemy import text
from database import get_db, engine, Base
import models
import schemas
import crud
import analytics
# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="E-Commerce Sales Analytics API")

# Configure CORS to allow access from frontend url
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Common filters dependency
class SalesFilters:
    def __init__(
        self,
        start_date: Optional[date] = Query(None),
        end_date: Optional[date] = Query(None),
        category: Optional[str] = Query(None),
        sub_category: Optional[str] = Query(None),
        region: Optional[str] = Query(None),
        state: Optional[str] = Query(None),
        segment: Optional[str] = Query(None),
    ):
        self.start_date = start_date
        self.end_date = end_date
        self.category = category
        self.sub_category = sub_category
        self.region = region
        self.state = state
        self.segment = segment

    def to_clause_and_params(self) -> tuple[str, dict]:
        return analytics.get_filter_clause(
            start_date=self.start_date,
            end_date=self.end_date,
            category=self.category,
            sub_category=self.sub_category,
            region=self.region,
            state=self.state,
            segment=self.segment
        )

# 1. Health check endpoint
@app.get("/health", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    try:
        # Try a simple select to verify DB connectivity
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )
# 2. File Upload endpoint
@app.post("/upload", response_model=schemas.UploadResponse)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported."
        )
        
    try:
        contents = await file.read()
        # Run process in Pandas
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading CSV file: {str(e)}"
        )

    # Clean headers
    df.columns = [col.strip().lower().replace(" ", "_").replace("-", "_") for col in df.columns]

    # Required columns verification
    required_cols = [
        "order_id", "order_date", "ship_date", "customer_id", 
        "product_id", "sales", "quantity", "discount", "profit"
    ]
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV file is missing required columns: {', '.join(missing_cols)}"
        )

    # Structure all target table columns
    all_db_cols = [
        "order_id", "order_date", "ship_date", "ship_mode", "customer_id",
        "customer_name", "segment", "country", "city", "state", "postal_code",
        "region", "product_id", "category", "sub_category", "product_name",
        "sales", "quantity", "discount", "profit"
    ]

    # Fill missing optional columns with None
    for col in all_db_cols:
        if col not in df.columns:
            df[col] = None

    # Filter out columns that are not in our database schema
    df = df[all_db_cols]

    # Trim whitespace from all string columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({'nan': None, 'None': None, '': None})

    # Count and remove duplicate rows
    duplicate_mask = df.duplicated()
    duplicate_count = int(duplicate_mask.sum())
    df = df[~duplicate_mask]

    # Clean and convert numeric / date columns, tracking invalid rows
    df['order_date_parsed'] = pd.to_datetime(df['order_date'], errors='coerce')
    df['ship_date_parsed'] = pd.to_datetime(df['ship_date'], errors='coerce')
    
    df['sales_parsed'] = pd.to_numeric(df['sales'], errors='coerce')
    df['quantity_parsed'] = pd.to_numeric(df['quantity'], errors='coerce')
    df['discount_parsed'] = pd.to_numeric(df['discount'], errors='coerce')
    df['profit_parsed'] = pd.to_numeric(df['profit'], errors='coerce')

    # A row is valid if: essential IDs are present, dates are parsed, and numerical values are parsed
    is_valid = (
        df['order_id'].notna() & (df['order_id'] != "") &
        df['customer_id'].notna() & (df['customer_id'] != "") &
        df['product_id'].notna() & (df['product_id'] != "") &
        df['order_date_parsed'].notna() &
        df['ship_date_parsed'].notna() &
        df['sales_parsed'].notna() &
        df['quantity_parsed'].notna() &
        df['discount_parsed'].notna() &
        df['profit_parsed'].notna()
    )

    valid_df = df[is_valid].copy()
    invalid_count = int(len(df) - len(valid_df))

    # Format values for final db insertion
    valid_df['order_date'] = valid_df['order_date_parsed'].dt.date
    valid_df['ship_date'] = valid_df['ship_date_parsed'].dt.date
    valid_df['sales'] = valid_df['sales_parsed'].astype(float)
    valid_df['quantity'] = valid_df['quantity_parsed'].astype(int)
    valid_df['discount'] = valid_df['discount_parsed'].astype(float)
    valid_df['profit'] = valid_df['profit_parsed'].astype(float)

    # Select only columns matching the database fields
    valid_df = valid_df[all_db_cols]
    records_to_insert = valid_df.to_dict(orient="records")

    uploaded_count = 0
    if records_to_insert:
        try:
            uploaded_count = crud.insert_sales_bulk(db, records_to_insert)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database write error: {str(e)}"
            )

    return {
        "uploaded_rows": uploaded_count,
        "duplicate_rows": duplicate_count,
        "invalid_rows": invalid_count
    }

# 3. Paginated sales records endpoint
@app.get("/sales", response_model=schemas.PaginatedSales)
def read_sales(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("order_date"),
    sort_desc: bool = Query(True),
    filters: SalesFilters = Depends(),
    db: Session = Depends(get_db)
):
    # Allowed columns for sorting to prevent SQL injection
    allowed_sort = [
        "order_date", "sales", "quantity", "discount", "profit", 
        "order_id", "customer_name", "product_name", "category", "region"
    ]
    if sort_by not in allowed_sort:
        sort_by = "order_date"
        
    return crud.get_sales(
        db=db,
        page=page,
        limit=limit,
        search=search,
        sort_by=sort_by,
        sort_desc=sort_desc,
        start_date=filters.start_date,
        end_date=filters.end_date,
        category=filters.category,
        sub_category=filters.sub_category,
        region=filters.region,
        state=filters.state,
        segment=filters.segment
    )

# 4. Filters options lookup
@app.get("/filters", response_model=schemas.FilterOptionsResponse)
def read_filters(db: Session = Depends(get_db)):
    return crud.get_filter_options(db)

# 5. KPIs analytics endpoint
@app.get("/analytics/kpis", response_model=schemas.KPIResponse)
def get_kpis(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_kpis(db, filters_str, params)

# 6. Monthly sales trend analytics endpoint
@app.get("/analytics/monthly-sales")
def get_monthly_sales_trend(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_monthly_sales(db, filters_str, params)

# 7. Category sales analytics endpoint
@app.get("/analytics/category-sales")
def get_category_sales(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_category_sales(db, filters_str, params)

# 8. Category profit analytics endpoint
@app.get("/analytics/category-profit")
def get_category_profit(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_category_profit(db, filters_str, params)

# 9. Top products analytics endpoint
@app.get("/analytics/top-products")
def get_top_products(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_top_products(db, filters_str, params)

# 10. Top customers analytics endpoint
@app.get("/analytics/top-customers")
def get_top_customers(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_top_customers(db, filters_str, params)

# 11. Region sales analytics endpoint
@app.get("/analytics/region-sales")
def get_region_sales(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_region_sales(db, filters_str, params)

# 12. Segment sales analytics endpoint
@app.get("/analytics/segment-sales")
def get_segment_sales(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_segment_sales(db, filters_str, params)

# 13. Discount impact analytics endpoint
@app.get("/analytics/discount-impact")
def get_discount_impact(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_discount_impact(db, filters_str, params)

# 14. Monthly growth rate analytics endpoint
@app.get("/analytics/monthly-growth")
def get_monthly_growth(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_monthly_growth(db, filters_str, params)

# 15. Rule-based business insights endpoint
@app.get("/analytics/insights", response_model=schemas.InsightsResponse)
def get_insights(filters: SalesFilters = Depends(), db: Session = Depends(get_db)):
    filters_str, params = filters.to_clause_and_params()
    return analytics.get_insights(db, filters_str, params)
