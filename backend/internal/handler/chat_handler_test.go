package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

type roundTripFunc func(req *http.Request) *http.Response

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req), nil
}

func TestChatHandler_EmptyMessage(t *testing.T) {
	repo := newMockProductRepo()
	h := NewChatHandler(repo)

	body := bytes.NewBufferString(`{"message": "   "}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat", body)
	w := httptest.NewRecorder()

	h.HandleChat(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty message, got %d", w.Code)
	}
}

func TestChatHandler_MethodNotAllowed(t *testing.T) {
	repo := newMockProductRepo()
	h := NewChatHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/chat", nil)
	w := httptest.NewRecorder()

	h.HandleChat(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405 for GET, got %d", w.Code)
	}
}

func TestChatHandler_FallbackMode_SearchProduct(t *testing.T) {
	_ = os.Unsetenv("GEMINI_API_KEY")

	repo := newMockProductRepo()
	p1ID := uuid.New()
	p1 := domain.Product{
		ID:        p1ID,
		SKU:       "CAD-CV-2.5",
		Name:      "Dây cáp điện đơn Cadivi 2.5mm²",
		BasePrice: 16330,
		Brand: domain.Brand{
			Code:         "CADIVI",
			Name:         "Cadivi",
			DiscountRate: 22,
		},
		Category: domain.Category{
			Code: "CABLE",
			Name: "Dây Cáp",
		},
		Specifications: map[string]any{
			"unit":  "Mét",
			"image": "/images/products/day-cap-don-1.jpg",
		},
	}
	repo.products[p1ID] = p1

	h := NewChatHandler(repo)

	body := bytes.NewBufferString(`{"message": "Dây Cadivi 2.5 giá bao nhiêu?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat", body)
	w := httptest.NewRecorder()

	h.HandleChat(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp ChatResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if resp.Mode != "basic" {
		t.Errorf("expected mode 'basic', got %s", resp.Mode)
	}
	if !strings.Contains(resp.Reply, "[Chế độ tra cứu cơ bản (chưa có AI)]") {
		t.Errorf("expected reply to have basic mode label, got: %s", resp.Reply)
	}
	if !strings.Contains(resp.Reply, "[Dữ liệu thật từ kho]") {
		t.Errorf("expected reply to have real data label, got: %s", resp.Reply)
	}
	if len(resp.Products) == 0 {
		t.Fatalf("expected at least 1 product card, got 0")
	}
	if resp.Products[0].SKU != "CAD-CV-2.5" {
		t.Errorf("expected SKU CAD-CV-2.5, got %s", resp.Products[0].SKU)
	}
	if resp.Products[0].DiscountRate != 22 {
		t.Errorf("expected discount rate 22, got %f", resp.Products[0].DiscountRate)
	}
	expectedFinal := 16330.0 * (1.0 - 0.22)
	if resp.Products[0].FinalPrice != expectedFinal {
		t.Errorf("expected final price %f, got %f", expectedFinal, resp.Products[0].FinalPrice)
	}
}

func TestChatHandler_FallbackMode_CalculationNotice(t *testing.T) {
	_ = os.Unsetenv("GEMINI_API_KEY")

	repo := newMockProductRepo()
	h := NewChatHandler(repo)

	body := bytes.NewBufferString(`{"message": "Tư vấn vật tư điện nước nhà phố 3 tầng"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat", body)
	w := httptest.NewRecorder()

	h.HandleChat(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ChatResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if !strings.Contains(resp.Reply, "[Chế độ tra cứu cơ bản (chưa có AI)]") {
		t.Errorf("expected basic mode label, got: %s", resp.Reply)
	}
	if !strings.Contains(resp.Reply, "[Ước tính — cần thợ điện nước xác nhận]") {
		t.Errorf("expected estimation label, got: %s", resp.Reply)
	}
	if !strings.Contains(resp.Reply, "Đây là ước tính tham khảo, cần kỹ sư điện nước xác nhận trước khi thi công.") {
		t.Errorf("expected safety disclaimer, got: %s", resp.Reply)
	}

	fakeHotlineSubstr := string([]byte{'0', '9', '0', '8'})
	if strings.Contains(resp.Reply, fakeHotlineSubstr) {
		t.Errorf("should never contain fake hotline prefix, got: %s", resp.Reply)
	}
}

func TestChatHandler_AllFourQuickPrompts_BasicMode(t *testing.T) {
	_ = os.Unsetenv("GEMINI_API_KEY")

	repo := newMockProductRepo()
	p1ID := uuid.New()
	repo.products[p1ID] = domain.Product{
		ID:        p1ID,
		SKU:       "CAD-CV-2.5",
		Name:      "Dây cáp điện đơn Cadivi 2.5mm²",
		BasePrice: 16330,
		Brand: domain.Brand{
			Code:         "CADIVI",
			Name:         "Cadivi",
			DiscountRate: 22,
		},
		Category: domain.Category{Code: "CABLE", Name: "Dây Cáp"},
	}
	p2ID := uuid.New()
	repo.products[p2ID] = domain.Product{
		ID:        p2ID,
		SKU:       "BM-UPVC-21",
		Name:      "Ống uPVC Bình Minh phi 21",
		BasePrice: 9072,
		Brand: domain.Brand{
			Code:         "BINHMINH",
			Name:         "Bình Minh",
			DiscountRate: 18,
		},
		Category: domain.Category{Code: "PIPE", Name: "Ống Nước"},
	}

	h := NewChatHandler(repo)

	prompts := []struct {
		text          string
		expectedLabel string
		needFormula   bool
	}{
		{"Tư vấn vật tư điện nước nhà phố 3 tầng", "[Ước tính — cần thợ điện nước xác nhận]", true},
		{"Bảng giá ống Bình Minh chiết khấu bao nhiêu?", "[Dữ liệu thật từ kho]", false},
		{"Dây Cadivi 2.5mm chịu tải được thiết bị nào?", "[Ước tính — cần thợ điện nước xác nhận]", true},
		{"Tính danh mục vật tư ống uPVC cho công trình 100m²", "[Ước tính — cần thợ điện nước xác nhận]", true},
	}

	for idx, q := range prompts {
		body := bytes.NewBufferString(fmt.Sprintf(`{"message": %q}`, q.text))
		req := httptest.NewRequest(http.MethodPost, "/api/v1/chat", body)
		w := httptest.NewRecorder()

		h.HandleChat(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("[%d] expected 200, got %d", idx, w.Code)
		}

		var resp ChatResponse
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("[%d] unmarshal: %v", idx, err)
		}

		if !strings.Contains(resp.Reply, "[Chế độ tra cứu cơ bản (chưa có AI)]") {
			t.Errorf("[%d] expected basic mode label, got: %s", idx, resp.Reply)
		}
		if !strings.Contains(resp.Reply, q.expectedLabel) {
			t.Errorf("[%d] expected %s label, got: %s", idx, q.expectedLabel, resp.Reply)
		}
		if q.needFormula {
			if !strings.Contains(resp.Reply, "Công thức") && !strings.Contains(resp.Reply, "Định mức") {
				t.Errorf("[%d] expected formula or quota, got: %s", idx, resp.Reply)
			}
			if !strings.Contains(resp.Reply, "Đây là ước tính tham khảo, cần kỹ sư điện nước xác nhận trước khi thi công.") {
				t.Errorf("[%d] expected safety disclaimer, got: %s", idx, resp.Reply)
			}
		}
	}
}

func TestChatHandler_Substitute_PriceDifference(t *testing.T) {
	_ = os.Unsetenv("GEMINI_API_KEY")

	repo := newMockProductRepo()
	p1ID := uuid.New()
	repo.products[p1ID] = domain.Product{
		ID:        p1ID,
		SKU:       "CAD-CV-2.5",
		Name:      "Dây Cadivi CV 2.5",
		BasePrice: 16000,
		Brand:     domain.Brand{Name: "Cadivi", DiscountRate: 20},
		Category:  domain.Category{Name: "Dây Điện"},
	}
	p2ID := uuid.New()
	repo.products[p2ID] = domain.Product{
		ID:        p2ID,
		SKU:       "PANA-CV-2.5",
		Name:      "Dây Panasonic CV 2.5",
		BasePrice: 20000,
		Brand:     domain.Brand{Name: "Panasonic", DiscountRate: 10},
		Category:  domain.Category{Name: "Dây Điện"},
	}

	h := NewChatHandler(repo)

	body := bytes.NewBufferString(`{"message": "Dây này đắt quá có gì thay thế không?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat", body)
	w := httptest.NewRecorder()

	h.HandleChat(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ChatResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if !strings.Contains(resp.Reply, "[Dữ liệu thật từ kho]") {
		t.Errorf("expected real data label for substitute, got: %s", resp.Reply)
	}
	if !strings.Contains(resp.Reply, "Chênh lệch") && !strings.Contains(resp.Reply, "Tiết kiệm") {
		t.Errorf("expected price difference in substitute response, got: %s", resp.Reply)
	}
}

func TestBuildGeminiContents_SanitizesTurns(t *testing.T) {
	// History begins with a bot message and has consecutive bot messages
	history := []ChatHistoryItem{
		{Sender: "bot", Text: "Xin chào quý khách!"},
		{Sender: "bot", Text: "Giỏ của bạn còn 2 món."},
		{Sender: "user", Text: "Dây 2.5 giá bao nhiêu?"},
		{Sender: "bot", Text: "Dây Cadivi 2.5 giá 12.737 đ"},
	}
	userMsg := "Cho tôi xem thêm MCB 32A"

	contents := buildGeminiContents(history, userMsg)

	if len(contents) == 0 {
		t.Fatalf("expected non-empty contents")
	}

	// 1. First turn must be user
	if contents[0].Role != "user" {
		t.Errorf("expected first turn to be 'user', got %s", contents[0].Role)
	}

	// 2. Strict alternation
	for i := 1; i < len(contents); i++ {
		if contents[i].Role == contents[i-1].Role {
			t.Errorf("turn %d has same role as turn %d: %s", i, i-1, contents[i].Role)
		}
	}

	// 3. Final turn must be user with userMsg
	last := contents[len(contents)-1]
	if last.Role != "user" || !strings.Contains(last.Parts[0].Text, "MCB 32A") {
		t.Errorf("expected final turn to be user message, got %+v", last)
	}
}

func TestChatHandler_WithGeminiMock(t *testing.T) {
	_ = os.Setenv("GEMINI_API_KEY", "test-mock-key")
	defer os.Unsetenv("GEMINI_API_KEY")

	repo := newMockProductRepo()
	p1ID := uuid.New()
	p1 := domain.Product{
		ID:        p1ID,
		SKU:       "CAD-CV-2.5",
		Name:      "Dây cáp điện đơn Cadivi 2.5mm²",
		BasePrice: 16330,
		Brand: domain.Brand{
			Code:         "CADIVI",
			Name:         "Cadivi",
			DiscountRate: 22,
		},
		Category: domain.Category{
			Code: "CABLE",
			Name: "Dây Cáp",
		},
	}
	repo.products[p1ID] = p1

	h := NewChatHandler(repo)

	// Mock HTTP client for Gemini API
	geminiResponseJSON := `{
		"candidates": [
			{
				"content": {
					"parts": [
						{
							"text": "[Ước tính — cần thợ điện nước xác nhận]\nCông thức tính: I = P / (U * cosφ)\nThay số: I = 3000 / (220 * 0.85) = 16.04A\nTiết diện: S = I / J = 16.04 / 6 = 2.67mm² -> Khuyên dùng dây [CAD-CV-2.5].\nĐây là ước tính tham khảo, cần kỹ sư điện nước xác nhận trước khi thi công."
						}
					]
				}
			}
		]
	}`

	h.httpClient = &http.Client{
		Transport: roundTripFunc(func(req *http.Request) *http.Response {
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(geminiResponseJSON)),
				Header:     make(http.Header),
			}
		}),
	}

	body := bytes.NewBufferString(`{"message": "Dây Cadivi 2.5mm chịu tải được thiết bị nào?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat", body)
	w := httptest.NewRecorder()

	h.HandleChat(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ChatResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if resp.Mode != "ai" {
		t.Errorf("expected mode 'ai', got %s", resp.Mode)
	}
	if !strings.Contains(resp.Reply, "[Ước tính — cần thợ điện nước xác nhận]") {
		t.Errorf("expected estimation label in reply, got: %s", resp.Reply)
	}
	if !strings.Contains(resp.Reply, "Đây là ước tính tham khảo, cần kỹ sư điện nước xác nhận trước khi thi công.") {
		t.Errorf("expected disclaimer in reply, got: %s", resp.Reply)
	}
	if len(resp.Products) == 0 {
		t.Fatalf("expected SKU CAD-CV-2.5 to be extracted from reply brackets, got 0 products")
	}
	if resp.Products[0].SKU != "CAD-CV-2.5" {
		t.Errorf("expected SKU CAD-CV-2.5, got %s", resp.Products[0].SKU)
	}
}

func TestChatHandler_RealThreeSKUsVerification(t *testing.T) {
	_ = os.Unsetenv("GEMINI_API_KEY")

	// Verify exact price, discount rate and calculation for 3 real SKUs
	testSKUs := []struct {
		sku          string
		name         string
		brand        string
		category     string
		basePrice    float64
		discountRate float64
	}{
		{
			sku:          "CAD-CV-2.5",
			name:         "Dây cáp điện đơn Cadivi 2.5mm²",
			brand:        "Cadivi",
			category:     "Dây Cáp",
			basePrice:    16330,
			discountRate: 22,
		},
		{
			sku:          "BM-UPVC-21",
			name:         "Ống uPVC Bình Minh phi 21",
			brand:        "Bình Minh",
			category:     "Ống Nước",
			basePrice:    9072,
			discountRate: 18,
		},
		{
			sku:          "SCH-EZ9F34232",
			name:         "Aptomat MCB Schneider Easy9 2P 32A 4.5kA (EZ9F34232)",
			brand:        "Schneider Electric",
			category:     "Thiết Bị Đóng Cắt",
			basePrice:    168800,
			discountRate: 12,
		},
	}

	repo := newMockProductRepo()
	for _, item := range testSKUs {
		pID := uuid.New()
		prod := domain.Product{
			ID:        pID,
			SKU:       item.sku,
			Name:      item.name,
			BasePrice: item.basePrice,
			Brand: domain.Brand{
				Code:         item.brand,
				Name:         item.brand,
				DiscountRate: item.discountRate,
			},
			Category: domain.Category{
				Code: item.category,
				Name: item.category,
			},
		}
		repo.products[pID] = prod
		repo.productsBySKU[item.sku] = prod
	}

	h := NewChatHandler(repo)

	for _, item := range testSKUs {
		body := bytes.NewBufferString(fmt.Sprintf(`{"message": "Giá %s bao nhiêu?"}`, item.sku))
		req := httptest.NewRequest(http.MethodPost, "/api/v1/chat", body)
		w := httptest.NewRecorder()

		h.HandleChat(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("[%s] expected 200, got %d", item.sku, w.Code)
		}

		var resp ChatResponse
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("[%s] decode error: %v", item.sku, err)
		}

		if len(resp.Products) == 0 {
			t.Fatalf("[%s] expected at least 1 product card, got 0", item.sku)
		}

		card := resp.Products[0]
		if card.SKU != item.sku {
			t.Errorf("[%s] expected SKU %s, got %s", item.sku, item.sku, card.SKU)
		}
		if card.BasePrice != item.basePrice {
			t.Errorf("[%s] expected base price %f, got %f", item.sku, item.basePrice, card.BasePrice)
		}
		if card.DiscountRate != item.discountRate {
			t.Errorf("[%s] expected discount rate %f, got %f", item.sku, item.discountRate, card.DiscountRate)
		}
		expectedFinal := item.basePrice * (1.0 - (item.discountRate / 100.0))
		if card.FinalPrice != expectedFinal {
			t.Errorf("[%s] expected final price %f, got %f", item.sku, expectedFinal, card.FinalPrice)
		}
		if !strings.Contains(resp.Reply, "[Dữ liệu thật từ kho]") {
			t.Errorf("[%s] expected [Dữ liệu thật từ kho] label", item.sku)
		}
	}
}

func TestChatHandler_Phase2_ProjectContext_BOM_And_Forget(t *testing.T) {
	repo := newMockProductRepo()
	h := NewChatHandler(repo)

	// 1. Context provided -> BOM recalculates with saved specs
	reqBody := `{
		"message": "Tính danh mục vật tư ống uPVC",
		"context": {
			"area": 150,
			"floors": 2,
			"houseType": "nhà phố"
		}
	}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat", bytes.NewBufferString(reqBody))
	w := httptest.NewRecorder()

	h.HandleChat(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ChatResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if !strings.Contains(resp.Reply, "[Ước tính — cần thợ điện nước xác nhận]") {
		t.Errorf("expected estimation label, got: %s", resp.Reply)
	}
	if !strings.Contains(resp.Reply, "150 m²") || !strings.Contains(resp.Reply, "2 tầng") {
		t.Errorf("expected remembered area 150 and 2 floors in response, got: %s", resp.Reply)
	}
	if !strings.Contains(resp.Reply, "360 m") { // 150 * 2 = 300; 300 * 1.2 = 360
		t.Errorf("expected 360m total pipe calculated, got: %s", resp.Reply)
	}

	// 2. Forget command -> Clears context gracefully
	forgetReqBody := `{"message": "quên đi thông số công trình"}`
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/chat", bytes.NewBufferString(forgetReqBody))
	w2 := httptest.NewRecorder()

	h.HandleChat(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w2.Code)
	}

	var resp2 ChatResponse
	if err := json.Unmarshal(w2.Body.Bytes(), &resp2); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !strings.Contains(resp2.Reply, "Đã xóa sạch thông số công trình") {
		t.Errorf("expected forget confirmation, got: %s", resp2.Reply)
	}
}
