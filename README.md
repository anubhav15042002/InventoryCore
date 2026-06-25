# InventoryCore - Inventory & Order Management System

InventoryCore is a full-stack inventory and order management platform for managing products, customers, orders, and stock movement from a responsive operations dashboard.

Built with FastAPI, React, PostgreSQL, Docker, and Docker Compose.

## Live Links

| Service | URL |
| --- | --- |
| Frontend | Coming soon |
| Backend API Docs | Coming soon |
| Docker Image | Coming soon |

## Overview

InventoryCore helps businesses maintain product catalogues, track customer orders, validate stock availability, and record inventory transactions. The backend protects inventory consistency by validating stock before order creation and reducing product quantity automatically when orders are placed.

## Features

### Product Management

- Create, update, view, and delete products
- Unique SKU/code validation
- Product price and stock tracking
- Manual stock adjustment
- Low-stock visibility

### Customer Management

- Create, update, view, and delete customers
- Unique customer email validation
- Customer contact and address storage
- Protection against deleting customers with existing orders

### Order Management

- Create customer orders with multiple products
- Backend-calculated order totals
- Inventory validation before order placement
- Automatic stock reduction after successful order creation
- Order status updates
- Stock restoration when an order is cancelled

### Inventory Tracking

- Inventory transaction history
- Manual adjustment logs
- Order placement logs
- Order cancellation logs
- Audit-friendly stock movement records

### Developer Features

- FastAPI Swagger documentation
- SQLAlchemy ORM models
- Pydantic request/response validation
- Alembic database migrations
- Pytest test suite
- Dockerized local development

## Tech Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Pydantic
- Pytest

### Frontend

- React
- TypeScript
- Vite
- TanStack Query
- React Router

### DevOps and Deployment

- Docker
- Docker Compose
- Render
- Vercel
- Neon PostgreSQL
- Docker Hub

## Project Structure

```text
inventory-order-management/
  backend/
    alembic/
    app/
      api/
      core/
      db/
      models/
      schemas/
      services/
    scripts/
    tests/
    Dockerfile
    pyproject.toml

  frontend/
    src/
      api/
      components/
      pages/
      types/
    Dockerfile
    package.json
    vite.config.ts

  docker-compose.yml
  render.yaml
  .env.example
```

## System Architecture

```text
Customers
  |
  v
Orders
  |
  v
Order Items
  |
  v
Products
  |
  v
Inventory Transactions
```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/anubhav15042002/InventoryCore.git
cd InventoryCore
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Default local values:

```env
POSTGRES_DB=inventory_db
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=change_me
DATABASE_URL=postgresql+psycopg://inventory_user:change_me@db:5432/inventory_db
BACKEND_CORS_ORIGINS=http://localhost:5173
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Start Application

```bash
docker compose up --build
```

### 4. Seed Demo Data

```bash
docker compose exec backend python -m scripts.seed
```

## Local URLs

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

## Run Tests

```bash
docker compose run --rm backend pytest
```

## API Overview

Base path:

```text
/api/v1
```

Main endpoints:

```text
GET    /dashboard/summary

POST   /products
GET    /products
GET    /products/{id}
PUT    /products/{id}
PATCH  /products/{id}/stock
DELETE /products/{id}

POST   /customers
GET    /customers
GET    /customers/{id}
PUT    /customers/{id}
DELETE /customers/{id}

POST   /orders
GET    /orders
GET    /orders/{id}
PATCH  /orders/{id}/status

GET    /inventory-transactions
```

## Business Rules

- Product SKU/code must be unique.
- Customer email must be unique.
- Product quantity cannot be negative.
- Orders cannot be placed if inventory is insufficient.
- Creating an order automatically reduces available stock.
- Total order amount is calculated by the backend.
- Cancelling an order restores stock.
- Products and customers referenced by existing orders cannot be deleted.

## Docker

The application is containerized with Docker Compose.

Services:

- `frontend`: React application
- `backend`: FastAPI API
- `db`: PostgreSQL database

Start all services:

```bash
docker compose up --build
```

Stop all services:

```bash
docker compose down
```

## Deployment

### Frontend

Deploy the `frontend` folder on Vercel.

Environment variable:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api/v1
```

### Backend

Deploy the `backend` folder on Render.

Environment variables:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DB_NAME?sslmode=require
BACKEND_CORS_ORIGINS=https://your-frontend-url.vercel.app
```

### Database

Use a hosted PostgreSQL database such as Neon.

## Docker Image

Build backend image:

```bash
docker build -t inventorycore-api ./backend
```

After publishing to Docker Hub, update the Docker image link in the Live Links section.

## Notes

A `409 Conflict` response while deleting a product or customer can be expected if that record is already referenced by an order. This protects historical order records and database integrity.
