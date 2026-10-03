package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
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

func writeJSONError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
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

	// Validate FullName length (2 to 50 characters)
	runeCount := len([]rune(cleanFullName))
	if runeCount < 2 || runeCount > 50 {
		writeJSONError(w, http.StatusBadRequest, "Họ và tên phải có độ dài từ 2 đến 50 ký tự.")
		return
	}

	// Validate Password min length (6 chars)
	if len(req.Password) < 6 {
		writeJSONError(w, http.StatusBadRequest, "Mật khẩu phải chứa ít nhất 6 ký tự.")
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

	user, err := h.userRepo.FindByEmail(r.Context(), cleanEmail)
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
		recordFailedAttempt(cleanEmail)
		writeJSONError(w, http.StatusUnauthorized, "Email hoặc mật khẩu không chính xác")
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
	json.NewEncoder(w).Encode(tokenPair)
}
