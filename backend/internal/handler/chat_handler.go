package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

var defaultQuickPrompts = []string{
	"Tư vấn vật tư điện nước nhà phố 3 tầng",
	"Bảng giá ống Bình Minh chiết khấu bao nhiêu?",
	"Dây Cadivi 2.5mm chịu tải được thiết bị nào?",
	"Tính danh mục vật tư ống uPVC cho công trình 100m²",
}

type ChatHistoryItem struct {
	Sender string `json:"sender"` // "user" | "bot"
	Text   string `json:"text"`
}

type ProjectContext struct {
	Area      *float64 `json:"area,omitempty"`
	Floors    *int     `json:"floors,omitempty"`
	HouseType *string  `json:"houseType,omitempty"`
}

type ChatRequest struct {
	Message string            `json:"message"`
	History []ChatHistoryItem `json:"history,omitempty"`
	Context *ProjectContext   `json:"context,omitempty"`
}

type ChatProductDTO struct {
	ID           string  `json:"id"`
	SKU          string  `json:"sku"`
	Name         string  `json:"name"`
	Brand        string  `json:"brand"`
	Category     string  `json:"category"`
	BasePrice    float64 `json:"basePrice"`
	DiscountRate float64 `json:"discountRate"`
	FinalPrice   float64 `json:"finalPrice"`
	PriceStr     string  `json:"priceStr"`
	Unit         string  `json:"unit"`
	Image        string  `json:"image"`
	Description  string  `json:"description,omitempty"`
}

type ChatResponse struct {
	Reply        string           `json:"reply"`
	Products     []ChatProductDTO `json:"products"`
	QuickReplies []string         `json:"quickReplies"`
	Mode         string           `json:"mode"` // "ai" | "basic"
}

type ChatHandler struct {
	productRepo domain.ProductRepository
	httpClient  *http.Client
}

func NewChatHandler(productRepo domain.ProductRepository) *ChatHandler {
	return &ChatHandler{
		productRepo: productRepo,
		httpClient:  &http.Client{Timeout: 25 * time.Second},
	}
}

func formatVND(amount float64) string {
	rounded := int64(amount + 0.5)
	s := strconv.FormatInt(rounded, 10)
	var parts []string
	for len(s) > 3 {
		parts = append([]string{s[len(s)-3:]}, parts...)
		s = s[:len(s)-3]
	}
	if len(s) > 0 {
		parts = append([]string{s}, parts...)
	}
	return strings.Join(parts, ".") + " ₫"
}

func toProductDTO(p domain.Product) ChatProductDTO {
	discountRate := p.Brand.DiscountRate
	finalPrice := p.BasePrice * (1.0 - (discountRate / 100.0))
	if finalPrice < 0 {
		finalPrice = p.BasePrice
	}

	unit := "Cái"
	image := "/images/products/day-cap-don-1.jpg"
	description := ""

	if p.Specifications != nil {
		if u, ok := p.Specifications["unit"].(string); ok && u != "" {
			unit = u
		}
		if img, ok := p.Specifications["image"].(string); ok && img != "" {
			image = img
		}
		if desc, ok := p.Specifications["description"].(string); ok && desc != "" {
			description = desc
		}
	}

	return ChatProductDTO{
		ID:           p.ID.String(),
		SKU:          p.SKU,
		Name:         p.Name,
		Brand:        p.Brand.Name,
		Category:     p.Category.Name,
		BasePrice:    p.BasePrice,
		DiscountRate: discountRate,
		FinalPrice:   finalPrice,
		PriceStr:     formatVND(p.BasePrice),
		Unit:         unit,
		Image:        image,
		Description:  description,
	}
}

func (h *ChatHandler) HandleChat(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Phương thức không được hỗ trợ")
		return
	}

	var chatReq ChatRequest
	if err := json.NewDecoder(req.Body).Decode(&chatReq); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_REQUEST", "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	query := strings.TrimSpace(chatReq.Message)
	if query == "" {
		writeAPIError(w, http.StatusBadRequest, "EMPTY_MESSAGE", "Nội dung tin nhắn không được để trống")
		return
	}

	ctx := req.Context()

	// 1. Lấy catalog thật từ DB qua repository
	allProducts, err := h.productRepo.ListProducts(ctx, 1000, 0)
	if err != nil {
		log.Printf("warning: chat handler failed to fetch products from db: %v", err)
		allProducts = []domain.Product{}
	}

	apiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))

	// 2. Nếu có key: gọi Gemini Flash server-side
	if apiKey != "" {
		aiResp, err := h.callGemini(ctx, apiKey, query, chatReq.History, allProducts, chatReq.Context)
		if err == nil && aiResp != nil && strings.TrimSpace(aiResp.Reply) != "" {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(aiResp)
			return
		}
		log.Printf("warning: gemini call failed or timed out: %v, falling back to basic lookup", err)
	}

	// 3. Không có key hoặc Gemini lỗi/timeout: chuyển sang chế độ tra cứu cơ bản từ DB
	fallbackResp := h.handleBasicLookup(query, allProducts, chatReq.Context)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(fallbackResp)
}

