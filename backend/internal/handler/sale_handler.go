package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

type SaleHandler struct {
	saleRepo    domain.SaleRepository
	productRepo domain.ProductRepository
}

func NewSaleHandler(saleRepo domain.SaleRepository, productRepo domain.ProductRepository) *SaleHandler {
	return &SaleHandler{
		saleRepo:    saleRepo,
		productRepo: productRepo,
	}
}

func getActorSaleID(r *http.Request) (uuid.UUID, error) {
	claims, ok := middleware.GetClaimsFromContext(r.Context())
	if !ok || claims == nil {
		return uuid.Nil, errors.New("unauthorized")
	}
	return uuid.Parse(claims.UserID)
}

// GET /api/v1/sale/dashboard
func (h *SaleHandler) GetDashboardStats(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	stats, err := h.saleRepo.GetDashboardStats(req.Context(), saleID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi tải thống kê dashboard sale")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(stats)
}

// GET /api/v1/sale/customers
func (h *SaleHandler) ListCustomers(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))
	query := req.URL.Query().Get("q")

	customers, total, err := h.saleRepo.ListCustomersForSale(req.Context(), saleID, query, limit, offset)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn danh sách khách hàng")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data":  customers,
		"total": total,
	})
}

// GET /api/v1/sale/customers/{id}
func (h *SaleHandler) GetCustomer(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	idStr := chi.URLParam(req, "id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID khách hàng không hợp lệ")
		return
	}

	customer, err := h.saleRepo.GetCustomerForSale(req.Context(), customerID, saleID)
	if err != nil {
		if errors.Is(err, domain.ErrCustomerNotFound) {
			writeAPIError(w, http.StatusNotFound, "CUSTOMER_NOT_FOUND", "Không tìm thấy khách hàng trong phạm vi phụ trách")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn hồ sơ khách hàng")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(customer)
}

// POST /api/v1/sale/customers
func (h *SaleHandler) CreateCustomer(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	var reqBody domain.CreateSaleCustomerRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu khách hàng không hợp lệ")
		return
	}

	if strings.TrimSpace(reqBody.FullName) == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_NAME", "Họ và tên khách hàng là bắt buộc")
		return
	}
	if strings.TrimSpace(reqBody.Email) == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_EMAIL", "Email khách hàng là bắt buộc")
		return
	}

	customer, err := h.saleRepo.CreateCustomerForSale(req.Context(), saleID, reqBody)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "CREATE_FAILED", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(customer)
}

// PUT /api/v1/sale/customers/{id}
func (h *SaleHandler) UpdateCustomer(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	idStr := chi.URLParam(req, "id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID khách hàng không hợp lệ")
		return
	}

	var reqBody domain.UpdateSaleCustomerRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu cập nhật không hợp lệ")
		return
	}

	if strings.TrimSpace(reqBody.FullName) == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_NAME", "Họ và tên khách hàng là bắt buộc")
		return
	}

	err = h.saleRepo.UpdateCustomerProfile(req.Context(), customerID, saleID, reqBody)
	if err != nil {
		if errors.Is(err, domain.ErrCustomerNotFound) {
			writeAPIError(w, http.StatusNotFound, "CUSTOMER_NOT_FOUND", "Không tìm thấy khách hàng trong phạm vi phụ trách")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi cập nhật hồ sơ khách hàng")
		return
	}

	updated, err := h.saleRepo.GetCustomerForSale(req.Context(), customerID, saleID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi lấy thông tin khách hàng cập nhật")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

// POST /api/v1/sale/customers/{id}/assign (Manager only)
func (h *SaleHandler) AssignCustomer(w http.ResponseWriter, req *http.Request) {
	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}
	if claims.Role != domain.RoleManager {
		writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Chỉ quản lý (Manager) mới có quyền phân công khách hàng")
		return
	}

	managerID, err := uuid.Parse(claims.UserID)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "ID người dùng không hợp lệ")
		return
	}

	idStr := chi.URLParam(req, "id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID khách hàng không hợp lệ")
		return
	}

	var reqBody domain.AssignCustomerRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil || reqBody.SaleID == uuid.Nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Cần chỉ định ID của nhân viên bán hàng (saleId)")
		return
	}

	err = h.saleRepo.AssignCustomer(req.Context(), customerID, reqBody.SaleID, managerID)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "ASSIGN_FAILED", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message":    "Phân công khách hàng thành công",
		"customerId": customerID,
		"saleId":     reqBody.SaleID,
	})
}

