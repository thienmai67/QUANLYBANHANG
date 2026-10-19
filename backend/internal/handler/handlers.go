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
		limit = 100
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

func parseUpsertProductInput(req *http.Request) (domain.UpsertProductInput, error) {
	var raw map[string]any
	if err := json.NewDecoder(req.Body).Decode(&raw); err != nil {
		return domain.UpsertProductInput{}, err
	}

	var input domain.UpsertProductInput
	if v, ok := raw["sku"].(string); ok {
		input.SKU = v
	}
	if v, ok := raw["name"].(string); ok {
		input.Name = v
	}

	switch b := raw["brand"].(type) {
	case string:
		input.Brand = b
	case map[string]any:
		if name, ok := b["name"].(string); ok && name != "" {
			input.Brand = name
		} else if code, ok := b["code"].(string); ok {
			input.Brand = code
		}
	}

	switch c := raw["category"].(type) {
	case string:
		input.Category = c
	case map[string]any:
		if name, ok := c["name"].(string); ok && name != "" {
			input.Category = name
		} else if code, ok := c["code"].(string); ok {
			input.Category = code
		}
	}

	if v, ok := raw["basePrice"].(float64); ok {
		input.BasePrice = v
	} else if v, ok := raw["base_price"].(float64); ok {
		input.BasePrice = v
	} else if v, ok := raw["price"].(float64); ok {
		input.BasePrice = v
	}

	if v, ok := raw["discountRate"].(float64); ok {
		input.DiscountRate = &v
	} else if v, ok := raw["discount_rate"].(float64); ok {
		input.DiscountRate = &v
	}

	if v, ok := raw["unit"].(string); ok {
		input.Unit = v
	}
	if v, ok := raw["image"].(string); ok {
		input.Image = v
	}
	if v, ok := raw["description"].(string); ok {
		input.Description = v
	}

	if v, ok := raw["diameterMm"].(float64); ok {
		input.DiameterMM = &v
	} else if v, ok := raw["diameter_mm"].(float64); ok {
		input.DiameterMM = &v
	}

	if v, ok := raw["pressureClass"].(string); ok && v != "" {
		input.PressureClass = &v
	} else if v, ok := raw["pressure_class"].(string); ok && v != "" {
		input.PressureClass = &v
	}

	if v, ok := raw["crossSectionMm2"].(float64); ok {
		input.CrossSectionMM2 = &v
	} else if v, ok := raw["cross_section_mm2"].(float64); ok {
		input.CrossSectionMM2 = &v
	}

	if v, ok := raw["ampRating"].(float64); ok {
		input.AmpRating = &v
	} else if v, ok := raw["amp_rating"].(float64); ok {
		input.AmpRating = &v
	}

	if specs, ok := raw["specifications"].(map[string]any); ok {
		input.Specifications = specs
	}

	return input, nil
}

func (h *Handler) CreateProduct(w http.ResponseWriter, req *http.Request) {
	input, err := parseUpsertProductInput(req)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu sản phẩm không hợp lệ")
		return
	}

	product, err := h.productRepo.CreateProduct(req.Context(), input)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidProductInput):
			writeAPIError(w, http.StatusBadRequest, "INVALID_PRODUCT_INPUT", "Thiếu thông tin bắt buộc (SKU, tên, thương hiệu, danh mục, giá niêm yết > 0)")
		case errors.Is(err, domain.ErrDuplicateSKU):
			writeAPIError(w, http.StatusConflict, "DUPLICATE_SKU", "Mã SKU đã tồn tại trong hệ thống")
		default:
			writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Không thể tạo sản phẩm")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(product)
}

func (h *Handler) UpdateProduct(w http.ResponseWriter, req *http.Request) {
	idStr := chi.URLParam(req, "id")
	if idStr == "" {
		idStr = req.PathValue("id")
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID sản phẩm không hợp lệ")
		return
	}

	input, err := parseUpsertProductInput(req)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu cập nhật sản phẩm không hợp lệ")
		return
	}

	product, err := h.productRepo.UpdateProduct(req.Context(), id, input)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidProductInput):
			writeAPIError(w, http.StatusBadRequest, "INVALID_PRODUCT_INPUT", "Thiếu thông tin bắt buộc (SKU, tên, thương hiệu, danh mục, giá niêm yết > 0)")
		case errors.Is(err, domain.ErrProductNotFound):
			writeAPIError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm")
		case errors.Is(err, domain.ErrDuplicateSKU):
			writeAPIError(w, http.StatusConflict, "DUPLICATE_SKU", "Mã SKU đã tồn tại ở sản phẩm khác")
		default:
			writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Không thể cập nhật sản phẩm")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(product)
}