func buildCatalogContext(products []domain.Product) string {
	var sb strings.Builder
	sb.WriteString("=== DANH MỤC SẢN PHẨM HIỆN CÓ TRONG KHO (DỮ LIỆU THẬT) ===\n")
	for _, p := range products {
		discount := p.Brand.DiscountRate
		finalPrice := p.BasePrice * (1.0 - (discount / 100.0))
		unit := "Cái"
		if p.Specifications != nil {
			if u, ok := p.Specifications["unit"].(string); ok && u != "" {
				unit = u
			}
		}
		sb.WriteString(fmt.Sprintf(
			"- SKU: [%s] | Tên: %s | Hãng: %s (Chiết khấu: %.1f%%) | Danh mục: %s | Giá niêm yết: %.0f đ | Giá sau CK: %.0f đ | ĐV: %s",
			p.SKU, p.Name, p.Brand.Name, discount, p.Category.Name, p.BasePrice, finalPrice, unit,
		))
		if p.DiameterMM != nil && *p.DiameterMM > 0 {
			sb.WriteString(fmt.Sprintf(" | Phi: %.1fmm", *p.DiameterMM))
		}
		if p.CrossSectionMM2 != nil && *p.CrossSectionMM2 > 0 {
			sb.WriteString(fmt.Sprintf(" | Tiết diện: %.2fmm²", *p.CrossSectionMM2))
		}
		if p.AmpRating != nil && *p.AmpRating > 0 {
			sb.WriteString(fmt.Sprintf(" | Dòng định mức: %.0fA", *p.AmpRating))
		}
		sb.WriteString("\n")
	}
	return sb.String()
}

