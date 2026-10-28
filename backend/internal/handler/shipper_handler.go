package handler

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
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

// randomCodeChars bỏ các ký tự dễ nhầm (0/O, 1/l/I) để người nộp gõ lại mã
// hay manager đọc mật khẩu tạm cho shipper khỏi nhầm.
const randomCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"

func generateRandomCode(length int) (string, error) {
	b := make([]byte, length)
	max := big.NewInt(int64(len(randomCodeChars)))
	for i := range b {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		b[i] = randomCodeChars[n.Int64()]
	}
	return string(b), nil
}

// hashLookupCode băm mã tra cứu bằng SHA-256: database chỉ giữ dạng băm,
// không giữ bản text gốc nên lộ database cũng không lộ mã.
func hashLookupCode(code string) string {
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
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

	// Mã tra cứu cấp ngay lúc nộp xong, trả về đúng 1 lần trong response này.
	// Người nộp tự lưu mã; hệ thống chỉ lưu dạng băm.
	lookupCode, err := generateRandomCode(8)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo mã tra cứu")
		return
	}
	codeHash := hashLookupCode(lookupCode)

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
		LookupCodeHash:       &codeHash,
	}

	if err := h.repo.CreateApplication(r.Context(), app); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo hồ sơ đăng ký")
		return
	}

	writeJSON(w, http.StatusCreated, domain.CreateApplicationResult{
		Application: app,
		LookupCode:  lookupCode,
	})
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

// LookupApplication cho shipper tự tra cứu trạng thái hồ sơ bằng SĐT + mã tra cứu.
// Public, không cần đăng nhập. Mã sai và SĐT không có hồ sơ đều trả cùng 1
// lỗi 404 chung chung để khỏi lộ hồ sơ nào tồn tại. Với hồ sơ APPROVED thì
// kèm email đã cấp + cờ đã đặt mật khẩu hay chưa (chỉ người có mã mới thấy).
// Nộp lại hồ sơ mới thì tra cứu thấy hồ sơ mới nhất (mã cũ hết hiệu lực).
func (h *ShipperHandler) LookupApplication(w http.ResponseWriter, r *http.Request) {
	phone := strings.TrimSpace(r.URL.Query().Get("phone"))
	code := strings.TrimSpace(r.URL.Query().Get("code"))
	if !isValidVNPhone(phone) {
		writeJSONError(w, http.StatusBadRequest, "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)")
		return
	}
	if code == "" {
		writeJSONError(w, http.StatusBadRequest, "Vui lòng nhập mã tra cứu")
		return
	}

	app, err := h.repo.FindLatestByPhone(r.Context(), phone)
	if err != nil {
		if errors.Is(err, domain.ErrApplicationNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ với số điện thoại và mã tra cứu này")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi truy vấn hồ sơ")
		return
	}
	if app.LookupCodeHash == nil || *app.LookupCodeHash != hashLookupCode(code) {
		writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ với số điện thoại và mã tra cứu này")
		return
	}
	writeJSON(w, http.StatusOK, domain.PublicApplicationStatus{
		Status:          app.Status,
		RejectionReason: app.RejectionReason,
		IssuedEmail:     app.IssuedEmail,
		PasswordSet:     app.PasswordSetAt != nil,
	})
}

// SetShipperPassword cho shipper đã duyệt tự đặt mật khẩu bằng SĐT + mã tra cứu.
// Public, không cần đăng nhập — mã tra cứu chính là bằng chứng là người nộp.
// Chỉ đặt được 1 lần; đặt rồi thì phải đăng nhập, quên mật khẩu thì liên hệ
// quản lý (chưa có luồng quên mật khẩu cho shipper).
func (h *ShipperHandler) SetShipperPassword(w http.ResponseWriter, r *http.Request) {
	var req domain.SetShipperPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	phone := strings.TrimSpace(req.Phone)
	code := strings.TrimSpace(req.Code)
	if !isValidVNPhone(phone) {
		writeJSONError(w, http.StatusBadRequest, "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)")
		return
	}
	if code == "" {
		writeJSONError(w, http.StatusBadRequest, "Vui lòng nhập mã tra cứu")
		return
	}
	if len([]rune(req.NewPassword)) < 8 {
		writeJSONError(w, http.StatusBadRequest, "Mật khẩu mới phải có ít nhất 8 ký tự")
		return
	}

	app, err := h.repo.FindLatestByPhone(r.Context(), phone)
	if err != nil {
		if errors.Is(err, domain.ErrApplicationNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ với số điện thoại và mã tra cứu này")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi truy vấn hồ sơ")
		return
	}
	if app.LookupCodeHash == nil || *app.LookupCodeHash != hashLookupCode(code) {
		writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ với số điện thoại và mã tra cứu này")
		return
	}
	if app.Status != domain.ApplicationApproved {
		if app.Status == domain.ApplicationPending {
			writeJSONError(w, http.StatusConflict, "Hồ sơ đang chờ duyệt, chưa thể đặt mật khẩu")
		} else {
			writeJSONError(w, http.StatusConflict, "Hồ sơ đã bị từ chối, không thể đặt mật khẩu")
		}
		return
	}
	if app.IssuedUserID == nil {
		writeJSONError(w, http.StatusInternalServerError, "Hồ sơ đã duyệt nhưng chưa có tài khoản")
		return
	}
	if app.PasswordSetAt != nil {
		writeJSONError(w, http.StatusConflict, "Mật khẩu đã được đặt, vui lòng đăng nhập")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Lỗi mã hóa mật khẩu")
		return
	}
	hashStr := string(hash)
	if err := h.repo.SetShipperPassword(r.Context(), app.ID, *app.IssuedUserID, hashStr); err != nil {
		if errors.Is(err, domain.ErrPasswordAlreadySet) {
			writeJSONError(w, http.StatusConflict, "Mật khẩu đã được đặt, vui lòng đăng nhập")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Không thể đặt mật khẩu")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"issuedEmail": app.IssuedEmail,
		"message":     "Đã đặt mật khẩu thành công",
	})
}