func (h *Handler) DeleteProduct(w http.ResponseWriter, req *http.Request) {
	idStr := chi.URLParam(req, "id")
	if idStr == "" {
		idStr = req.PathValue("id")
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID sản phẩm không hợp lệ")
		return
	}

	if err := h.productRepo.DeleteProduct(req.Context(), id); err != nil {
		if errors.Is(err, domain.ErrProductNotFound) {
			writeAPIError(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Không thể xóa sản phẩm")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": "Đã xóa sản phẩm thành công",
		"id":      id.String(),
	})
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

func (h *Handler) GetOrderByID(w http.ResponseWriter, req *http.Request) {
	idStr := chi.URLParam(req, "id")
	if idStr == "" {
		idStr = req.PathValue("id")
	}
	orderID, err := uuid.Parse(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_ID", "ID đơn hàng không hợp lệ")
		return
	}

	order, err := h.productRepo.GetOrderByID(req.Context(), orderID)
	if err != nil {
		if errors.Is(err, domain.ErrOrderNotFound) {
			writeAPIError(w, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn chi tiết đơn hàng")
		return
	}

	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}

	if claims.Role == domain.RoleCustomer {
		customerUUID, parseErr := uuid.Parse(claims.UserID)
		if parseErr != nil || order.CustomerID == nil || *order.CustomerID != customerUUID {
			writeAPIError(w, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(order)
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

	var reqBody domain.UpdateOrderStatusRequest
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

	updatedOrder, err := h.productRepo.UpdateOrderStatusWithDetails(
		req.Context(),
		orderID,
		reqBody,
		claims.Role,
		actorID,
	)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrVersionConflict):
			writeAPIError(w, http.StatusConflict, "VERSION_CONFLICT", "Đơn hàng vừa được cập nhật bởi người khác, vui lòng tải lại")
		case errors.Is(err, domain.ErrInvalidTransition):
			writeAPIError(w, http.StatusBadRequest, "INVALID_TRANSITION", "Chuyển trạng thái không hợp lệ")
		case errors.Is(err, domain.ErrInvalidReason):
			writeAPIError(w, http.StatusBadRequest, "INVALID_REASON", "Lý do hủy phải từ 5 ký tự trở lên")
		case errors.Is(err, domain.ErrMissingPOD):
			writeAPIError(w, http.StatusBadRequest, "MISSING_POD", "Thiếu ảnh hoặc tên người nhận hàng")
		case errors.Is(err, domain.ErrInvalidShipper):
			writeAPIError(w, http.StatusBadRequest, "INVALID_SHIPPER", "Shipper được gán không hợp lệ")
		case errors.Is(err, domain.ErrForbidden):
			writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Bạn không có quyền thao tác đơn hàng này")
		case errors.Is(err, domain.ErrOrderNotFound):
			writeAPIError(w, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
		default:
			writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi xử lý cập nhật trạng thái đơn hàng")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(updatedOrder)
}

func (h *Handler) ListShippers(w http.ResponseWriter, req *http.Request) {
	claims, ok := middleware.GetClaimsFromContext(req.Context())
	if !ok || claims == nil {
		writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Chưa xác thực người dùng")
		return
	}
	if claims.Role != domain.RoleManager && claims.Role != domain.RoleAdmin {
		writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Bạn không có quyền truy cập danh sách shipper")
		return
	}

	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))
	if offset < 0 {
		offset = 0
	}

	shippers, total, err := h.productRepo.ListShippers(req.Context(), limit, offset)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn danh sách shipper")
		return
	}

	if shippers == nil {
		shippers = []domain.ShipperSummary{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data":  shippers,
		"total": total,
	})
}

type CreateCODSettlementRequestBody struct {
	OrderIDs     []string `json:"order_ids"`
	OrderIDsAlt  []string `json:"orderIds,omitempty"`
	ShipperID    *string  `json:"shipper_id,omitempty"`
	ShipperIDAlt *string  `json:"shipperId,omitempty"`
}

func (r *CreateCODSettlementRequestBody) GetOrderIDs() []string {
	if len(r.OrderIDs) > 0 {
		return r.OrderIDs
	}
	return r.OrderIDsAlt
}

func (r *CreateCODSettlementRequestBody) GetShipperID() *string {
	if r.ShipperID != nil && *r.ShipperID != "" {
		return r.ShipperID
	}
	if r.ShipperIDAlt != nil && *r.ShipperIDAlt != "" {
		return r.ShipperIDAlt
	}
	return nil
}

func (h *Handler) CreateCODSettlement(w http.ResponseWriter, req *http.Request) {
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

	var reqBody CreateCODSettlementRequestBody
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	rawOrderIDs := reqBody.GetOrderIDs()
	if len(rawOrderIDs) == 0 {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Danh sách đơn hàng không được để trống")
		return
	}

	var targetShipperID uuid.UUID
	if claims.Role == domain.RoleShipper {
		targetShipperID = actorID
	} else if claims.Role == domain.RoleManager || claims.Role == domain.RoleAdmin {
		shipperIDPtr := reqBody.GetShipperID()
		if shipperIDPtr != nil && *shipperIDPtr != "" {
			parsedID, err := uuid.Parse(*shipperIDPtr)
			if err != nil {
				writeAPIError(w, http.StatusBadRequest, "INVALID_SHIPPER", "ID shipper không hợp lệ")
				return
			}
			targetShipperID = parsedID
		} else {
			writeAPIError(w, http.StatusBadRequest, "INVALID_SHIPPER", "Cần cung cấp shipper_id khi tạo hộ quyết toán")
			return
		}
	} else {
		writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Không có quyền thực hiện quyết toán COD")
		return
	}

	orderUUIDs := make([]uuid.UUID, 0, len(rawOrderIDs))
	for _, idStr := range rawOrderIDs {
		u, err := uuid.Parse(idStr)
		if err != nil {
			writeAPIError(w, http.StatusBadRequest, "INVALID_ORDER_ID", "ID đơn hàng không hợp lệ")
			return
		}
		orderUUIDs = append(orderUUIDs, u)
	}

	settlement, err := h.productRepo.CreateCODSettlement(req.Context(), targetShipperID, orderUUIDs, claims.Role, actorID)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidCODSettlement):
			writeAPIError(w, http.StatusBadRequest, "INVALID_SETTLEMENT", "Đơn hàng không hợp lệ để quyết toán COD (phải là đơn DELIVERED, COD, chưa nộp tiền)")
		case errors.Is(err, domain.ErrInvalidShipper):
			writeAPIError(w, http.StatusBadRequest, "INVALID_SHIPPER", "Shipper không hợp lệ")
		case errors.Is(err, domain.ErrForbidden):
			writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Không có quyền thực hiện quyết toán cho shipper này")
		default:
			writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi tạo quyết toán COD")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(settlement)
}

func (h *Handler) ListCODSettlements(w http.ResponseWriter, req *http.Request) {
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

	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))
	if offset < 0 {
		offset = 0
	}

	var targetShipperID *uuid.UUID
	if claims.Role == domain.RoleShipper {
		targetShipperID = &actorID
	} else if claims.Role == domain.RoleManager || claims.Role == domain.RoleAdmin {
		filterShipperStr := req.URL.Query().Get("shipper_id")
		if filterShipperStr == "" {
			filterShipperStr = req.URL.Query().Get("shipperId")
		}
		if filterShipperStr != "" {
			parsedID, err := uuid.Parse(filterShipperStr)
			if err != nil {
				writeAPIError(w, http.StatusBadRequest, "INVALID_SHIPPER", "ID shipper lọc không hợp lệ")
				return
			}
			targetShipperID = &parsedID
		}
	} else {
		writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "Không có quyền xem quyết toán COD")
		return
	}

	settlements, total, err := h.productRepo.ListCODSettlements(req.Context(), targetShipperID, limit, offset)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn danh sách quyết toán COD")
		return
	}

	if settlements == nil {
		settlements = []domain.CODSettlement{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data":  settlements,
		"total": total,
	})
}