func buildSystemPrompt(products []domain.Product, pCtx *ProjectContext) string {
	catalogText := buildCatalogContext(products)

	var ctxSection string
	if pCtx != nil && ((pCtx.Area != nil && *pCtx.Area > 0) || (pCtx.Floors != nil && *pCtx.Floors > 0)) {
		var parts []string
		if pCtx.Area != nil && *pCtx.Area > 0 {
			parts = append(parts, fmt.Sprintf("Diện tích sàn: %.0f m²", *pCtx.Area))
		}
		if pCtx.Floors != nil && *pCtx.Floors > 0 {
			parts = append(parts, fmt.Sprintf("Số tầng: %d", *pCtx.Floors))
		}
		if pCtx.HouseType != nil && *pCtx.HouseType != "" {
			parts = append(parts, fmt.Sprintf("Loại công trình: %s", *pCtx.HouseType))
		}
		ctxSection = "\n=== THÔNG SỐ CÔNG TRÌNH ĐÃ LƯU CỦA KHÁCH HÀNG (CẢI TIẾN 2) ===\n" +
			strings.Join(parts, ", ") + "\n" +
			"Khi khách hàng yêu cầu tính toán BOM hoặc tư vấn khối lượng vật tư, hãy ưu tiên dùng đúng các thông số công trình trên để thay số tính toán chi tiết.\n"
	}

	return `Bạn là TDT M&E Copilot - Chuyên gia tư vấn kỹ thuật cơ điện nước kiêm trợ lý bán hàng thông minh của hệ thống TDT M&E Supplies.
Phong cách giao tiếp: Thân thiện, cởi mở, am hiểu chuyên môn sâu sắc nhưng diễn đạt tự nhiên, dễ hiểu, linh hoạt. Tránh văn phong máy móc, cộc lốc hoặc rập khuôn.

BẠN ĐƯỢC PHÉP VÀ KHUYẾN KHÍCH TRẢ LỜI CÁC NHÓM NỘI DUNG SAU (TRONG TẦM KIỂM SOÁT):
1. TƯ VẤN VẬT TƯ & TRA CỨU KHO:
   - Tra cứu giá niêm yết, tỷ lệ chiết khấu, thông số kỹ thuật (tiết diện mm², phi ống mm, dòng định mức A).
   - So sánh giữa các thương hiệu (ví dụ Cadivi vs Panasonic, Bình Minh vs Tiền Phong, Schneider vs Sino).
   - Khi nhắc đến bất kỳ sản phẩm nào có trong kho, LUÔN LUÔN ghi kèm mã SKU trong ngoặc vuông, ví dụ: [CAD-CV-2.5], [BM-UPVC-21], [SCH-EZ9F34232] để giao diện tự động hiển thị thẻ sản phẩm tương tác cho khách hàng.

2. TÍNH TOÁN KỸ THUẬT & DỰ TOÁN BÓC TÁCH (BOM):
   - Tính toán phụ tải điện, chọn tiết diện dây dẫn theo công thức TCVN: I = P / (U * cosφ), chọn mật độ dòng J = 5-6 A/mm².
     Tiết diện tính toán: S = I / J (mm²). Chọn cấp tiết diện tiêu chuẩn: 1.5, 2.5, 4.0, 6.0, 10.0mm².
   - Chọn aptomat/CB bảo vệ: I_MCB >= 1.25 * I_tt và I_MCB <= I_cho_phép của dây.
   - Tính toán hệ thống cấp thoát nước, độ dốc ống, chọn kích cỡ ống (thoát bồn cầu D90/D114, thoát sàn D60, thoát lavabo D34/D42, cấp trục chính D25/D32 PPR, nhánh D20/D21).
   - Với mọi câu hỏi tính toán kỹ thuật, BẮT BUỘC phải trình bày: Công thức áp dụng, số liệu thay vào, kết quả tính toán, gợi ý mã SKU trong ngoặc vuông và câu kết luận:
     "Đây là ước tính tham khảo, cần kỹ sư điện nước xác nhận trước khi thi công."

3. KINH NGHIỆM THI CÔNG & CHẨN ĐOÁN SỰ CỐ THỰC TẾ:
   - Giải thích nguyên nhân các sự cố thường gặp: Tại sao aptomat/CB bị nóng hoặc nhảy liên tục? Phân biệt nhảy do quá tải, ngắn mạch hay rò dòng (RCBO)? Cách xử lý mối nối ống nước bị rò rỉ? Đèn LED chớp tắt hoặc hiện tượng sụt áp?
   - Chia sẻ kinh nghiệm thi công công trình: Trình tự đi ống ghen luồn dây điện trước hay sau khi trát tường; cách bố trí hộp gen kỹ thuật; cách thử áp lực đường ống nước trước khi đóng trần hoặc cán nền.
   - Sau khi giải thích kỹ thuật và hướng dẫn an toàn, hãy khéo léo gợi ý sản phẩm hoặc phụ kiện tương ứng trong kho (kèm mã SKU nếu có).

4. HƯỚNG DẪN MUA HÀNG & THAO TÁC TRÊN WEBSITE:
   - Hướng dẫn khách cách thêm sản phẩm vào giỏ hàng ("Thêm vào giỏ" trên thẻ sản phẩm), mở giỏ hàng xem lại, bấm nút "Chốt đơn", và thanh toán trực tuyến thuận tiện qua mã VietQR PayOS hoặc COD.
   - Hướng dẫn khách lưu diện tích sàn/số tầng để hệ thống tự động ghi nhớ và tính toán dự toán vật tư chính xác hơn.

5. GIAO TIẾP THÂN THIỆN & XỬ LÝ CÂU HỎI NGOÀI LỀ:
   - Vui vẻ chào hỏi, cảm ơn, hỏi thăm khách hàng một cách lịch sự, nhã nhặn.
   - Với các câu hỏi hoàn toàn ngoài lề (như thời tiết, bóng đá, thơ văn, tin tức xã hội...): Hãy phản hồi ngắn gọn, vui vẻ, dí dỏm 1 câu rồi khéo léo chuyển hướng trở lại chủ đề vật tư điện nước, công trình của khách hàng. Tuyệt đối không từ chối cộc lốc hay khô khan!

QUY TẮC BẢO VỆ DỮ LIỆU & AN TOÀN SẢN PHẨM:
- NGUỒN DỮ LIỆU THẬT: CHỈ ĐƯỢC DÙNG giá niêm yết, chiết khấu và sản phẩm có trong CATALOG bên dưới. TUYỆT ĐỐI KHÔNG tự bịa giá hoặc bịa mã SKU không có trong kho.
- Nếu sản phẩm khách hỏi kho chưa có, hãy thông báo kho hiện chưa có mã này và gợi ý mã tương đương gần nhất có trong kho.
- GỢI Ý THAY THẾ: Khi khách hỏi sản phẩm hết hàng hoặc chê đắt, gợi ý tối đa 3 sản phẩm thay thế cùng thông số tương đương có sẵn trong catalog, chỉ rõ chênh lệch giá (sau chiết khấu) và phân khúc.
- NHÃN DÒNG ĐẦU TIÊN:
  + Dùng "[Dữ liệu thật từ kho]" khi câu trả lời tra cứu giá, chiết khấu, tồn kho hoặc thông số sản phẩm trực tiếp từ catalog.
  + Dùng "[Ước tính — cần thợ điện nước xác nhận]" khi câu trả lời có tính toán kỹ thuật, chọn tiết diện dây, chọn CB hoặc bóc tách khối lượng (BOM).
  + Với các câu chào hỏi, kinh nghiệm thi công thông thường hoặc hướng dẫn thao tác web, bạn có thể trả lời tự nhiên, thân thiện mà không cần gắn nhãn cứng nhắc nếu không có dữ liệu tra cứu kho hay tính toán tải.
- Không cam kết thời gian giao hàng cụ thể, không tự đưa số điện thoại cá nhân/hotline lạ vào câu trả lời (hướng dẫn khách liên hệ bộ phận hỗ trợ khách hàng trên website).
` + ctxSection + "\n" + catalogText
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}

type geminiReqBody struct {
	Contents          []geminiContent `json:"contents"`
	SystemInstruction *struct {
		Parts []geminiPart `json:"parts"`
	} `json:"systemInstruction,omitempty"`
	GenerationConfig struct {
		Temperature     float64 `json:"temperature"`
		MaxOutputTokens int     `json:"maxOutputTokens"`
	} `json:"generationConfig"`
}

