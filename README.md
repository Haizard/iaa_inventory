# Inventory Management System
**Institute of Accountancy Arusha — Group 86**

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT |

## Setup

### 1. Database
Make sure PostgreSQL is running, then the database `inventory_db` should already exist.

### 2. Server
```bash
cd server
cp .env.example .env   # edit DATABASE_URL if needed
npm install
npx prisma migrate dev
npx tsx src/seed.ts    # seeds demo data
npm run dev            # runs on http://localhost:5000
```

### 3. Client
```bash
cd client
npm install
npm run dev            # runs on http://localhost:5173
```

## Default Login
```
Email:    admin@inventory.com
Password: admin123
```

## Features
- **Dashboard** — stats overview, sales chart, low-stock alerts
- **Products** — CRUD, stock tracking, low-stock filter
- **Categories** — organize products
- **Suppliers** — supplier management
- **Sales** — record sales, auto-deduct stock
- **Purchases** — purchase orders, auto-increment stock
- **JWT Auth** — role-based access (Admin / Manager / Staff)
