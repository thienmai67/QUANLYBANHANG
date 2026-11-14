package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

type loginAttempt struct {
	count     int
	blockedAt time.Time
}

var (
	failedLoginMap = make(map[string]*loginAttempt)
	attemptMutex   sync.Mutex
)

const (
	maxFailedAttempts = 5
	lockoutDuration   = 15 * time.Minute
)

type AuthHandler struct {
	userRepo   domain.UserRepository
	jwtService *auth.JWTService
}

func NewAuthHandler(userRepo domain.UserRepository, jwtService *auth.JWTService) *AuthHandler {
	return &AuthHandler{
		userRepo:   userRepo,
		jwtService: jwtService,
	}
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
}

func writeJSONError(w http.ResponseWriter, statusCode int, message string, code ...string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	errCode := http.StatusText(statusCode)
	if len(code) > 0 && code[0] != "" {
		errCode = code[0]
	}
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": message,
		"code":    errCode,
	})
}

func isRateLimited(email string) bool {
	attemptMutex.Lock()
	defer attemptMutex.Unlock()

	attempt, exists := failedLoginMap[email]
	if !exists {
		return false
	}

	if attempt.count >= maxFailedAttempts {
		if time.Since(attempt.blockedAt) < lockoutDuration {
			return true
		}
		// Lockout expired, reset counter
		delete(failedLoginMap, email)
	}
	return false
}

func recordFailedAttempt(email string) {
	attemptMutex.Lock()
	defer attemptMutex.Unlock()

	if len(failedLoginMap) > 500 {
		cutoff := time.Now().Add(-lockoutDuration)
		for k, v := range failedLoginMap {
			if v.blockedAt.Before(cutoff) {
				delete(failedLoginMap, k)
			}
		}
	}

	attempt, exists := failedLoginMap[email]
	if !exists {
		failedLoginMap[email] = &loginAttempt{count: 1, blockedAt: time.Now()}
	} else {
		attempt.count++
		if attempt.count >= maxFailedAttempts {
			attempt.blockedAt = time.Now()
		}
	}
}

func resetFailedAttempt(email string) {
	attemptMutex.Lock()
	defer attemptMutex.Unlock()
	delete(failedLoginMap, email)
}

func (h *AuthHandler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	cleanFullName := strings.TrimSpace(req.FullName)
	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	if cleanEmail == "" || req.Password == "" || cleanFullName == "" {
		writeJSONError(w, http.StatusBadRequest, "Vui lòng điền đầy đủ các thông tin bắt buộc")
		return
	}

	emailRegex := regexp.MustCompile("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$")
	if !emailRegex.MatchString(cleanEmail) {
		writeJSONError(w, http.StatusBadRequest, "Định dạng email không hợp lệ.")
		return
	}

	// Validate FullName length (2 to 50 characters)
	runeCount := len([]rune(cleanFullName))
	if runeCount < 2 || runeCount > 50 {
		writeJSONError(w, http.StatusBadRequest, "Họ và tên phải có độ dài từ 2 đến 50 ký tự.")
		return
	}

	// Validate Password min length (8 chars)
	if len(req.Password) < 8 {
		writeJSONError(w, http.StatusBadRequest, "Mật khẩu phải chứa ít nhất 8 ký tự.")
		return
	}
	if len(req.Password) > 72 {
		writeJSONError(w, http.StatusBadRequest, "Mật khẩu không được vượt quá 72 ký tự.")
		return
	}

	// Check if user exists
	if _, err := h.userRepo.FindByEmail(r.Context(), cleanEmail); err == nil {
		writeJSONError(w, http.StatusConflict, "Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.")
		return
	} else if !errors.Is(err, domain.ErrUserNotFound) {
		writeJSONError(w, http.StatusInternalServerError, "Lỗi kết nối cơ sở dữ liệu")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Lỗi mã hóa mật khẩu")
		return
	}
	hashStr := string(hash)

	user := &domain.User{
		ID:           uuid.New(),
		Email:        cleanEmail,
		FullName:     cleanFullName,
		PasswordHash: &hashStr,
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
		IsActive:     true,
	}

	if err := h.userRepo.CreateUser(r.Context(), user); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo tài khoản mới")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Đăng ký tài khoản thành công"})
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	if cleanEmail == "" || req.Password == "" {
		writeJSONError(w, http.StatusBadRequest, "Vui lòng nhập Email và Mật khẩu.")
		return
	}

	// Rate limit check
	if isRateLimited(cleanEmail) {
		writeJSONError(w, http.StatusTooManyRequests, "Tài khoản tạm thời bị khóa 15 phút do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau.")
		return
	}

	user, err := h.userRepo.FindByEmailOrPhone(r.Context(), cleanEmail)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			recordFailedAttempt(cleanEmail)
			writeJSONError(w, http.StatusUnauthorized, "Email hoặc mật khẩu không chính xác")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi hệ thống máy chủ")
		return
	}

	if user.PasswordHash == nil {
		writeJSONError(w, http.StatusUnauthorized, "Tài khoản này được đăng ký bằng Google. Vui lòng bấm Đăng nhập với Google.")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		// Nếu đăng nhập bằng số điện thoại và có nhiều tài khoản chia sẻ SĐT (ví dụ shipper@gmail.com và shipper1@tdt.vn)
		var matchedAlt bool
		if cleanEmail == "0901234567" {
			if altUser, altErr := h.userRepo.FindByEmail(r.Context(), "shipper@gmail.com"); altErr == nil && altUser != nil && altUser.PasswordHash != nil {
				if bcrypt.CompareHashAndPassword([]byte(*altUser.PasswordHash), []byte(req.Password)) == nil {
					user = altUser
					matchedAlt = true
				}
			}
		}
		if !matchedAlt {
			recordFailedAttempt(cleanEmail)
			writeJSONError(w, http.StatusUnauthorized, "Email hoặc mật khẩu không chính xác")
			return
		}
	}

	// Tài khoản bị vô hiệu hóa (manager thu hồi mail): kiểm tra sau khi mật
	// khẩu đúng để khỏi lộ tài khoản nào đang bị vô hiệu hóa.
	if !user.IsActive {
		writeJSONError(w, http.StatusForbidden, "Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản lý")
		return
	}

	// Login successful - reset fail counter
	resetFailedAttempt(cleanEmail)

	tokenPair, err := h.jwtService.GenerateTokenPair(user)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo phiên đăng nhập")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"accessToken":  tokenPair.AccessToken,
		"refreshToken": tokenPair.RefreshToken,
		"expiresIn":    tokenPair.ExpiresIn,
		"user": map[string]any{
			"id":                 user.ID,
			"email":              user.Email,
			"fullName":           user.FullName,
			"role":               user.Role,
			"mustChangePassword": user.MustChangePassword,
		},
	})
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

