# E-Commerce Sales Analytics Dashboard

A responsive, full-stack executive business intelligence dashboard. It ingests e-commerce transactional data from spreadsheet uploads (CSV), validates and deduplicates records in Python using Pandas, calculates high-performance operational metrics (KPIs) directly inside PostgreSQL using raw SQL queries (CTEs, Window Functions, LAG, and Aggregates), and visualizes the results on an interactive React dashboard.

---

## 💼 Resume-Ready Project Description
* Developed a full-stack **E-Commerce Sales Analytics Dashboard** using **FastAPI**, **React (Vite)**, and **PostgreSQL** to enable executive-level operational decision making.
* Implemented a high-throughput CSV ingestion system using **Pandas** that processes transactional records, standardizes headers, strips whitespaces, runs validations on field types, identifies duplicates, and handles bulk inserts into PostgreSQL.
* Architected a performant database schema with specialized indexing on querying fields (`order_date`, `customer_id`, `product_id`, `category`, and `region`).
* Engineered advanced PostgreSQL analytical queries utilizing **Common Table Expressions (CTEs)**, window functions (`LAG` for MoM growth, `RANK` for top performers), and aggregated operations to eliminate in-memory calculation bottlenecks on the web server.
* Created a responsive single-page application (SPA) featuring visual graphs using **Chart.js** (Line, Bar, Doughnut, Horizontal Bar, Scatter plot for discount-to-profit correlation) and interactive filter widgets to slice data dynamically by date range, geography, segment, and category.
* Implemented a rules-based business insights engine calculating statistics directly from database aggregates, such as discount-to-loss impact, fastest growing month-over-month sales, and regional outliers.

---

## 🛠️ Tech Stack
* **Frontend:** React, Vite, Chart.js (`react-chartjs-2`), Lucide React, CSS Custom Properties
* **Backend:** Python FastAPI, Uvicorn, Pandas, Pydantic v2
* **Database:** PostgreSQL (with indexed querying columns)
* **ORM:** SQLAlchemy v2
* **Data Import:** Pandas CSV Engine
* **API format:** REST JSON

---

## 📁 Folder Structure
```text
ecommerce-analytics/
 ├── backend/
 │    ├── main.py            # API entrypoint, CORS, and File Ingestion
 │    ├── database.py        # SQLAlchemy engine and local session helper
 │    ├── models.py          # SQLAlchemy Sales table representation
 │    ├── schemas.py         # Pydantic serialization and API response schemas
 │    ├── crud.py            # Database paginated ledger queries
 │    ├── analytics.py       # Raw PostgreSQL query analytical functions
 │    ├── requirements.txt   # Backend dependencies list
 │    └── .env.example       # Example database configurations env
 ├── frontend/
 │    ├── src/
 │    │    ├── components/
 │    │    │    ├── FilterBar.jsx
 │    │    │    ├── KPICard.jsx
 │    │    │    └── Sidebar.jsx
 │    │    ├── pages/
 │    │    │    ├── Dashboard.jsx
 │    │    │    ├── Upload.jsx
 │    │    │    └── SalesRecords.jsx
 │    │    ├── services/
 │    │    │    └── api.js      # REST API client
 │    │    ├── App.jsx         # App router and startup health verify
 │    │    ├── index.css       # Unified design token stylesheet
 │    │    └── main.jsx        # Bootstrap script
 │    ├── package.json
 │    ├── vite.config.js
 │    └── index.html
 ├── data/
 │    └── sample_sales.csv   # 60 test transaction rows
 ├── sql/
 │    ├── schema.sql         # PostgreSQL schema definition with indexes
 │    └── analytics_queries.sql # Raw SQL analytical queries documentation
 └── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
* **PostgreSQL** instance running locally or hosted.
* **Node.js** (v18+) and **npm** (v9+).
* **Python** (v3.10+).

---

### Step 1: Database Setup
1. Create a database in PostgreSQL:
   ```sql
   CREATE DATABASE ecommerce_analytics;
   ```
2. Initialize the table schema and indexes using the provided SQL file:
   ```bash
   psql -U postgres -d ecommerce_analytics -f sql/schema.sql
   ```
   *(Alternatively, copy and run the contents of [sql/schema.sql](file:///C:/Users/ROHITH%20KUMAR/OneDrive/Desktop/E-Commerce%20Sales/sql/schema.sql) in your PGAdmin or SQL client).*

---

### Step 2: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and copy environment variables:
   ```bash
   copy .env.example .env
   ```
   Edit `.env` to match your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce_analytics
   ```