// GET /api/v1/sale/quotes
func (h *SaleHandler) ListQuotes(w http.ResponseWriter, req *http.Request) {
	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	var saleIDPtr *uuid.UUID
	if claims.Role == domain.RoleSale {
		parsed, err := uuid.Parse(claims.UserID)
		if err != nil {
			writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "ID người dùng không hợp lệ")
			return
		}
		saleIDPtr = &parsed
	}

	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))

	var statusPtr, qPtr *string
	var custPtr *uuid.UUID
	if s := req.URL.Query().Get("status"); s != "" {
		statusPtr = &s
	}
	if q := req.URL.Query().Get("q"); q != "" {
		qPtr = &q
	}
	if c := req.URL.Query().Get("customer_id"); c != "" {
		if cid, err := uuid.Parse(c); err == nil {
			custPtr = &cid
		}
	}
	var fromPtr, toPtr *time.Time
	if f := req.URL.Query().Get("from"); f != "" {
		if t, err := time.Parse(time.RFC3339, f); err == nil {
			fromPtr = &t
		}
	}
	if tStr := req.URL.Query().Get("to"); tStr != "" {
		if t, err := time.Parse(time.RFC3339, tStr); err == nil {
			toPtr = &t
		}
	}

	quotes, total, err := h.saleRepo.ListQuotes(req.Context(), saleIDPtr, domain.SaleQuoteFilters{
		Status:     statusPtr,
		CustomerID: custPtr,
		From:       fromPtr,
		To:         toPtr,
		Query:      qPtr,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn danh sách báo giá")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data":  quotes,
		"total": total,
	})
}

// GET /api/v1/sale/quotes/{id}
func (h *SaleHandler) GetQuote(w http.ResponseWriter, req *http.Request) {
	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	var saleIDPtr *uuid.UUID
	if claims.Role == domain.RoleSale {
		parsed, err := uuid.Parse(claims.UserID)
		if err != nil {
			writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "ID người dùng không hợp lệ")
			return
		}
		saleIDPtr = &parsed
	}

	idStr := chi.URLParam(req, "id")
	quoteID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID báo giá không hợp lệ")
		return
	}

	quote, err := h.saleRepo.GetQuoteByID(req.Context(), quoteID, saleIDPtr)
	if err != nil {
		if errors.Is(err, domain.ErrQuoteNotFound) {
			writeAPIError(w, http.StatusNotFound, "QUOTE_NOT_FOUND", "Không tìm thấy báo giá")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn báo giá")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(quote)
}

// POST /api/v1/sale/quotes
func (h *SaleHandler) CreateQuote(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	var reqBody domain.CreateQuoteRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu báo giá không hợp lệ")
		return
	}

	if reqBody.CustomerID == uuid.Nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_CUSTOMER", "Vui lòng chọn khách hàng")
		return
	}
	if len(reqBody.Items) == 0 {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ITEMS", "Báo giá phải có ít nhất 1 sản phẩm")
		return
	}

	quote, err := h.saleRepo.CreateQuote(req.Context(), saleID, reqBody)
	if err != nil {
		if errors.Is(err, domain.ErrCustomerNotFound) {
			writeAPIError(w, http.StatusNotFound, "CUSTOMER_NOT_FOUND", "Khách hàng không thuộc phạm vi phụ trách của bạn")
			return
		}
		writeAPIError(w, http.StatusBadRequest, "CREATE_FAILED", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(quote)
}

// PUT /api/v1/sale/quotes/{id}
func (h *SaleHandler) UpdateQuote(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	idStr := chi.URLParam(req, "id")
	quoteID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID báo giá không hợp lệ")
		return
	}

	var reqBody domain.UpdateQuoteRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu cập nhật không hợp lệ")
		return
	}

	quote, err := h.saleRepo.UpdateQuote(req.Context(), quoteID, saleID, reqBody)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrQuoteNotFound):
			writeAPIError(w, http.StatusNotFound, "QUOTE_NOT_FOUND", "Không tìm thấy báo giá")
		case errors.Is(err, domain.ErrQuoteNotEditable):
			writeAPIError(w, http.StatusBadRequest, "QUOTE_NOT_EDITABLE", "Báo giá đã gửi (SENT) hoặc đã chuyển đổi không thể chỉnh sửa trực tiếp. Vui lòng sử dụng tính năng Nhân bản để tạo báo giá mới.")
		default:
			writeAPIError(w, http.StatusBadRequest, "UPDATE_FAILED", err.Error())
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(quote)
}

