package handler

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

type ShipperHandler struct {
	repo domain.ShipperRepository
}

func NewShipperHandler(repo domain.ShipperRepository) *ShipperHandler {
	return &ShipperHandler{repo: repo}
}

// tempPasswordChars bỏ các ký tự dễ nhầm (0/O, 1/l/I) để manager đọc cho shipper khỏi nhầm.
const tempPasswordChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"

func generateTempPassword(length int) (string, error) {
	b := make([]byte, length)
	max := big.NewInt(int64(len(tempPasswordChars)))
	for i := range b {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		b[i] = tempPasswordChars[n.Int64()]
	}
	return string(b), nil
}

// isValidVNPhone chấp nhận SĐT di động Việt Nam 10 số bắt đầu bằng 0.
func isValidVNPhone(phone string) bool {
	if len(phone) != 10 || phone[0] != '0' {
		return false
	}
	for i := 0; i < len(phone); i++ {
		if phone[i] < '0' || phone[i] > '9' {
			return false
		}
	}
	return true
}

func calculateAge(dob time.Time, now time.Time) int {
	age := now.Year() - dob.Year()
	if now.Month() < dob.Month() || (now.Month() == dob.Month() && now.Day() < dob.Day()) {
		age--
	}
	return age
}

// maskDocumentNumber chỉ giữ 4 ký tự cuối của số giấy tờ, phần còn lại bỏ hẳn.
func maskDocumentNumber(number string) string {
	r := []rune(strings.TrimSpace(number))
	if len(r) <= 4 {
		return string(r)
	}
	return string(r[len(r)-4:])
}

func parseApplicationID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "ID hồ sơ không hợp lệ")
		return uuid.Nil, false
	}
	return id, true
}

func getReviewerID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	userIDStr, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userIDStr == "" {
		writeJSONError(w, http.StatusUnauthorized, "Chưa xác thực người dùng")
		return uuid.Nil, false
	}
	reviewerID, err := uuid.Parse(userIDStr)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Mã người dùng không hợp lệ")
		return uuid.Nil, false
	}
	return reviewerID, true
}

func writeJSON(w http.ResponseWriter, statusCode int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(v)
}

// CreateApplication nhận hồ sơ xin làm shipper, không cần đăng nhập.
// Hồ sơ mới luôn ở trạng thái PENDING, chưa phải tài khoản shipper.
func (h *ShipperHandler) CreateApplication(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateShipperApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	cleanName := strings.TrimSpace(req.FullName)
	if len([]rune(cleanName)) < 2 || len([]rune(cleanName)) > 200 {
		writeJSONError(w, http.StatusBadRequest, "Họ và tên phải có độ dài từ 2 đến 200 ký tự")
		return
	}

	cleanPhone := strings.TrimSpace(req.Phone)
	if !isValidVNPhone(cleanPhone) {
		writeJSONError(w, http.StatusBadRequest, "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)")
		return
	}

	dob, err := time.Parse("2006-01-02", strings.TrimSpace(req.DateOfBirth))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "Ngày sinh không hợp lệ (định dạng YYYY-MM-DD)")
		return
	}
	if calculateAge(dob, time.Now()) < 18 {
		writeJSONError(w, http.StatusBadRequest, "Shipper phải đủ 18 tuổi")
		return
	}

	cleanDocType := strings.TrimSpace(req.DocumentType)
	if cleanDocType == "" {
		writeJSONError(w, http.StatusBadRequest, "Vui lòng chọn loại giấy tờ")
		return
	}
	if len([]rune(strings.TrimSpace(req.DocumentNumber))) < 4 {
		writeJSONError(w, http.StatusBadRequest, "Số giấy tờ phải có ít nhất 4 ký tự")
		return
	}

	if !req.TermsAccepted || !req.TrainingConfirmed {
		writeJSONError(w, http.StatusBadRequest, "Cần đồng ý điều khoản hợp tác và xác nhận đã học quy trình")
		return
	}

	var cleanPlate, cleanLicense *string
	if req.LicensePlate != nil {
		if p := strings.TrimSpace(*req.LicensePlate); p != "" {
			cleanPlate = &p
		}
	}
	if req.DriverLicense != nil {
		if d := strings.TrimSpace(*req.DriverLicense); d != "" {
			cleanLicense = &d
		}
	}

	app := &domain.ShipperApplication{
		ID:                   uuid.New(),
		FullName:             cleanName,
		Phone:                cleanPhone,
		DateOfBirth:          dob,
		DocumentType:         cleanDocType,
		DocumentNumberMasked: maskDocumentNumber(req.DocumentNumber),
		LicensePlate:         cleanPlate,
		DriverLicense:        cleanLicense,
		TermsAccepted:        true,
		TrainingConfirmed:    true,
		Status:               domain.ApplicationPending,
	}

	if err := h.repo.CreateApplication(r.Context(), app); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo hồ sơ đăng ký")
		return
	}

	writeJSON(w, http.StatusCreated, app)
}

