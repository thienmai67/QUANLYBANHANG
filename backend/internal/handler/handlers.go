package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

type Handler struct {
	productRepo domain.ProductRepository
}

func New(productRepo domain.ProductRepository) *Handler {
	return &Handler{productRepo: productRepo}
}

func (h *Handler) ListProducts(w http.ResponseWriter, req *http.Request) {
	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))

	products, err := h.productRepo.ListProducts(req.Context(), limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func (h *Handler) GetProduct(w http.ResponseWriter, req *http.Request) {
	idStr := chi.URLParam(req, "id")
	if idStr == "" {
		idStr = req.PathValue("id")
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	product, err := h.productRepo.GetProductByID(req.Context(), id)
	if err != nil {
		if err == domain.ErrProductNotFound {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func (h *Handler) GetProductBySKU(w http.ResponseWriter, req *http.Request) {
	sku := chi.URLParam(req, "sku")
	if sku == "" {
		sku = req.PathValue("sku")
	}
	if sku == "" {
		http.Error(w, "sku is required", http.StatusBadRequest)
		return
	}

	product, err := h.productRepo.GetProductBySKU(req.Context(), sku)
	if err != nil {
		if err == domain.ErrProductNotFound {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func (h *Handler) ListUnits(w http.ResponseWriter, req *http.Request) {
	units, err := h.productRepo.ListUnits(req.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func (h *Handler) ListBrands(w http.ResponseWriter, req *http.Request) {
	brands, err := h.productRepo.ListBrands(req.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(brands)
}

func (h *Handler) ListCategories(w http.ResponseWriter, req *http.Request) {
	categories, err := h.productRepo.ListCategories(req.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func (h *Handler) ListOrders(w http.ResponseWriter, req *http.Request) {
	limit, _ := strconv.Atoi(req.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset, _ := strconv.Atoi(req.URL.Query().Get("offset"))

	orders, err := h.productRepo.ListOrders(req.Context(), limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

func (h *Handler) CreateOrder(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "created"})
}