type geminiRespBody struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error,omitempty"`
}

func buildGeminiContents(history []ChatHistoryItem, userMessage string) []geminiContent {
	var raw []geminiContent
	startIdx := 0
	if len(history) > 8 {
		startIdx = len(history) - 8
	}
	for i := startIdx; i < len(history); i++ {
		item := history[i]
		t := strings.TrimSpace(item.Text)
		if t == "" {
			continue
		}
		role := "user"
		if item.Sender == "bot" {
			role = "model"
		}
		raw = append(raw, geminiContent{
			Role:  role,
			Parts: []geminiPart{{Text: t}},
		})
	}
	raw = append(raw, geminiContent{
		Role:  "user",
		Parts: []geminiPart{{Text: strings.TrimSpace(userMessage)}},
	})

	var contents []geminiContent
	for _, item := range raw {
		if len(contents) == 0 {
			if item.Role != "user" {
				continue // Gemini API requires first turn to be 'user'
			}
			contents = append(contents, item)
			continue
		}
		lastIdx := len(contents) - 1
		if contents[lastIdx].Role == item.Role {
			// Merge consecutive turns with identical roles to satisfy strict alternation
			contents[lastIdx].Parts[0].Text += "\n" + item.Parts[0].Text
		} else {
			contents = append(contents, item)
		}
	}

	if len(contents) == 0 {
		contents = append(contents, geminiContent{
			Role:  "user",
			Parts: []geminiPart{{Text: strings.TrimSpace(userMessage)}},
		})
	}

	return contents
}

func isCalculationQuery(text string) bool {
	q := strings.ToLower(text)
	keywords := []string{
		"tính", "dự toán", "bóc tách", "khối lượng", "3 tầng", "nhà phố", "bom", "chịu tải",
		"100m", "công thức", "tiết diện", "chọn cb", "dòng điện", "cỡ ống", "tính tải", "tính dây",
	}
	for _, kw := range keywords {
		if strings.Contains(q, kw) {
			return true
		}
	}
	return false
}

func isCatalogQuery(text string) bool {
	q := strings.ToLower(text)
	keywords := []string{
		"giá", "chiết khấu", "bảng giá", "kho", "bao nhiêu", "bán", "mua",
		"cadivi", "bình minh", "schneider", "panasonic", "sino", "tiền phong",
		"đắt", "rẻ", "thay thế", "mã", "sku", "sản phẩm", "tồn kho",
	}
	for _, kw := range keywords {
		if strings.Contains(q, kw) {
			return true
		}
	}
	return false
}

func (h *ChatHandler) callGemini(
	ctx context.Context,
	apiKey, userMessage string,
	history []ChatHistoryItem,
	products []domain.Product,
	pCtx *ProjectContext,
) (*ChatResponse, error) {
	systemPrompt := buildSystemPrompt(products, pCtx)
	contents := buildGeminiContents(history, userMessage)

	reqData := geminiReqBody{
		Contents: contents,
		SystemInstruction: &struct {
			Parts []geminiPart `json:"parts"`
		}{
			Parts: []geminiPart{{Text: systemPrompt}},
		},
	}
	reqData.GenerationConfig.Temperature = 0.45
	reqData.GenerationConfig.MaxOutputTokens = 2048

	bodyBytes, err := json.Marshal(reqData)
	if err != nil {
		return nil, fmt.Errorf("marshal gemini req: %w", err)
	}

	modelName := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
	if modelName == "" {
		modelName = "gemini-3.5-flash"
	}
	modelsToTry := []string{modelName}
	if modelName != "gemini-3.1-flash-lite" {
		modelsToTry = append(modelsToTry, "gemini-3.1-flash-lite")
	}

	var gResp geminiRespBody
	var lastErr error

	for _, m := range modelsToTry {
		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", m, apiKey)
		httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
		if err != nil {
			return nil, fmt.Errorf("create gemini request: %w", err)
		}
		httpReq.Header.Set("Content-Type", "application/json")

		httpResp, err := h.httpClient.Do(httpReq)
		if err != nil {
			lastErr = fmt.Errorf("gemini http call (%s): %w", m, err)
			continue
		}

		if httpResp.StatusCode != http.StatusOK {
			var errResp geminiRespBody
			_ = json.NewDecoder(httpResp.Body).Decode(&errResp)
			_ = httpResp.Body.Close()
			errMsg := "status " + strconv.Itoa(httpResp.StatusCode)
			if errResp.Error != nil && errResp.Error.Message != "" {
				errMsg += ": " + errResp.Error.Message
			}
			lastErr = fmt.Errorf("gemini api error (%s): %s", m, errMsg)
			continue
		}

		decodeErr := json.NewDecoder(httpResp.Body).Decode(&gResp)
		_ = httpResp.Body.Close()
		if decodeErr != nil {
			lastErr = fmt.Errorf("decode gemini response: %w", decodeErr)
			continue
		}

		if len(gResp.Candidates) > 0 && len(gResp.Candidates[0].Content.Parts) > 0 {
			lastErr = nil
			break
		}
	}

	if lastErr != nil {
		return nil, lastErr
	}

	if len(gResp.Candidates) == 0 || len(gResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty gemini candidates")
	}

	replyText := gResp.Candidates[0].Content.Parts[0].Text

	// Extract products mentioned by SKU in the reply or in user query
	matchedProducts := extractMatchedProducts(replyText, userMessage, products)

	// Enforce Cải tiến 3 label requirements
	isCalc := isCalculationQuery(userMessage)
	if !isCalc {
		lowerRep := strings.ToLower(replyText)
		if strings.Contains(lowerRep, "i = ") || strings.Contains(lowerRep, "s = ") || strings.Contains(lowerRep, "u * cos") || strings.Contains(lowerRep, "a/mm") {
			isCalc = true
		}
	}
	isCatalog := len(matchedProducts) > 0 || isCatalogQuery(userMessage)

	if !strings.Contains(replyText, "[Ước tính") && !strings.Contains(replyText, "[Dữ liệu thật") {
		if isCalc {
			replyText = "[Ước tính — cần thợ điện nước xác nhận]\n" + replyText
		} else if isCatalog {
			replyText = "[Dữ liệu thật từ kho]\n" + replyText
		}
	}

	// Enforce mandatory safety disclaimer for technical calculations
	disclaimer := "Đây là ước tính tham khảo, cần kỹ sư điện nước xác nhận trước khi thi công."
	if isCalc && !strings.Contains(replyText, disclaimer) {
		replyText = strings.TrimSpace(replyText) + "\n\n" + disclaimer
	}

	return &ChatResponse{
		Reply:        replyText,
		Products:     matchedProducts,
		QuickReplies: defaultQuickPrompts,
		Mode:         "ai",
	}, nil
}