// POST /api/v1/sale/quotes/{id}/send
func (h *SaleHandler) SendQuote(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	idStr := chi.URLParam(req, "id")
	quoteID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID báo giá không hợp lệ")
		return
	}

	quote, err := h.saleRepo.SendQuote(req.Context(), quoteID, saleID)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrQuoteNotFound):
			writeAPIError(w, http.StatusNotFound, "QUOTE_NOT_FOUND", "Không tìm thấy báo giá")
		case errors.Is(err, domain.ErrQuoteDiscountExceeded):
			writeAPIError(w, http.StatusBadRequest, "DISCOUNT_EXCEEDED", "Chiết khấu vượt hạn mức tối đa (10%). Cần sự phê duyệt của Manager trước khi gửi.")
		case errors.Is(err, domain.ErrQuoteExpired):
			writeAPIError(w, http.StatusBadRequest, "QUOTE_EXPIRED", "Báo giá đã quá thời hạn hiệu lực, không thể gửi.")
		default:
			writeAPIError(w, http.StatusBadRequest, "SEND_FAILED", err.Error())
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(quote)
}

// POST /api/v1/sale/quotes/{id}/convert
func (h *SaleHandler) ConvertQuote(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	idStr := chi.URLParam(req, "id")
	quoteID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID báo giá không hợp lệ")
		return
	}

	order, err := h.saleRepo.ConvertQuoteToOrder(req.Context(), quoteID, saleID)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrQuoteNotFound):
			writeAPIError(w, http.StatusNotFound, "QUOTE_NOT_FOUND", "Không tìm thấy báo giá")
		case errors.Is(err, domain.ErrQuoteAlreadyConverted):
			writeAPIError(w, http.StatusConflict, "ALREADY_CONVERTED", "Báo giá này đã được chuyển thành đơn hàng trước đó.")
		case errors.Is(err, domain.ErrQuoteDiscountExceeded):
			writeAPIError(w, http.StatusBadRequest, "DISCOUNT_EXCEEDED", "Báo giá có chiết khấu vượt hạn mức (>10%) chưa được Manager phê duyệt.")
		case errors.Is(err, domain.ErrQuoteInvalidStatusForConvert):
			writeAPIError(w, http.StatusBadRequest, "INVALID_STATUS", "Chỉ có thể chuyển đổi đơn từ báo giá ở trạng thái ĐÃ GỬI (SENT) hoặc ĐÃ DUYỆT (ACCEPTED).")
		case errors.Is(err, domain.ErrQuoteExpired):
			writeAPIError(w, http.StatusBadRequest, "QUOTE_EXPIRED", "Báo giá đã hết hạn hiệu lực.")
		default:
			writeAPIError(w, http.StatusBadRequest, "CONVERT_FAILED", err.Error())
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(order)
}