// ReissueLookupCode cho manager cấp lại mã tra cứu khi người nộp làm mất mã.
// Mã mới trả về đúng 1 lần, mã cũ hết hiệu lực ngay.
func (h *ShipperHandler) ReissueLookupCode(w http.ResponseWriter, r *http.Request) {
	id, ok := parseApplicationID(w, r)
	if !ok {
		return
	}

	newCode, err := generateRandomCode(8)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo mã tra cứu")
		return
	}
	newHash := hashLookupCode(newCode)

	if _, err := h.repo.ReissueLookupCode(r.Context(), id, newHash); err != nil {
		switch {
		case errors.Is(err, domain.ErrApplicationNotFound):
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy hồ sơ")
		case errors.Is(err, domain.ErrApplicationNotPending):
			writeJSONError(w, http.StatusConflict, "Hồ sơ đã bị từ chối, không thể cấp lại mã")
		default:
			writeJSONError(w, http.StatusInternalServerError, "Không thể cấp lại mã tra cứu")
		}
		return
	}

	writeJSON(w, http.StatusOK, domain.ReissueLookupCodeResult{LookupCode: newCode})
}

// ResetShipperPassword cho manager đặt lại mật khẩu khi shipper quên mật khẩu.
// Chỉ làm được với hồ sơ APPROVED (đã có tài khoản). Mật khẩu tạm sinh mới
// trả về đúng 1 lần trong response này, manager chuyển riêng cho shipper;
// mật khẩu cũ hết hiệu lực ngay, shipper đăng nhập bằng mật khẩu tạm sẽ bị
// bắt đổi mật khẩu mới ngay (must_change_password = TRUE).
func (h *ShipperHandler) ResetShipperPassword(w http.ResponseWriter, r *http.Request) {
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
	if app.Status != domain.ApplicationApproved || app.IssuedUserID == nil || app.IssuedEmail == nil {
		writeJSONError(w, http.StatusConflict, "Chỉ đặt lại mật khẩu được cho hồ sơ đã duyệt")
		return
	}

	tempPassword, err := generateRandomCode(12)
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
	if err := h.repo.ResetUserPassword(r.Context(), *app.IssuedUserID, hashStr); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể đặt lại mật khẩu")
		return
	}

	writeJSON(w, http.StatusOK, domain.ResetShipperPasswordResult{
		TempPassword: tempPassword,
		IssuedEmail:  *app.IssuedEmail,
	})
}

// ReclaimPoolEmail cho manager thu hồi mail của shipper đã nghỉ: tài khoản cũ
// bị vô hiệu hóa (không đăng nhập được nữa) và mail về lại pool trống.
// Lịch sử đơn hàng của shipper cũ vẫn được giữ nguyên.
func (h *ShipperHandler) ReclaimPoolEmail(w http.ResponseWriter, r *http.Request) {
	email := strings.ToLower(strings.TrimSpace(chi.URLParam(r, "email")))
	if email == "" {
		writeJSONError(w, http.StatusBadRequest, "Email không hợp lệ")
		return
	}

	entry, err := h.repo.ReclaimPoolEmail(r.Context(), email)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrPoolEmailNotFound):
			writeJSONError(w, http.StatusNotFound, "Email này không nằm trong pool 20 mail")
		case errors.Is(err, domain.ErrPoolEmailNotUsed):
			writeJSONError(w, http.StatusConflict, "Email này đang trống, không cần thu hồi")
		case errors.Is(err, domain.ErrReclaimBlocked):
			writeJSONError(w, http.StatusConflict, "Shipper còn đơn đang giao (PACKING/SHIPPING), không thể thu hồi lúc này")
		default:
			writeJSONError(w, http.StatusInternalServerError, "Không thể thu hồi mail")
		}
		return
	}

	writeJSON(w, http.StatusOK, entry)
}

// ApproveApplication duyệt hồ sơ: cấp 1 mail trống trong pool.
// Không còn mật khẩu tạm: tài khoản mới tạo với 1 mật khẩu ngẫu nhiên không
// ai biết, shipper tự đặt mật khẩu thật qua trang tra cứu bằng mã của mình.
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

	// Mật khẩu giữ chỗ ngẫu nhiên, không ai biết: tài khoản chưa dùng được
	// cho tới khi shipper tự đặt mật khẩu thật qua trang tra cứu.
	placeholder, err := generateRandomCode(32)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo tài khoản")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(placeholder), bcrypt.DefaultCost)
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
		MustChangePassword: false,
		IsActive:           true,
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
		Application: updated,
		IssuedEmail: cleanEmail,
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