func extractMatchedProducts(reply, query string, allProducts []domain.Product) []ChatProductDTO {
	skuMap := make(map[string]domain.Product)
	for _, p := range allProducts {
		skuMap[strings.ToUpper(p.SKU)] = p
	}

	foundMap := make(map[string]ChatProductDTO)

	// Regex for [SKU] or SKU pattern
	reBracket := regexp.MustCompile(`\[([A-Z0-9_\-\.]{3,30})\]`)
	matches := reBracket.FindAllStringSubmatch(reply, -1)
	for _, m := range matches {
		if len(m) > 1 {
			candidateSKU := strings.ToUpper(m[1])
			if prod, exists := skuMap[candidateSKU]; exists {
				foundMap[candidateSKU] = toProductDTO(prod)
			}
		}
	}

	// Also check direct occurrences of product SKUs in reply or query
	for skuUpper, prod := range skuMap {
		if _, already := foundMap[skuUpper]; !already {
			if strings.Contains(strings.ToUpper(reply), skuUpper) || strings.Contains(strings.ToUpper(query), skuUpper) {
				foundMap[skuUpper] = toProductDTO(prod)
			}
		}
		if len(foundMap) >= 6 {
			break
		}
	}

	res := []ChatProductDTO{}
	for _, dto := range foundMap {
		res = append(res, dto)
	}
	sort.Slice(res, func(i, j int) bool {
		return res[i].Name < res[j].Name
	})

	if len(res) > 6 {
		res = res[:6]
	}
	return res
}

func stripAccents(s string) string {
	s = strings.ToLower(s)
	replacer := strings.NewReplacer(
		"à", "a", "á", "a", "ạ", "a", "ả", "a", "ã", "a", "â", "a", "ầ", "a", "ấ", "a", "ậ", "a", "ẩ", "a", "ẫ", "a", "ă", "a", "ằ", "a", "ắ", "a", "ặ", "a", "ẳ", "a", "ẵ", "a",
		"è", "e", "é", "e", "ẹ", "e", "ẻ", "e", "ẽ", "e", "ê", "e", "ề", "e", "ế", "e", "ệ", "e", "ể", "e", "ễ", "e",
		"ì", "i", "í", "i", "ị", "i", "ỉ", "i", "ĩ", "i",
		"ò", "o", "ó", "o", "ọ", "o", "ỏ", "o", "õ", "o", "ô", "o", "ồ", "o", "ố", "o", "ộ", "o", "ổ", "o", "ỗ", "o", "ơ", "o", "ờ", "o", "ớ", "o", "ợ", "o", "ở", "o", "ỡ", "o",
		"ù", "u", "ú", "u", "ụ", "u", "ủ", "u", "ũ", "u", "ư", "u", "ừ", "u", "ứ", "u", "ự", "u", "ử", "u", "ữ", "u",
		"ỳ", "y", "ý", "y", "ỵ", "y", "ỷ", "y", "ỹ", "y",
		"đ", "d",
	)
	return replacer.Replace(s)
}