// PATCH /api/v1/sale/quotes/{id}/approve (Manager only)
func (h *SaleHandler) ApproveQuote(w http.ResponseWriter, req *http.Request) {
	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}
	if claims.Role != domain.RoleManager {
		writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Chỉ quản lý (Manager) mới có quyền duyệt báo giá vượt hạn mức")
		return
	}

	managerID, err := uuid.Parse(claims.UserID)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "ID người dùng không hợp lệ")
		return
	}

	idStr := chi.URLParam(req, "id")
	quoteID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID báo giá không hợp lệ")
		return
	}

	quote, err := h.saleRepo.ApproveQuote(req.Context(), quoteID, managerID)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "APPROVE_FAILED", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(quote)
}

// PATCH /api/v1/sale/quotes/{id}/reject (Manager only)
func (h *SaleHandler) RejectQuote(w http.ResponseWriter, req *http.Request) {
	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}
	if claims.Role != domain.RoleManager {
		writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Chỉ quản lý (Manager) mới có quyền từ chối báo giá")
		return
	}

	managerID, err := uuid.Parse(claims.UserID)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "ID người dùng không hợp lệ")
		return
	}

	idStr := chi.URLParam(req, "id")
	quoteID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID báo giá không hợp lệ")
		return
	}

	var reqBody domain.RejectQuoteRequest
	_ = json.NewDecoder(req.Body).Decode(&reqBody)
	reason := strings.TrimSpace(reqBody.Reason)
	if reason == "" {
		reason = "Từ chối bởi Quản lý"
	}

	quote, err := h.saleRepo.RejectQuote(req.Context(), quoteID, managerID, reason)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "REJECT_FAILED", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(quote)
}

// GET /api/v1/sale/activities
func (h *SaleHandler) ListActivities(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))

	var custPtr *uuid.UUID
	if c := req.URL.Query().Get("customer_id"); c != "" {
		if cid, err := uuid.Parse(c); err == nil {
			custPtr = &cid
		}
	}

	var isDonePtr *bool
	if d := req.URL.Query().Get("is_done"); d != "" {
		val := d == "true" || d == "1"
		isDonePtr = &val
	}

	dueToday := req.URL.Query().Get("due_today") == "true"
	overdue := req.URL.Query().Get("overdue") == "true"

	activities, total, err := h.saleRepo.ListActivities(req.Context(), saleID, domain.ActivityFilters{
		CustomerID: custPtr,
		IsDone:     isDonePtr,
		DueToday:   dueToday,
		Overdue:    overdue,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn lịch sử chăm sóc")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data":  activities,
		"total": total,
	})
}

// POST /api/v1/sale/activities
func (h *SaleHandler) CreateActivity(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	var reqBody domain.CreateActivityRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu hoạt động chăm sóc không hợp lệ")
		return
	}

	if reqBody.CustomerID == uuid.Nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_CUSTOMER", "Vui lòng chọn khách hàng")
		return
	}
	if strings.TrimSpace(reqBody.Content) == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_CONTENT", "Nội dung chăm sóc không được để trống")
		return
	}

	act, err := h.saleRepo.CreateActivity(req.Context(), saleID, reqBody)
	if err != nil {
		if errors.Is(err, domain.ErrCustomerNotFound) {
			writeAPIError(w, http.StatusNotFound, "CUSTOMER_NOT_FOUND", "Khách hàng không thuộc phạm vi phụ trách của bạn")
			return
		}
		writeAPIError(w, http.StatusBadRequest, "CREATE_FAILED", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(act)
}

// PUT /api/v1/sale/activities/{id}
func (h *SaleHandler) UpdateActivity(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	idStr := chi.URLParam(req, "id")
	activityID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID hoạt động không hợp lệ")
		return
	}

	var reqBody domain.UpdateActivityRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu cập nhật không hợp lệ")
		return
	}

	act, err := h.saleRepo.UpdateActivity(req.Context(), activityID, saleID, reqBody)
	if err != nil {
		if errors.Is(err, domain.ErrActivityNotFound) {
			writeAPIError(w, http.StatusNotFound, "ACTIVITY_NOT_FOUND", "Không tìm thấy bản ghi hoạt động")
			return
		}
		writeAPIError(w, http.StatusBadRequest, "UPDATE_FAILED", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(act)
}

// GET /api/v1/sale/payments
func (h *SaleHandler) ListPayments(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))

	unpaidOnly := req.URL.Query().Get("unpaid_only") == "true"
	overdueOnly := req.URL.Query().Get("overdue_only") == "true"

	var custPtr *uuid.UUID
	if c := req.URL.Query().Get("customer_id"); c != "" {
		if cid, err := uuid.Parse(c); err == nil {
			custPtr = &cid
		}
	}

	items, total, err := h.saleRepo.GetPaymentList(req.Context(), saleID, domain.SalePaymentFilters{
		UnpaidOnly:  unpaidOnly,
		OverdueOnly: overdueOnly,
		CustomerID:  custPtr,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn danh sách thanh toán/công nợ")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data":  items,
		"total": total,
	})
}