3. Create a virtual environment and install requirements:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend will be available at `http://localhost:8000`. You can inspect the interactive Swagger docs at `http://localhost:8000/docs`.

---

### Step 3: Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The interactive dashboard will be open at `http://localhost:5173`.

---

## 📥 Ingestion Payload Schema (CSV)
The `/upload` API accepts file uploads with the following columns:

| Column Name | Expected Format | Description |
| :--- | :--- | :--- |
| **order_id** | `Text` (Required) | Transaction identifier |
| **order_date** | `YYYY-MM-DD` (Required) | Order placement date |
| **ship_date** | `YYYY-MM-DD` (Required) | Dispatch date |
| **ship_mode** | `Text` | Ship carrier class |
| **customer_id** | `Text` (Required) | Customer account ID |
| **customer_name** | `Text` | Customer contact name |
| **segment** | `Consumer`/`Corporate`/`Home Office` | Customer classification segment |
| **country** | `Text` | Country |
| **city** | `Text` | City |
| **state** | `Text` | State |
| **postal_code** | `Text` | Postal Zip |
| **region** | `East`/`West`/`Central`/`South` | Geographic division |
| **product_id** | `Text` (Required) | Unique item SKU |
| **category** | `Furniture`/`Office Supplies`/`Technology` | Product department |
| **sub_category** | `Text` | Product family class |
| **product_name** | `Text` | Product description |
| **sales** | `Numeric` (Required) | Sales transaction revenue |
| **quantity** | `Integer` (Required) | Number of units sold |
| **discount** | `Numeric` (Required) | Applied discount decimal fraction (e.g. `0.20` for 20%) |
| **profit** | `Numeric` (Required) | Calculated net profit (can be negative for loss) |

---

## 📈 REST API Endpoints

### Core Operations
* `GET  /health` - Health check. Verifies connection to PostgreSQL database.
* `POST /upload` - Upload sales transaction logs in CSV format. Performs parsing, column type check, whitespace trimming, row deduplication, and bulk insertion.
* `GET  /sales` - Lists paginated transactional entries with server-side sorting and text search.
* `GET  /filters` - Returns distinct values (categories, subcategories, states, regions, segments) currently active in the database to populate filter widgets.

### Analytics & Reports (Supports dynamic URL query parameters filtering)
* `GET  /analytics/kpis` - Fetches totals (Sales, Profit, Orders, Customers, AOV, Margin, Quantity, Avg Discount).
* `GET  /analytics/monthly-sales` - Returns monthly sales and profit aggregates.
* `GET  /analytics/category-sales` - Retrieves category and subcategory sales.
* `GET  /analytics/category-profit` - Compiles category net profit margins.
* `GET  /analytics/top-products` - Compiles top 10 products by sales revenue and bottom 10 products by losses using window ranking.
* `GET  /analytics/top-customers` - Compiles top 10 highest spending accounts.
* `GET  /analytics/region-sales` - Compiles total revenue by geographic region.
* `GET  /analytics/segment-sales` - Compiles sales by customer segment.
* `GET  /analytics/discount-impact` - Returns aggregated profits grouped by discount rates for correlation scatter charts.
* `GET  /analytics/monthly-growth` - Calculates month-over-month growth values and percentage using window function `LAG`.
* `GET  /analytics/insights` - Runs rules-based heuristic operations inside the database to return text summaries of leaders, growth rates, and discount-to-profit loss risks.