// ListApplications trả về danh sách hồ sơ, lọc theo ?status=PENDING|APPROVED|REJECTED.
func (h *ShipperHandler) ListApplications(w http.ResponseWriter, r *http.Request) {
	statusStr := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("status")))
	var status domain.ApplicationStatus
	switch statusStr {
	case "", "PENDING", "APPROVED", "REJECTED":
		status = domain.ApplicationStatus(statusStr)
	default:
		writeJSONError(w, http.StatusBadRequest, "Trạng thái không hợp lệ")
		return
	}

	apps, err := h.repo.ListApplications(r.Context(), status)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể lấy danh sách hồ sơ")
		return
	}
	if apps == nil {
		apps = []*domain.ShipperApplication{}
	}
	writeJSON(w, http.StatusOK, apps)
}

func (h *ShipperHandler) GetApplication(w http.ResponseWriter, r *http.Request) {
	id, ok := parseApplicationID(w, r)
	if !ok {
		return
	}

	app, err := h.repo.GetApplicationByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrApplicationNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi truy vấn hồ sơ")
		return
	}
	writeJSON(w, http.StatusOK, app)
}

// ApproveApplication duyệt hồ sơ: cấp 1 mail trống trong pool + mật khẩu tạm.
// Mật khẩu tạm chỉ trả về đúng 1 lần trong response này.
func (h *ShipperHandler) ApproveApplication(w http.ResponseWriter, r *http.Request) {
	id, ok := parseApplicationID(w, r)
	if !ok {
		return
	}

	var req domain.ApproveShipperApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))
	if cleanEmail == "" {
		writeJSONError(w, http.StatusBadRequest, "Vui lòng chọn 1 mail trống trong pool để cấp")
		return
	}
	if !req.Checks.AllChecked() {
		writeJSONError(w, http.StatusBadRequest, "Cần tick đủ 4 điều kiện (giấy tờ, phương tiện, điều khoản, hướng dẫn) trước khi duyệt")
		return
	}

	reviewerID, ok := getReviewerID(w, r)
	if !ok {
		return
	}

	existing, err := h.repo.GetApplicationByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrApplicationNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi truy vấn hồ sơ")
		return
	}
	if existing.Status != domain.ApplicationPending {
		writeJSONError(w, http.StatusConflict, "Hồ sơ này đã được xử lý")
		return
	}

	tempPassword, err := generateTempPassword(12)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo mật khẩu tạm")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Lỗi mã hóa mật khẩu")
		return
	}
	hashStr := string(hash)
	phone := existing.Phone
	newUser := &domain.User{
		ID:                 uuid.New(),
		Email:              cleanEmail,
		FullName:           existing.FullName,
		Phone:              &phone,
		PasswordHash:       &hashStr,
		Role:               domain.RoleShipper,
		AuthProvider:       domain.AuthProviderLocal,
		MustChangePassword: true,
	}

	updated, err := h.repo.ApproveApplication(r.Context(), id, reviewerID, cleanEmail, req.Checks, newUser)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrApplicationNotFound):
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ")
		case errors.Is(err, domain.ErrApplicationNotPending):
			writeJSONError(w, http.StatusConflict, "Hồ sơ này đã được xử lý")
		case errors.Is(err, domain.ErrPoolEmailNotFound):
			writeJSONError(w, http.StatusNotFound, "Email này không nằm trong pool 20 mail")
		case errors.Is(err, domain.ErrPoolEmailNotFree):
			writeJSONError(w, http.StatusConflict, "Email này đã được cấp cho shipper khác")
		default:
			writeJSONError(w, http.StatusInternalServerError, "Không thể duyệt hồ sơ")
		}
		return
	}

	writeJSON(w, http.StatusOK, domain.ApproveShipperApplicationResult{
		Application:  updated,
		IssuedEmail:  cleanEmail,
		TempPassword: tempPassword,
	})
}

// RejectApplication từ chối hồ sơ, bắt buộc kèm lý do.
func (h *ShipperHandler) RejectApplication(w http.ResponseWriter, r *http.Request) {
	id, ok := parseApplicationID(w, r)
	if !ok {
		return
	}

	var req domain.RejectShipperApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	reason := strings.TrimSpace(req.Reason)
	if len([]rune(reason)) < 5 {
		writeJSONError(w, http.StatusBadRequest, "Lý do từ chối phải có ít nhất 5 ký tự")
		return
	}

	reviewerID, ok := getReviewerID(w, r)
	if !ok {
		return
	}

	updated, err := h.repo.RejectApplication(r.Context(), id, reviewerID, reason)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrApplicationNotFound):
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ")
		case errors.Is(err, domain.ErrApplicationNotPending):
			writeJSONError(w, http.StatusConflict, "Hồ sơ này đã được xử lý")
		default:
			writeJSONError(w, http.StatusInternalServerError, "Không thể từ chối hồ sơ")
		}
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

// ListEmailPool trả về 20 mail trong pool kèm trạng thái trống/đang dùng bởi ai.
func (h *ShipperHandler) ListEmailPool(w http.ResponseWriter, r *http.Request) {
	pool, err := h.repo.ListEmailPool(r.Context())
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể lấy danh sách mail pool")
		return
	}
	if pool == nil {
		pool = []*domain.ShipperEmailPoolEntry{}
	}
	writeJSON(w, http.StatusOK, pool)
}