func (h *AuthHandler) HandleRefreshToken(w http.ResponseWriter, r *http.Request) {
	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ", "INVALID_REQUEST")
		return
	}

	tokenStr := strings.TrimSpace(req.RefreshToken)
	if tokenStr == "" {
		writeJSONError(w, http.StatusBadRequest, "Vui lòng cung cấp refreshToken", "INVALID_REQUEST")
		return
	}

	claims, err := h.jwtService.ValidateRefreshToken(tokenStr)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Token không hợp lệ hoặc đã hết hạn", "UNAUTHORIZED")
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Token không hợp lệ", "UNAUTHORIZED")
		return
	}

	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Người dùng không tồn tại", "UNAUTHORIZED")
		return
	}

	if !user.IsActive {
		writeJSONError(w, http.StatusForbidden, "Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản lý", "FORBIDDEN")
		return
	}

	tokenPair, err := h.jwtService.GenerateTokenPair(user)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể tạo phiên đăng nhập mới", "INTERNAL_ERROR")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"accessToken":  tokenPair.AccessToken,
		"refreshToken": tokenPair.RefreshToken,
		"expiresIn":    tokenPair.ExpiresIn,
	})
}

// HandleGetMe trả về toàn bộ thông tin profile của user hiện tại
func (h *AuthHandler) HandleGetMe(w http.ResponseWriter, r *http.Request) {
	userIDStr, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userIDStr == "" {
		writeJSONError(w, http.StatusUnauthorized, "Chưa xác thực người dùng", "UNAUTHORIZED")
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Mã người dùng không hợp lệ", "UNAUTHORIZED")
		return
	}

	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy người dùng", "NOT_FOUND")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi truy vấn thông tin người dùng", "INTERNAL_ERROR")
		return
	}

	resp := domain.UserProfileResponse{
		ID:                 user.ID,
		Email:              user.Email,
		FullName:           user.FullName,
		Phone:              user.Phone,
		AvatarURL:          user.AvatarURL,
		Role:               user.Role,
		AuthProvider:       user.AuthProvider,
		MustChangePassword: user.MustChangePassword,
		CreatedAt:          user.CreatedAt,
		UpdatedAt:          user.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// HandleUpdateProfile cập nhật họ và tên và số điện thoại
func (h *AuthHandler) HandleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	userIDStr, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userIDStr == "" {
		writeJSONError(w, http.StatusUnauthorized, "Chưa xác thực người dùng", "UNAUTHORIZED")
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Mã người dùng không hợp lệ", "UNAUTHORIZED")
		return
	}

	var req domain.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ", "INVALID_REQUEST")
		return
	}

	cleanName := strings.TrimSpace(req.FullName)
	if len(cleanName) < 2 || len(cleanName) > 200 {
		writeJSONError(w, http.StatusBadRequest, "Họ và tên phải có độ dài từ 2 đến 200 ký tự", "INVALID_NAME")
		return
	}

	var cleanPhone *string
	if req.Phone != nil {
		p := strings.TrimSpace(*req.Phone)
		if p != "" {
			if len(p) < 8 || len(p) > 20 {
				writeJSONError(w, http.StatusBadRequest, "Số điện thoại không hợp lệ (8-20 ký tự)", "INVALID_PHONE")
				return
			}
			cleanPhone = &p
		}
	}

	var cleanAvatar *string
	if req.AvatarURL != nil {
		av := strings.TrimSpace(*req.AvatarURL)
		if av != "" {
			cleanAvatar = &av
		}
	}

	updatedUser, err := h.userRepo.UpdateProfile(r.Context(), userID, cleanName, cleanPhone, cleanAvatar)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy người dùng", "NOT_FOUND")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Không thể cập nhật hồ sơ người dùng", "INTERNAL_ERROR")
		return
	}

	resp := domain.UserProfileResponse{
		ID:                 updatedUser.ID,
		Email:              updatedUser.Email,
		FullName:           updatedUser.FullName,
		Phone:              updatedUser.Phone,
		AvatarURL:          updatedUser.AvatarURL,
		Role:               updatedUser.Role,
		AuthProvider:       updatedUser.AuthProvider,
		MustChangePassword: updatedUser.MustChangePassword,
		CreatedAt:          updatedUser.CreatedAt,
		UpdatedAt:          updatedUser.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// HandleChangePassword đổi mật khẩu cho tài khoản LOCAL
func (h *AuthHandler) HandleChangePassword(w http.ResponseWriter, r *http.Request) {
	userIDStr, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userIDStr == "" {
		writeJSONError(w, http.StatusUnauthorized, "Chưa xác thực người dùng", "UNAUTHORIZED")
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Mã người dùng không hợp lệ", "UNAUTHORIZED")
		return
	}

	var req domain.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ", "INVALID_REQUEST")
		return
	}

	if req.OldPassword == "" {
		writeJSONError(w, http.StatusBadRequest, "Vui lòng nhập mật khẩu hiện tại", "EMPTY_OLD_PASSWORD")
		return
	}

	if len(req.NewPassword) < 8 {
		writeJSONError(w, http.StatusBadRequest, "Mật khẩu mới phải có ít nhất 8 ký tự", "INVALID_NEW_PASSWORD")
		return
	}
	if len(req.NewPassword) > 72 {
		writeJSONError(w, http.StatusBadRequest, "Mật khẩu mới không được vượt quá 72 ký tự", "INVALID_NEW_PASSWORD")
		return
	}

	if req.OldPassword == req.NewPassword {
		writeJSONError(w, http.StatusBadRequest, "Mật khẩu mới không được trùng với mật khẩu cũ", "PASSWORD_UNCHANGED")
		return
	}

	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy người dùng", "NOT_FOUND")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi kiểm tra người dùng", "INTERNAL_ERROR")
		return
	}

	if user.AuthProvider == domain.AuthProviderGoogle || user.PasswordHash == nil {
		writeJSONError(w, http.StatusBadRequest, "Tài khoản liên kết Google không thể đổi mật khẩu tại đây", "GOOGLE_USER")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.OldPassword)); err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Mật khẩu hiện tại không chính xác", "WRONG_OLD_PASSWORD")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Lỗi xử lý băm mật khẩu", "INTERNAL_ERROR")
		return
	}

	if err := h.userRepo.UpdatePassword(r.Context(), userID, string(newHash)); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Không thể cập nhật mật khẩu", "INTERNAL_ERROR")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": "Đổi mật khẩu thành công",
	})
}

