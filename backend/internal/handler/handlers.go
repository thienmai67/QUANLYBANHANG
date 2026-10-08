package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

type Handler struct {
	productRepo domain.ProductRepository
}

func New(productRepo domain.ProductRepository) *Handler {
	return &Handler{productRepo: productRepo}
}

func writeAPIError(w http.ResponseWriter, statusCode int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": message,
		"code":    code,
	})
}

func (h *Handler) ListProducts(w http.ResponseWriter, req *http.Request) {
	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))

	products, err := h.productRepo.ListProducts(req.Context(), limit, offset)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn sản phẩm")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(products)
}

func (h *Handler) GetProduct(w http.ResponseWriter, req *http.Request) {
	idStr := chi.URLParam(req, "id")
	if idStr == "" {
		idStr = req.PathValue("id")
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "invalid product id")
		return
	}

	product, err := h.productRepo.GetProductByID(req.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrProductNotFound) {
			writeAPIError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", "product not found")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn sản phẩm")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(product)
}

func (h *Handler) GetProductBySKU(w http.ResponseWriter, req *http.Request) {
	sku := chi.URLParam(req, "sku")
	if sku == "" {
		sku = req.PathValue("sku")
	}
	if sku == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_SKU", "sku is required")
		return
	}

	product, err := h.productRepo.GetProductBySKU(req.Context(), sku)
	if err != nil {
		if errors.Is(err, domain.ErrProductNotFound) {
			writeAPIError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", "product not found")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn sản phẩm")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(product)
}

func (h *Handler) ListUnits(w http.ResponseWriter, req *http.Request) {
	units, err := h.productRepo.ListUnits(req.Context())
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn đơn vị")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(units)
}

func (h *Handler) ListBrands(w http.ResponseWriter, req *http.Request) {
	brands, err := h.productRepo.ListBrands(req.Context())
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn thương hiệu")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(brands)
}

func (h *Handler) ListCategories(w http.ResponseWriter, req *http.Request) {
	categories, err := h.productRepo.ListCategories(req.Context())
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn danh mục")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(categories)
}

func (h *Handler) ListOrders(w http.ResponseWriter, req *http.Request) {
	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))

	var customerID *uuid.UUID
	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if ok && claims != nil {
		if claims.Role == domain.RoleCustomer {
			if parsedID, err := uuid.Parse(claims.UserID); err == nil {
				customerID = &parsedID
			}
		}
	}

	orders, err := h.productRepo.ListOrders(req.Context(), customerID, limit, offset)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn đơn hàng")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(orders)
}

func (h *Handler) CreateOrder(w http.ResponseWriter, req *http.Request) {
	var order domain.Order
	if err := json.NewDecoder(req.Body).Decode(&order); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid order data")
		return
	}

	if order.ID == uuid.Nil {
		order.ID = uuid.New()
	}
	order.Status = domain.OrderStatusPending
	if order.OrderNumber == "" {
		order.OrderNumber = fmt.Sprintf("ORD-%s-%s", time.Now().Format("060102"), uuid.New().String()[:6])
	}

	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if ok && claims != nil {
		if parsedID, err := uuid.Parse(claims.UserID); err == nil {
			order.CustomerID = &parsedID
		}
	}

	now := time.Now()
	order.CreatedAt = now
	order.UpdatedAt = now

	for i := range order.Items {
		if order.Items[i].ID == uuid.Nil {
			order.Items[i].ID = uuid.New()
		}
		order.Items[i].OrderID = order.ID
		order.Items[i].CreatedAt = now
	}

	if err := h.productRepo.CreateOrder(req.Context(), &order); err != nil {
		if errors.Is(err, domain.ErrInvalidQuantity) {
			writeAPIError(w, http.StatusBadRequest, "INVALID_QUANTITY", "Số lượng sản phẩm không hợp lệ")
			return
		}
		if errors.Is(err, domain.ErrProductNotFound) {
			writeAPIError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create order")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(order)
}

type UpdateOrderStatusRequest struct {
	Status  domain.OrderStatus `json:"status"`
	Version int                `json:"version"`
}

func (h *Handler) UpdateOrderStatus(w http.ResponseWriter, req *http.Request) {
	idStr := chi.URLParam(req, "id")
	if idStr == "" {
		idStr = req.PathValue("id")
	}
	orderID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID đơn hàng không hợp lệ")
		return
	}

	var reqBody UpdateOrderStatusRequest
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	actorID, err := uuid.Parse(claims.UserID)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "ID người dùng không hợp lệ")
		return
	}

	updatedOrder, err := h.productRepo.UpdateOrderStatus(
		req.Context(),
		orderID,
		reqBody.Status,
		reqBody.Version,
		claims.Role,
		actorID,
	)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidTransition):
			writeAPIError(w, http.StatusBadRequest, "INVALID_TRANSITION", "Chuyển đổi trạng thái không hợp lệ")
		case errors.Is(err, domain.ErrOrderNotFound):
			writeAPIError(w, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
		case errors.Is(err, domain.ErrVersionConflict):
			writeAPIError(w, http.StatusConflict, "VERSION_CONFLICT", "Xung đột phiên bản dữ liệu")
		case errors.Is(err, domain.ErrForbidden):
			writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Không có quyền thực hiện thao tác này")
		default:
			writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi xử lý cập nhật trạng thái đơn hàng")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(updatedOrder)
}