func (h *ChatHandler) handleBasicLookup(query string, allProducts []domain.Product, pCtx *ProjectContext) *ChatResponse {
	qLower := strings.ToLower(query)
	qNorm := stripAccents(query)

	if strings.Contains(qNorm, "quen di") || strings.Contains(qNorm, "xoa cong trinh") || strings.Contains(qNorm, "xoa thong so") {
		return &ChatResponse{
			Reply:        "[Dữ liệu thật từ kho]\nĐã xóa sạch thông số công trình đã lưu. Quý khách có thể khai báo diện tích và số tầng mới bất cứ lúc nào.",
			Products:     []ChatProductDTO{},
			QuickReplies: defaultQuickPrompts,
			Mode:         "basic",
		}
	}

	isSubstitute := strings.Contains(qLower, "thay thế") ||
		strings.Contains(qLower, "đắt") ||
		strings.Contains(qLower, "hết hàng") ||
		strings.Contains(qLower, "giá cao")

	matched := filterProducts(query, allProducts)

	var reply strings.Builder
	reply.WriteString("[Chế độ tra cứu cơ bản (chưa có AI)]\n")

	// 1. Cải tiến 4: Gợi ý thay thế khi hết hàng hoặc chê đắt kèm chênh lệch giá từ DB
	if isSubstitute {
		reply.WriteString("[Dữ liệu thật từ kho]\n")
		if len(matched) == 0 {
			reply.WriteString("Không tìm thấy sản phẩm tương đương trong kho để gợi ý thay thế. Quý khách vui lòng cung cấp mã SKU hoặc tên sản phẩm cần thay thế.")
			return &ChatResponse{
				Reply:        reply.String(),
				Products:     []ChatProductDTO{},
				QuickReplies: defaultQuickPrompts,
				Mode:         "basic",
			}
		}

		reply.WriteString("Dưới đây là các sản phẩm tương đương có sẵn trong kho để bạn tham khảo thay thế kèm so sánh giá từ cơ sở dữ liệu:\n\n")

		// Sort by final price ascending
		sort.Slice(matched, func(i, j int) bool {
			priceI := matched[i].BasePrice * (1.0 - (matched[i].Brand.DiscountRate / 100.0))
			priceJ := matched[j].BasePrice * (1.0 - (matched[j].Brand.DiscountRate / 100.0))
			return priceI < priceJ
		})

		limit := 3
		if len(matched) < limit {
			limit = len(matched)
		}

		baseRefPrice := matched[0].BasePrice * (1.0 - (matched[0].Brand.DiscountRate / 100.0))
		var dtos []ChatProductDTO
		for i := 0; i < limit; i++ {
			dto := toProductDTO(matched[i])
			dtos = append(dtos, dto)

			diffText := ""
			if i > 0 {
				diff := dto.FinalPrice - baseRefPrice
				if diff > 0 {
					diffText = fmt.Sprintf(" (Chênh lệch: +%s so với %s)", formatVND(diff), dtos[0].Brand)
				} else if diff < 0 {
					diffText = fmt.Sprintf(" (Tiết kiệm hơn: %s)", formatVND(-diff))
				}
			}

			reply.WriteString(fmt.Sprintf(
				"%d. **%s** (SKU: `[%s]`)\n   - Hãng: **%s** | Danh mục: %s\n   - Giá niêm yết: %s | Chiết khấu: **%.0f%%** | Giá thanh toán: **%s**%s\n",
				i+1, dto.Name, dto.SKU, dto.Brand, dto.Category, dto.PriceStr, dto.DiscountRate, formatVND(dto.FinalPrice), diffText,
			))
		}

		return &ChatResponse{
			Reply:        reply.String(),
			Products:     dtos,
			QuickReplies: defaultQuickPrompts,
			Mode:         "basic",
		}
	}

	isPriceQuery := strings.Contains(qLower, "giá") || strings.Contains(qLower, "chiết khấu") || strings.Contains(qLower, "bao nhiêu") || strings.Contains(qLower, "báo giá")

	// 2. Cải tiến 3: Quick prompt 3 - Tính toán tải điện dây dẫn (TCVN 5898/IEC 60287)
	isCableLoad := !isPriceQuery && (strings.Contains(qLower, "chịu tải") ||
		strings.Contains(qLower, "tải được") ||
		strings.Contains(qLower, "công suất") ||
		(strings.Contains(qNorm, "tinh") && strings.Contains(qNorm, "2.5")))
	if isCableLoad {
		reply.WriteString("[Ước tính — cần thợ điện nước xác nhận]\n")
		reply.WriteString("### Tính toán khả năng chịu tải dây Cadivi 2.5mm² (TCVN/IEC):\n\n")
		reply.WriteString("**1. Công thức áp dụng:**\n")
		reply.WriteString("- Dòng điện làm việc cho phép: `I = S * J` (A)\n")
		reply.WriteString("  + `S`: Tiết diện ruột đồng (mm²)\n")
		reply.WriteString("  + `J`: Mật độ dòng điện kinh tế dây đồng bọc PVC đi âm/ống gen (J = 5 - 6 A/mm²)\n")
		reply.WriteString("- Công suất chịu tải 1 pha (220V): `P = U * I * cosφ` (với `U = 220V`, `cosφ ≈ 0.85`)\n\n")
		reply.WriteString("**2. Thay số tính toán:**\n")
		reply.WriteString("- Với dây tiết diện `S = 2.5 mm²` và `J = 6 A/mm²`:\n")
		reply.WriteString("  + Dòng tải liên tục: `I = 2.5 * 6 = 15 A`\n")
		reply.WriteString("  + Công suất phụ tải: `P = 220 * 15 * 0.85 = 2.805 W ≈ 2.8 kW` (cực đại ngắn hạn tới 3.3 kW)\n\n")
		reply.WriteString("**3. Thiết bị phù hợp sử dụng:**\n")
		reply.WriteString("- Phù hợp cấp nguồn cho: 01 máy lạnh 1.0 - 1.5 HP (750 - 1.200W), 01 bình nóng lạnh 2.500W (lộ riêng), hoặc trục cấp ổ cắm nhánh phòng ngủ/phòng khách.\n")
		reply.WriteString("- Khuyến nghị: Sử dụng Aptomat (MCB) bảo vệ định mức **16A** hoặc **20A**.\n\n")
		reply.WriteString("Đây là ước tính tham khảo, cần kỹ sư điện nước xác nhận trước khi thi công.\n")

		var dtos []ChatProductDTO
		limit := 4
		if len(matched) < limit {
			limit = len(matched)
		}
		for i := 0; i < limit; i++ {
			dtos = append(dtos, toProductDTO(matched[i]))
		}

		return &ChatResponse{
			Reply:        reply.String(),
			Products:     dtos,
			QuickReplies: defaultQuickPrompts,
			Mode:         "basic",
		}
	}

	// 3. Cải tiến 3: Quick prompt 4 & 1 - Ước tính BOM nhà phố / diện tích ống uPVC
	isBOMOrHouse := strings.Contains(qLower, "3 tầng") ||
		strings.Contains(qLower, "nhà phố") ||
		strings.Contains(qLower, "100m") ||
		(strings.Contains(qLower, "danh mục") && strings.Contains(qNorm, "ong"))
	if isBOMOrHouse {
		reply.WriteString("[Ước tính — cần thợ điện nước xác nhận]\n")
		reply.WriteString("### Ước tính danh mục vật tư ống uPVC công trình (Định mức tham khảo M&E):\n\n")

		area := 100.0
		floors := 1
		houseType := "nhà phố"
		if pCtx != nil {
			if pCtx.Area != nil && *pCtx.Area > 0 {
				area = *pCtx.Area
			}
			if pCtx.Floors != nil && *pCtx.Floors > 0 {
				floors = *pCtx.Floors
			}
			if pCtx.HouseType != nil && *pCtx.HouseType != "" {
				houseType = *pCtx.HouseType
			}
		}
		totalArea := area * float64(floors)
		pipeMeters := totalArea * 1.2

		reply.WriteString("**1. Công thức và định mức:**\n")
		reply.WriteString("- Định mức ống cấp thoát nước: `M_ong ≈ 1.2 - 1.5 m` ống các loại / m² sàn xây dựng.\n")
		if floors > 1 {
			reply.WriteString(fmt.Sprintf("- Thay số với diện tích công trình đã lưu (`%.0f m²` x `%d tầng` = tổng sàn `%.0f m²`, loại %s):\n", area, floors, totalArea, houseType))
		} else {
			reply.WriteString(fmt.Sprintf("- Thay số với diện tích sàn `%.0f m²` (loại %s):\n", totalArea, houseType))
		}
		reply.WriteString(fmt.Sprintf("  + Tổng chiều dài ống ước tính: `L = %.0f * 1.2 = %.0f m`\n\n", totalArea, pipeMeters))
		reply.WriteString("**2. Bóc tách danh mục ống uPVC tham khảo:**\n")
		reply.WriteString("| Hạng mục | Quy cách | Số lượng ước tính | Ứng dụng |\n")
		reply.WriteString("|---|---|---|---|\n")
		d90Count := int(math.Max(5, math.Round(totalArea*0.06)))
		d60Count := int(math.Max(8, math.Round(totalArea*0.09)))
		d34Count := int(math.Max(6, math.Round(totalArea*0.07)))
		reply.WriteString(fmt.Sprintf("| Ống thoát trục chính | uPVC D90 hoặc D114 | ~%d cây (~%d m) | Thoát bồn cầu, trục đứng thoát phân |\n", d90Count, d90Count*4))
		reply.WriteString(fmt.Sprintf("| Ống thoát sàn | uPVC D60 | ~%d cây (~%d m) | Thoát sàn toilet, ban công, sân thượng |\n", d60Count, d60Count*4))
		reply.WriteString(fmt.Sprintf("| Ống thoát chậu/lavabo | uPVC D34 hoặc D42 | ~%d cây (~%d m) | Thoát nước rửa mặt, bồn rửa bát |\n", d34Count, d34Count*4))
		reply.WriteString(fmt.Sprintf("| Ống cấp nhánh | PPR/uPVC D21 hoặc D27 | ~%.0f m | Nhánh cấp nước thiết bị |\n", totalArea*0.35))
		reply.WriteString("| Phụ kiện co, lơ, tê | Đồng bộ theo phi | Tỷ lệ ~15 - 20% giá trị ống | Nối chuyển hướng, rẽ nhánh |\n\n")
		reply.WriteString("Đây là ước tính tham khảo, cần kỹ sư điện nước xác nhận trước khi thi công.\n")

		var dtos []ChatProductDTO
		limit := 4
		if len(matched) < limit {
			limit = len(matched)
		}
		for i := 0; i < limit; i++ {
			dtos = append(dtos, toProductDTO(matched[i]))
		}

		return &ChatResponse{
			Reply:        reply.String(),
			Products:     dtos,
			QuickReplies: defaultQuickPrompts,
			Mode:         "basic",
		}
	}

	// 4. Tra cứu bảng giá & chiết khấu từ kho dữ liệu thật (Prompt 2 & sản phẩm thông thường)
	reply.WriteString("[Dữ liệu thật từ kho]\n")
	if len(matched) == 0 {
		reply.WriteString("Không tìm thấy sản phẩm nào khớp với từ khóa trong kho. Quý khách vui lòng kiểm tra lại tên thương hiệu (Cadivi, Bình Minh, Schneider, Panasonic) hoặc mã SKU cần tra cứu.")
		return &ChatResponse{
			Reply:        reply.String(),
			Products:     []ChatProductDTO{},
			QuickReplies: defaultQuickPrompts,
			Mode:         "basic",
		}
	}

	reply.WriteString(fmt.Sprintf("Tìm thấy %d sản phẩm phù hợp từ kho dữ liệu:\n\n", len(matched)))
	var dtos []ChatProductDTO
	limit := 5
	if len(matched) < limit {
		limit = len(matched)
	}
	for i := 0; i < limit; i++ {
		dto := toProductDTO(matched[i])
		dtos = append(dtos, dto)
		reply.WriteString(fmt.Sprintf(
			"- **%s** (SKU: `[%s]`): Giá niêm yết %s | Chiết khấu: **%.0f%%** | Giá sau CK: **%s**\n",
			dto.Name, dto.SKU, dto.PriceStr, dto.DiscountRate, formatVND(dto.FinalPrice),
		))
	}

	return &ChatResponse{
		Reply:        reply.String(),
		Products:     dtos,
		QuickReplies: defaultQuickPrompts,
		Mode:         "basic",
	}
}

