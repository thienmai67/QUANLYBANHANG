# Hợp Đồng API Thay Đổi & Mới — TDT M&E Platform

Tài liệu kỹ thuật đặc tả các API endpoints mới và thay đổi sau đợt hardening cho backend TDT M&E. Dành cho team Frontend tích hợp trực tiếp mà không cần hỏi lại.

---

## 1. POST /api/v1/auth/refresh (Xoay vòng Token / Refresh Token Rotation)

Cấp cặp Access Token và Refresh Token mới khi Access Token hiện tại hết hạn hoặc sắp hết hạn.

- **Method**: `POST`
- **Path**: `/api/v1/auth/refresh`
- **Auth Header**: Không yêu cầu (Public endpoint)
- **Content-Type**: `application/json`

### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Specs

#### 200 OK — Làm mới token thành công
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 7200
}
```

#### 400 Bad Request — Dữ liệu gửi lên không đúng định dạng
```json
{
  "code": "INVALID_REQUEST",
  "message": "Vui lòng cung cấp refreshToken"
}
```

#### 401 Unauthorized — Refresh Token sai, hết hạn hoặc truyền nhầm Access Token
```json
{
  "code": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

---

## 2. PATCH /api/v1/orders/{id}/status (Chuyển trạng thái đơn hàng & Optimistic Locking)

Cập nhật trạng thái đơn hàng theo luồng vòng đời chuẩn. Kiểm soát xung đột ghi đồng thời bằng trường `version`.

- **Method**: `PATCH`
- **Path**: `/api/v1/orders/{id}/status` (trong đó `{id}` là UUID của đơn hàng)
- **Auth Header**: `Authorization: Bearer <accessToken>`
- **Roles được phép**: `ADMIN`, `MANAGER`, `SHIPPER`
- **Content-Type**: `application/json`

### Luồng chuyển trạng thái hợp lệ
- `PENDING` $\rightarrow$ `PACKING`, `CANCELLED`
- `PACKING` $\rightarrow$ `SHIPPING`, `CANCELLED`
- `SHIPPING` $\rightarrow$ `DELIVERED`, `CANCELLED`
- `DELIVERED` $\rightarrow$ Không thể chuyển tiếp (Terminal State)
- `CANCELLED` $\rightarrow$ Không thể chuyển tiếp (Terminal State)

> **Lưu ý về phân quyền Shipper**:
> Tài khoản có role `SHIPPER` chỉ được phép cập nhật đơn hàng có `shipper_id` khớp với `userId` trong token của mình. Nếu không khớp sẽ nhận mã lỗi `403 Forbidden`.

### Request Body
```json
{
  "status": "PACKING",
  "version": 1
}
```

### Response Specs

#### 200 OK — Cập nhật trạng thái thành công
```json
{
  "id": "e445091b-64d5-4556-9a2c-f6ebfe4f7063",
  "orderNumber": "ORD-261008-AB12CD",
  "customerId": "8f8ef1ef-f604-4530-9df1-c88f1d8f5ef1",
  "customerName": "Nguyễn Văn A",
  "shipperId": "9b642ca2-1a48-4330-95b8-d218841dafc5",
  "paymentMethod": "COD",
  "is2h": false,
  "deadline2h": null,
  "deliveredAt": null,
  "cancellationReason": null,
  "totalAmount": 1500000,
  "status": "PACKING",
  "version": 2,
  "createdAt": "2026-10-08T14:30:00Z",
  "updatedAt": "2026-10-08T15:00:00Z"
}
```
*(Nếu chuyển sang `DELIVERED`, trường `deliveredAt` sẽ được server tự động gán thời điểm hiện tại).*

#### 400 Bad Request — ID sai định dạng hoặc bước chuyển trạng thái không hợp lệ
```json
{
  "code": "INVALID_TRANSITION",
  "message": "Chuyển đổi trạng thái không hợp lệ"
}
```

#### 401 Unauthorized — Chưa đăng nhập hoặc token không hợp lệ
```json
{
  "code": "UNAUTHORIZED",
  "message": "Chưa xác thực người dùng"
}
```

#### 403 Forbidden — Không đủ quyền hoặc Shipper sửa đơn không thuộc về mình
```json
{
  "code": "FORBIDDEN",
  "message": "Không có quyền thực hiện thao tác này"
}
```

#### 404 Not Found — Không tìm thấy đơn hàng với UUID tương ứng
```json
{
  "code": "ORDER_NOT_FOUND",
  "message": "Không tìm thấy đơn hàng"
}
```

#### 409 Conflict — Xung đột phiên bản dữ liệu (Optimistic Locking)
Xảy ra khi client gửi `version` không khớp với `version` hiện tại trong DB (do đã có người khác cập nhật trước). Frontend cần tải lại chi tiết đơn hàng để lấy `version` mới nhất rồi thực hiện lại.
```json
{
  "code": "VERSION_CONFLICT",
  "message": "Xung đột phiên bản dữ liệu"
}
```

---

## 3. POST /api/v1/orders (Tạo đơn hàng mới)

Server quản lý toàn bộ logic tính tiền và trạng thái ban đầu. Server **không tin** giá bán và tổng tiền từ client gửi lên; mọi giá bán được truy vấn trực tiếp từ bảng `products.base_price` và làm tròn số nguyên (VND). Trạng thái luôn bị ép thành `PENDING`.

- **Method**: `POST`
- **Path**: `/api/v1/orders`
- **Auth Header**: `Authorization: Bearer <accessToken>`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "customerName": "Công ty TNHH Cơ Điện Ánh Dương",
  "paymentMethod": "BANK_TRANSFER",
  "is2h": false,
  "items": [
    {
      "productId": "787f0b5d-2fe8-4448-93ea-a4d1f21503c5",
      "quantity": 10
    },
    {
      "productId": "88a9c1f2-1111-4448-93ea-bb22cc33dd44",
      "quantity": 5
    }
  ]
}
```

### Response Specs

#### 201 Created — Tạo đơn hàng thành công
```json
{
  "id": "2d8f95c0-ae7a-4412-8ea7-a367ba0813f0",
  "orderNumber": "ORD-261008-K9X82Z",
  "customerId": "8f8ef1ef-f604-4530-9df1-c88f1d8f5ef1",
  "customerName": "Công ty TNHH Cơ Điện Ánh Dương",
  "paymentMethod": "BANK_TRANSFER",
  "is2h": false,
  "deadline2h": null,
  "deliveredAt": null,
  "cancellationReason": null,
  "totalAmount": 2850000,
  "status": "PENDING",
  "version": 1,
  "items": [
    {
      "id": "e89f8983-338b-4b13-8fcb-c124879201e5",
      "orderId": "2d8f95c0-ae7a-4412-8ea7-a367ba0813f0",
      "productId": "787f0b5d-2fe8-4448-93ea-a4d1f21503c5",
      "quantity": 10,
      "unitPrice": 185000,
      "createdAt": "2026-10-08T15:10:00Z"
    },
    {
      "id": "52857442-9999-4c12-9ab2-88123019fba2",
      "orderId": "2d8f95c0-ae7a-4412-8ea7-a367ba0813f0",
      "productId": "88a9c1f2-1111-4448-93ea-bb22cc33dd44",
      "quantity": 5,
      "unitPrice": 200000,
      "createdAt": "2026-10-08T15:10:00Z"
    }
  ],
  "createdAt": "2026-10-08T15:10:00Z",
  "updatedAt": "2026-10-08T15:10:00Z"
}
```

#### 400 Bad Request — Dữ liệu không hợp lệ hoặc số lượng quantity <= 0
```json
{
  "code": "INVALID_QUANTITY",
  "message": "Số lượng sản phẩm không hợp lệ"
}
```

#### 401 Unauthorized — Chưa xác thực tài khoản
```json
{
  "code": "UNAUTHORIZED",
  "message": "Chưa xác thực người dùng"
}
```

#### 404 Not Found — Sản phẩm trong danh sách items không tồn tại
```json
{
  "code": "PRODUCT_NOT_FOUND",
  "message": "Sản phẩm không tồn tại"
}
```

---

## 4. GET /api/v1/orders (Danh sách đơn hàng kèm Data Isolation)

Lấy danh sách đơn hàng có phân trang. Đảm bảo cô lập dữ liệu: role `CUSTOMER` chỉ nhìn thấy đơn hàng của chính mình.

- **Method**: `GET`
- **Path**: `/api/v1/orders?limit=50&offset=0`
- **Auth Header**: `Authorization: Bearer <accessToken>`
- **Query Params**:
  - `limit`: Số lượng bản ghi (mặc định 50, tối đa 100)
  - `offset`: Vị trí bắt đầu (mặc định 0)

### Phân quyền Data Isolation
- **CUSTOMER**: Server tự động lọc `customer_id = actor.id` từ token. Không thể xem đơn hàng của khách hàng khác.
- **MANAGER / ADMIN**: Được xem toàn bộ đơn hàng của tất cả khách hàng.

### Response Specs

#### 200 OK — Trả về danh sách đơn hàng
```json
[
  {
    "id": "2d8f95c0-ae7a-4412-8ea7-a367ba0813f0",
    "orderNumber": "ORD-261008-K9X82Z",
    "customerId": "8f8ef1ef-f604-4530-9df1-c88f1d8f5ef1",
    "customerName": "Công ty TNHH Cơ Điện Ánh Dương",
    "shipperId": null,
    "paymentMethod": "BANK_TRANSFER",
    "is2h": false,
    "deadline2h": null,
    "deliveredAt": null,
    "cancellationReason": null,
    "totalAmount": 2850000,
    "status": "PENDING",
    "version": 1,
    "createdAt": "2026-10-08T15:10:00Z",
    "updatedAt": "2026-10-08T15:10:00Z"
  }
]
```

#### 401 Unauthorized — Chưa gửi token hoặc token hết hạn
```json
{
  "code": "UNAUTHORIZED",
  "message": "Chưa xác thực người dùng"
}
```
