from sqlalchemy import or_, desc, asc, func
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List, Dict, Any
import models

def get_sales(
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    sort_by: str = "order_date",
    sort_desc: bool = True,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    segment: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(models.Sale)

    # Apply date filters
    if start_date:
        query = query.filter(models.Sale.order_date >= start_date)
    if end_date:
        query = query.filter(models.Sale.order_date <= end_date)

    # Apply equality filters
    if category and category.strip():
        query = query.filter(models.Sale.category == category.strip())
    if sub_category and sub_category.strip():
        query = query.filter(models.Sale.sub_category == sub_category.strip())
    if region and region.strip():
        query = query.filter(models.Sale.region == region.strip())
    if state and state.strip():
        query = query.filter(models.Sale.state == state.strip())
    if segment and segment.strip():
        query = query.filter(models.Sale.segment == segment.strip())

    # Apply search filter (matches multiple columns case-insensitively)
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Sale.order_id.ilike(search_term),
                models.Sale.customer_name.ilike(search_term),
                models.Sale.product_name.ilike(search_term),
                models.Sale.customer_id.ilike(search_term),
                models.Sale.product_id.ilike(search_term),
                models.Sale.city.ilike(search_term),
                models.Sale.state.ilike(search_term)
            )
        )

    # Get total count before pagination
    total_records = query.count()

    # Determine sorting column
    sort_col = getattr(models.Sale, sort_by, models.Sale.order_date)
    if sort_desc:
        query = query.order_by(desc(sort_col), desc(models.Sale.row_id))
    else:
        query = query.order_by(asc(sort_col), asc(models.Sale.row_id))

    # Apply pagination
    offset = (page - 1) * limit
    records = query.offset(offset).limit(limit).all()

    return {
        "total_records": total_records,
        "page": page,
        "limit": limit,
        "records": records
    }

def get_filter_options(db: Session) -> Dict[str, Any]:
    # Query distinct values for each filter dropdown
    categories = [r[0] for r in db.query(models.Sale.category).distinct().filter(models.Sale.category != None).order_by(models.Sale.category).all()]
    sub_categories = [r[0] for r in db.query(models.Sale.sub_category).distinct().filter(models.Sale.sub_category != None).order_by(models.Sale.sub_category).all()]
    regions = [r[0] for r in db.query(models.Sale.region).distinct().filter(models.Sale.region != None).order_by(models.Sale.region).all()]
    states = [r[0] for r in db.query(models.Sale.state).distinct().filter(models.Sale.state != None).order_by(models.Sale.state).all()]
    segments = [r[0] for r in db.query(models.Sale.segment).distinct().filter(models.Sale.segment != None).order_by(models.Sale.segment).all()]

    # Also query min and max dates
    min_date_res = db.query(func.min(models.Sale.order_date)).scalar()
    max_date_res = db.query(func.max(models.Sale.order_date)).scalar()

    return {
        "categories": categories,
        "sub_categories": sub_categories,
        "regions": regions,
        "states": states,
        "segments": segments,
        "min_date": min_date_res,
        "max_date": max_date_res
    }

def insert_sales_bulk(db: Session, records: List[Dict[str, Any]]) -> int:
    db.bulk_insert_mappings(models.Sale, records)
    db.commit()
    return len(records)
