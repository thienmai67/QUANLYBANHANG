# TDT Platform • Nền Tảng Báo Giá & Phân Phối Vật Tư Cơ Điện (M&E)

> Đồ án môn học: **Công nghệ phần mềm nâng cao**  
> Phương pháp phát triển: **Agile Scrum (Sprint 1 Active)**  
> Kiến trúc: **Clean Architecture (Go) + Next.js 14 + PostgreSQL 16**

---

## 1. Tổng Quan Dự Án
TDT Platform là giải pháp thương mại điện tử B2B/B2C và tự động hóa bóc tách khối lượng (Bill of Materials - BOM) cho các nhà thầu thi công Cơ Điện (M&E). 

Hệ thống giải quyết 3 bài toán đặc thù ngành vật tư kỹ thuật:
1. **Tự động quy đổi đơn vị đóng gói sang đơn vị bóc tách cơ sở**: Cây 4m $\rightarrow$ Mét (ống Bình Minh), Cuộn 100m $\rightarrow$ Mét (dây Cadivi), Hộp $\rightarrow$ Cái, Bao $\rightarrow$ Cái.
2. **Chiết khấu đại lý cấp 1 chính hãng**: Tự động khấu trừ chiết khấu trực tiếp theo biểu phí nhà máy (-18% Bình Minh, -22% Cadivi, -15% Panasonic).
3. **Phân quyền vai trò RBAC chặt chẽ (5 Roles)**: `CUSTOMER`, `SALE`, `MANAGER`, `SHIPPER`, `ADMIN` điều phối vòng đời đơn hàng `PENDING` $\rightarrow$ `APPROVED` $\rightarrow$ `SHIPPING` $\rightarrow$ `DELIVERED`.

---

## 2. Cấu Trúc Mã Nguồn

```
vlxd-dien-nuoc/
├── backend/                  # Go Clean Architecture API
│   ├── cmd/server/main.go    # Entry point & Chi router
│   ├── internal/
│   │   ├── domain/           # Entities, Enums & Repository Interfaces
│   │   ├── repository/       # PostgreSQL sqlx persistence
│   │   └── handler/          # HTTP Handlers
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── frontend/                 # Next.js 14 App Router (Tailwind CSS, TypeScript)
│   ├── src/
│   │   ├── app/              # Layout, Globals & Root Page
│   │   ├── components/       # Bento Hero, BOM Estimator, Order Pipeline, Product Catalog
│   │   ├── lib/              # API Client & Fallbacks
│   │   └── types/            # TypeScript Schemas & RBAC Types
│   ├── Dockerfile
│   └── package.json
├── migrations/               # PostgreSQL DDL & Seed Data
│   └── 000001_init_schema.up.sql
├── contracts/                # OpenAPI 3.0 Specification
│   └── openapi.yaml
├── docker-compose.yml        # Orchestration (DB, Backend, Frontend)
└── Makefile                  # Build & migration automation scripts
```

---

## 3. Ngăn Xếp Công Nghệ (Tech Stack)

- **Backend**: Golang 1.24, `go-chi/chi/v5`, `jmoiron/sqlx`, `lib/pq`
- **Frontend**: Next.js 14.2 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Database**: PostgreSQL 16 (UUID primary keys với `pgcrypto`, JSONB specs, Numeric currency)
- **API Spec**: OpenAPI 3.0
- **DevOps**: Docker, Docker Compose

---

## 4. Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Chạy Frontend Nhanh (Local Dev)
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại: `http://localhost:3000`

### Cách 2: Khởi Chạy Toàn Bộ Hệ Thống với Docker
```bash
docker compose up -d
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api/v1/health`
- PostgreSQL: `localhost:5432` (user: `postgres`, password: `postgrespassword`, db: `vlxd_db`)

---

## 5. Danh Mục Vật Tư Chuẩn Hóa
- **Hệ Nước (Plumbing)**: Ống uPVC $\Phi 21 - 114\text{mm}$, Co $90^\circ$ uPVC Bình Minh.
- **Hệ Điện (Electrical)**: Dây đơn ruột đồng Cadivi CV $1.5 - 10\text{mm}^2$, Aptomat chống giật Panasonic RCBO 2P $16 - 32\text{A}$.