type scoredProduct struct {
	prod  domain.Product
	score int
}

func filterProducts(query string, products []domain.Product) []domain.Product {
	qClean := strings.TrimSpace(query)
	qLower := strings.ToLower(qClean)
	qNorm := stripAccents(qClean)
	tokens := strings.Fields(qLower)
	tokensNorm := strings.Fields(qNorm)

	var scored []scoredProduct

	for _, p := range products {
		nameLower := strings.ToLower(p.Name)
		nameNorm := stripAccents(p.Name)
		skuLower := strings.ToLower(p.SKU)
		skuNorm := stripAccents(p.SKU)
		brandLower := strings.ToLower(p.Brand.Name)
		brandNorm := stripAccents(p.Brand.Name)
		catLower := strings.ToLower(p.Category.Name)
		catNorm := stripAccents(p.Category.Name)

		score := 0

		// Exact SKU match
		if skuLower == qLower || skuNorm == qNorm {
			score += 100
		} else if strings.Contains(skuLower, qLower) || strings.Contains(skuNorm, qNorm) {
			score += 50
		}

		for idx, t := range tokens {
			if len(t) < 2 {
				continue
			}
			tNorm := t
			if idx < len(tokensNorm) {
				tNorm = tokensNorm[idx]
			}

			if strings.Contains(skuLower, t) || strings.Contains(skuNorm, tNorm) {
				score += 25
			}
			if strings.Contains(nameLower, t) || strings.Contains(nameNorm, tNorm) {
				score += 15
			}
			if strings.Contains(brandLower, t) || strings.Contains(brandNorm, tNorm) {
				score += 12
			}
			if strings.Contains(catLower, t) || strings.Contains(catNorm, tNorm) {
				score += 8
			}

			if p.CrossSectionMM2 != nil {
				csStr := fmt.Sprintf("%.1f", *p.CrossSectionMM2)
				if strings.Contains(csStr, t) {
					score += 20
				}
			}
			if p.DiameterMM != nil {
				dStr := fmt.Sprintf("%.0f", *p.DiameterMM)
				if strings.Contains(dStr, t) {
					score += 20
				}
			}
		}

		if score > 0 {
			scored = append(scored, scoredProduct{prod: p, score: score})
		}
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	var res []domain.Product
	for _, sp := range scored {
		res = append(res, sp.prod)
	}

	// Fallback if no token matched
	if len(res) == 0 {
		for _, p := range products {
			if strings.Contains(strings.ToLower(p.Name), qLower) || strings.Contains(strings.ToLower(p.SKU), qLower) {
				res = append(res, p)
			}
		}
	}

	return res
}