// POST /api/v1/sale/payments/{orderId}/notes
func (h *SaleHandler) AddPaymentNote(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	idStr := chi.URLParam(req, "orderId")
	orderID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID đơn hàng không hợp lệ")
		return
	}

	var reqBody domain.CreatePaymentNoteRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu ghi chú thu tiền không hợp lệ")
		return
	}

	if reqBody.Amount <= 0 {
		writeAPIError(w, http.StatusBadRequest, "INVALID_AMOUNT", "Số tiền thu phải > 0")
		return
	}
	if strings.TrimSpace(reqBody.Method) == "" {
		reqBody.Method = "TIỀN MẶT / CHUYỂN KHOẢN"
	}

	note, err := h.saleRepo.AddPaymentNote(req.Context(), orderID, saleID, reqBody)
	if err != nil {
		if errors.Is(err, domain.ErrOrderNotFound) {
			writeAPIError(w, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng trong phạm vi của bạn")
			return
		}
		writeAPIError(w, http.StatusBadRequest, "ADD_FAILED", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(note)
}

// GET /api/v1/sale/reports/summary
func (h *SaleHandler) GetReportSummary(w http.ResponseWriter, req *http.Request) {
	saleID, err := getActorSaleID(req)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	var fromPtr, toPtr *time.Time
	if f := req.URL.Query().Get("from"); f != "" {
		if t, err := time.Parse(time.RFC3339, f); err == nil {
			fromPtr = &t
		}
	}
	if tStr := req.URL.Query().Get("to"); tStr != "" {
		if t, err := time.Parse(time.RFC3339, tStr); err == nil {
			toPtr = &t
		}
	}

	report, err := h.saleRepo.GetReportSummary(req.Context(), saleID, fromPtr, toPtr)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi tổng hợp báo cáo hiệu suất sale")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(report)
}

// POST /api/v1/sale/orders/{id}/assign (Manager only)
func (h *SaleHandler) AssignOrder(w http.ResponseWriter, req *http.Request) {
	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}
	if claims.Role != domain.RoleManager {
		writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Chỉ quản lý (Manager) mới có quyền phân công đơn hàng")
		return
	}

	idStr := chi.URLParam(req, "id")
	orderID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID đơn hàng không hợp lệ")
		return
	}

	var reqBody domain.AssignOrderRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil || reqBody.SaleID == uuid.Nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Cần chỉ định ID của nhân viên bán hàng (saleId)")
		return
	}

	err = h.saleRepo.AssignOrder(req.Context(), orderID, reqBody.SaleID)
	if err != nil {
		if errors.Is(err, domain.ErrOrderNotFound) {
			writeAPIError(w, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi phân công đơn hàng")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message": "Phân công đơn hàng thành công",
		"orderId": orderID,
		"saleId":  reqBody.SaleID,
	})
}

// GET /api/v1/sale/staff (Manager and Sale)
func (h *SaleHandler) ListSalesStaff(w http.ResponseWriter, req *http.Request) {
	staff, err := h.saleRepo.ListSalesStaff(req.Context())
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn danh sách nhân viên bán hàng")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data": staff,
	})
}