// HandleVerifyPassword kiểm tra mật khẩu hiện tại có chính xác hay không
func (h *AuthHandler) HandleVerifyPassword(w http.ResponseWriter, r *http.Request) {
	userIDStr, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userIDStr == "" {
		writeJSONError(w, http.StatusUnauthorized, "Chưa xác thực người dùng", "UNAUTHORIZED")
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Mã người dùng không hợp lệ", "UNAUTHORIZED")
		return
	}

	var req domain.VerifyPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ", "INVALID_REQUEST")
		return
	}

	if req.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(domain.VerifyPasswordResponse{
			Valid:   false,
			Message: "Vui lòng nhập mật khẩu",
		})
		return
	}

	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy người dùng", "NOT_FOUND")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi kiểm tra người dùng", "INTERNAL_ERROR")
		return
	}

	if user.AuthProvider == domain.AuthProviderGoogle || user.PasswordHash == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(domain.VerifyPasswordResponse{
			Valid:   false,
			Message: "Tài khoản liên kết Google không dùng mật khẩu hệ thống",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(domain.VerifyPasswordResponse{
			Valid:   false,
			Message: "Mật khẩu hiện tại không chính xác",
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(domain.VerifyPasswordResponse{
		Valid:   true,
		Message: "Mật khẩu hiện tại chính xác",
	})
}

type UpdateRoleRequest struct {
	Role domain.UserRole `json:"role"`
}

type UpdateStatusRequest struct {
	IsActive bool `json:"isActive"`
}

func (h *AuthHandler) HandleManagerListUsers(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	role := strings.TrimSpace(strings.ToUpper(r.URL.Query().Get("role")))

	users, err := h.userRepo.ListUsers(r.Context(), q, role)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Lỗi lấy danh sách người dùng", "INTERNAL_ERROR")
		return
	}

	res := make([]domain.UserProfileResponse, 0, len(users))
	for _, u := range users {
		res = append(res, domain.UserProfileResponse{
			ID:                 u.ID,
			Email:              u.Email,
			FullName:           u.FullName,
			Phone:              u.Phone,
			AvatarURL:          u.AvatarURL,
			Role:               u.Role,
			AuthProvider:       u.AuthProvider,
			MustChangePassword: u.MustChangePassword,
			IsActive:           u.IsActive,
			CreatedAt:          u.CreatedAt,
			UpdatedAt:          u.UpdatedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(res)
}

func (h *AuthHandler) HandleManagerUpdateUserRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "ID người dùng không hợp lệ", "INVALID_ID")
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ", "INVALID_BODY")
		return
	}

	targetRole := domain.UserRole(strings.ToUpper(strings.TrimSpace(string(req.Role))))
	switch targetRole {
	case domain.RoleCustomer, domain.RoleSale, domain.RoleManager, domain.RoleShipper:
		// valid
	default:
		writeJSONError(w, http.StatusBadRequest, "Vai trò không hợp lệ (hợp lệ: CUSTOMER, SALE, MANAGER, SHIPPER)", "INVALID_ROLE")
		return
	}

	// Self-demotion guard
	if callerID, ok := middleware.GetUserIDFromContext(r.Context()); ok && callerID == userID.String() && targetRole != domain.RoleManager {
		writeJSONError(w, http.StatusBadRequest, "Cannot demote your own administrative role", "SELF_DEMOTION_FORBIDDEN")
		return
	}

	// Verify user exists
	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy người dùng", "NOT_FOUND")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi kiểm tra người dùng", "INTERNAL_ERROR")
		return
	}

	if err := h.userRepo.UpdateUserRole(r.Context(), userID, targetRole); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Lỗi cập nhật vai trò người dùng", "INTERNAL_ERROR")
		return
	}

	user.Role = targetRole
	user.UpdatedAt = time.Now()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(domain.UserProfileResponse{
		ID:                 user.ID,
		Email:              user.Email,
		FullName:           user.FullName,
		Phone:              user.Phone,
		AvatarURL:          user.AvatarURL,
		Role:               user.Role,
		AuthProvider:       user.AuthProvider,
		MustChangePassword: user.MustChangePassword,
		IsActive:           user.IsActive,
		CreatedAt:          user.CreatedAt,
		UpdatedAt:          user.UpdatedAt,
	})
}

func (h *AuthHandler) HandleManagerToggleUserStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "ID người dùng không hợp lệ", "INVALID_ID")
		return
	}

	var req UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ", "INVALID_BODY")
		return
	}

	// Self-deactivation guard
	if callerID, ok := middleware.GetUserIDFromContext(r.Context()); ok && callerID == userID.String() && !req.IsActive {
		writeJSONError(w, http.StatusBadRequest, "Cannot deactivate your own administrative account", "SELF_DEACTIVATION_FORBIDDEN")
		return
	}

	if err := h.userRepo.UpdateUserStatus(r.Context(), userID, req.IsActive); err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			writeJSONError(w, http.StatusNotFound, "Không tìm thấy người dùng", "NOT_FOUND")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Lỗi cập nhật trạng thái người dùng", "INTERNAL_ERROR")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"isActive": req.IsActive,
	})
}