type CheckinRequestBody struct {
	Note *string `json:"note,omitempty"`
}

func (h *Handler) ShipperCheckin(w http.ResponseWriter, req *http.Request) {
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

	var body CheckinRequestBody
	_ = json.NewDecoder(req.Body).Decode(&body)

	checkin, err := h.productRepo.CheckinShipper(req.Context(), actorID, body.Note)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Điểm danh thất bại, vui lòng thử lại")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": checkin})
}

func (h *Handler) ShipperCheckout(w http.ResponseWriter, req *http.Request) {
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

	checkin, err := h.productRepo.CheckoutShipper(req.Context(), actorID)
	if err != nil {
		if errors.Is(err, domain.ErrNoOpenCheckin) {
			writeAPIError(w, http.StatusBadRequest, "NO_OPEN_CHECKIN", "Bạn chưa điểm danh vào ca hôm nay")
			return
		}
		if errors.Is(err, domain.ErrShipperHasActiveOrders) {
			writeAPIError(w, http.StatusBadRequest, "ACTIVE_ORDERS_EXIST", "Bạn còn đơn hàng đang giao, không thể kết ca")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Kết ca thất bại, vui lòng thử lại")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": checkin})
}

func (h *Handler) GetShipperAvailability(w http.ResponseWriter, req *http.Request) {
	list, err := h.productRepo.ListShipperAvailability(req.Context())
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn trạng thái shipper")
		return
	}
	if list == nil {
		list = []domain.ShipperAvailability{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": list})
}

func (h *Handler) GetMyCheckinStatus(w http.ResponseWriter, req *http.Request) {
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

	checkin, err := h.productRepo.GetOpenCheckin(req.Context(), actorID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Lỗi truy vấn trạng thái ca")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": checkin})
}