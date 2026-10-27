package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

type mockUserRepo struct {
	sync.Mutex
	users             map[string]*domain.User
	findByEmailErr    error
	createUserErr     error
	upsertGoogleErr   error
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users: make(map[string]*domain.User),
	}
}

func (m *mockUserRepo) UpsertGoogleUser(ctx context.Context, info *domain.GoogleUserInfo) (*domain.User, error) {
	m.Lock()
	defer m.Unlock()
	if m.upsertGoogleErr != nil {
		return nil, m.upsertGoogleErr
	}
	email := strings.ToLower(info.Email)
	user, exists := m.users[email]
	if !exists {
		user = &domain.User{
			ID:           uuid.New(),
			Email:        email,
			FullName:     info.Name,
			AvatarURL:    &info.Picture,
			GoogleID:     &info.Sub,
			Role:         domain.RoleCustomer,
			AuthProvider: domain.AuthProviderGoogle,
			CreatedAt:    time.Now().UTC(),
			UpdatedAt:    time.Now().UTC(),
		}
		m.users[email] = user
	} else {
		user.GoogleID = &info.Sub
		user.AvatarURL = &info.Picture
		user.AuthProvider = domain.AuthProviderGoogle
		user.UpdatedAt = time.Now().UTC()
	}
	return user, nil
}

func (m *mockUserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	m.Lock()
	defer m.Unlock()
	if m.findByEmailErr != nil {
		return nil, m.findByEmailErr
	}
	user, exists := m.users[strings.ToLower(email)]
	if !exists {
		return nil, domain.ErrUserNotFound
	}
	return user, nil
}

func (m *mockUserRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	m.Lock()
	defer m.Unlock()
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, domain.ErrUserNotFound
}

func (m *mockUserRepo) CreateUser(ctx context.Context, user *domain.User) error {
	m.Lock()
	defer m.Unlock()
	if m.createUserErr != nil {
		return m.createUserErr
	}
	email := strings.ToLower(user.Email)
	if _, exists := m.users[email]; exists {
		return errors.New("duplicate key violation")
	}
	now := time.Now().UTC()
	user.CreatedAt = now
	user.UpdatedAt = now
	m.users[email] = user
	return nil
}

func (m *mockUserRepo) UpdateProfile(ctx context.Context, id uuid.UUID, fullName string, phone *string, avatarURL *string) (*domain.User, error) {
	m.Lock()
	defer m.Unlock()
	for _, u := range m.users {
		if u.ID == id {
			u.FullName = fullName
			u.Phone = phone
			if avatarURL != nil {
				u.AvatarURL = avatarURL
			}
			u.UpdatedAt = time.Now().UTC()
			return u, nil
		}
	}
	return nil, domain.ErrUserNotFound
}

func (m *mockUserRepo) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	m.Lock()
	defer m.Unlock()
	for _, u := range m.users {
		if u.ID == id {
			u.PasswordHash = &passwordHash
			u.UpdatedAt = time.Now().UTC()
			return nil
		}
	}
	return domain.ErrUserNotFound
}

func TestHandleRegister_Success(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-for-test-jwt-1234567890")
	h := NewAuthHandler(repo, jwtSvc)

	payload := RegisterRequest{
		Email:    "test_reg_success@tdt-me.com.vn",
		Password: "Password123",
		FullName: "Nguyễn Văn A",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.HandleRegister(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var res map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}
	if res["message"] != "Đăng ký tài khoản thành công" {
		t.Errorf("expected success message, got %q", res["message"])
	}

	// Verify user is in repo with hashed password
	savedUser, err := repo.FindByEmail(context.Background(), payload.Email)
	if err != nil {
		t.Fatalf("expected user to be saved in repository: %v", err)
	}
	if savedUser.FullName != payload.FullName {
		t.Errorf("expected fullName %q, got %q", payload.FullName, savedUser.FullName)
	}
	if savedUser.Role != domain.RoleCustomer {
		t.Errorf("expected role CUSTOMER, got %q", savedUser.Role)
	}
	if savedUser.PasswordHash == nil {
		t.Fatal("expected non-nil password hash")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*savedUser.PasswordHash), []byte(payload.Password)); err != nil {
		t.Fatalf("saved password hash does not match plaintext password: %v", err)
	}
}

func TestHandleRegister_InvalidJSON(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader("invalid-json{"))
	rr := httptest.NewRecorder()

	h.HandleRegister(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for malformed JSON, got %d", rr.Code)
	}
}

func TestHandleRegister_EmptyFields(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	testCases := []struct {
		name     string
		email    string
		password string
		fullName string
	}{
		{"empty email", "", "Password123", "Nguyễn Văn A"},
		{"whitespace email", "   ", "Password123", "Nguyễn Văn A"},
		{"empty password", "empty_pwd@tdt.vn", "", "Nguyễn Văn A"},
		{"empty full name", "empty_name@tdt.vn", "Password123", ""},
		{"whitespace full name", "empty_ws@tdt.vn", "Password123", "   "},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			payload := RegisterRequest{Email: tc.email, Password: tc.password, FullName: tc.fullName}
			body, _ := json.Marshal(payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
			rr := httptest.NewRecorder()

			h.HandleRegister(rr, req)

			if rr.Code != http.StatusBadRequest {
				t.Fatalf("expected status 400, got %d: %s", rr.Code, rr.Body.String())
			}
			if !strings.Contains(rr.Body.String(), "Vui lòng điền đầy đủ các thông tin bắt buộc") {
				t.Errorf("expected required fields error message, got %s", rr.Body.String())
			}
		})
	}
}

func TestHandleRegister_FullNameLength(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	testCases := []struct {
		name     string
		fullName string
	}{
		{"single character", "A"},
		{"over 50 characters", strings.Repeat("A", 51)},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			payload := RegisterRequest{
				Email:    fmt.Sprintf("len_name_%d@tdt.vn", len(tc.fullName)),
				Password: "Password123",
				FullName: tc.fullName,
			}
			body, _ := json.Marshal(payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
			rr := httptest.NewRecorder()

			h.HandleRegister(rr, req)

			if rr.Code != http.StatusBadRequest {
				t.Fatalf("expected status 400, got %d", rr.Code)
			}
			if !strings.Contains(rr.Body.String(), "Họ và tên phải có độ dài từ 2 đến 50 ký tự.") {
				t.Errorf("expected name length error, got %s", rr.Body.String())
			}
		})
	}
}

func TestHandleRegister_PasswordLength(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	payload := RegisterRequest{
		Email:    "short_pwd@tdt.vn",
		Password: "12345", // 5 characters
		FullName: "Nguyễn Văn B",
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleRegister(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Mật khẩu phải chứa ít nhất 6 ký tự.") {
		t.Errorf("expected password length error, got %s", rr.Body.String())
	}
}

func TestHandleRegister_DuplicateEmail(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	email := "duplicate_user@tdt-me.com.vn"
	_ = repo.CreateUser(context.Background(), &domain.User{
		ID:       uuid.New(),
		Email:    email,
		FullName: "Existing User",
		Role:     domain.RoleCustomer,
	})

	payload := RegisterRequest{
		Email:    email,
		Password: "Password123",
		FullName: "Another Name",
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleRegister(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected status 409 Conflict, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Email này đã được sử dụng") {
		t.Errorf("expected duplicate email error message, got %s", rr.Body.String())
	}
}

func TestHandleRegister_DBErrorOnFindByEmail(t *testing.T) {
	repo := newMockUserRepo()
	repo.findByEmailErr = errors.New("db connection timeout")
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	payload := RegisterRequest{
		Email:    "dberr_find@tdt.vn",
		Password: "Password123",
		FullName: "Nguyen Van C",
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleRegister(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Lỗi kết nối cơ sở dữ liệu") {
		t.Errorf("expected db error message, got %s", rr.Body.String())
	}
}

func TestHandleRegister_DBErrorOnCreateUser(t *testing.T) {
	repo := newMockUserRepo()
	repo.createUserErr = errors.New("cannot insert user")
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	payload := RegisterRequest{
		Email:    "dberr_create@tdt.vn",
		Password: "Password123",
		FullName: "Nguyen Van D",
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleRegister(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Không thể tạo tài khoản mới") {
		t.Errorf("expected create user error message, got %s", rr.Body.String())
	}
}

func TestHandleLogin_Success(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-login-1234567890123456")
	h := NewAuthHandler(repo, jwtSvc)

	email := "login_success_unique@tdt.vn"
	plainPassword := "ValidPassword123"
	hash, _ := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	hashStr := string(hash)

	_ = repo.CreateUser(context.Background(), &domain.User{
		ID:           uuid.New(),
		Email:        email,
		FullName:     "Login Tester",
		PasswordHash: &hashStr,
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	})

	payload := LoginRequest{Email: email, Password: plainPassword}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleLogin(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var pair domain.TokenPair
	if err := json.Unmarshal(rr.Body.Bytes(), &pair); err != nil {
		t.Fatalf("failed to decode TokenPair: %v", err)
	}

	if pair.AccessToken == "" || pair.RefreshToken == "" {
		t.Fatal("expected non-empty tokens in TokenPair")
	}

	claims, err := jwtSvc.ValidateClaims(pair.AccessToken)
	if err != nil {
		t.Fatalf("access token failed validation: %v", err)
	}
	if claims.Email != email {
		t.Errorf("expected email %q, got %q", email, claims.Email)
	}
}

func TestHandleLogin_InvalidJSON(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader("bad-json"))
	rr := httptest.NewRecorder()

	h.HandleLogin(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for bad JSON, got %d", rr.Code)
	}
}

func TestHandleLogin_EmptyCredentials(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	testCases := []struct {
		name     string
		email    string
		password string
	}{
		{"empty email", "", "Password123"},
		{"empty password", "user@tdt.vn", ""},
		{"both empty", "", ""},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			payload := LoginRequest{Email: tc.email, Password: tc.password}
			body, _ := json.Marshal(payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
			rr := httptest.NewRecorder()

			h.HandleLogin(rr, req)

			if rr.Code != http.StatusBadRequest {
				t.Fatalf("expected status 400, got %d", rr.Code)
			}
			if !strings.Contains(rr.Body.String(), "Vui lòng nhập Email và Mật khẩu.") {
				t.Errorf("expected empty credentials message, got %s", rr.Body.String())
			}
		})
	}
}

func TestHandleLogin_UserNotFound(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	payload := LoginRequest{Email: "non_existent_user_999@tdt.vn", Password: "Password123"}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleLogin(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Email hoặc mật khẩu không chính xác") {
		t.Errorf("expected unauthorized message, got %s", rr.Body.String())
	}
}

func TestHandleLogin_GoogleUserNoPassword(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	email := "google_sso_user@tdt.vn"
	_ = repo.CreateUser(context.Background(), &domain.User{
		ID:           uuid.New(),
		Email:        email,
		FullName:     "Google User",
		PasswordHash: nil, // Social account has no password
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderGoogle,
	})

	payload := LoginRequest{Email: email, Password: "AnyPassword123"}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleLogin(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Tài khoản này được đăng ký bằng Google. Vui lòng bấm Đăng nhập với Google.") {
		t.Errorf("expected google login advice, got %s", rr.Body.String())
	}
}

func TestHandleLogin_WrongPassword(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	email := "wrong_pwd_user_test@tdt.vn"
	hash, _ := bcrypt.GenerateFromPassword([]byte("CorrectPassword123"), bcrypt.DefaultCost)
	hashStr := string(hash)

	_ = repo.CreateUser(context.Background(), &domain.User{
		ID:           uuid.New(),
		Email:        email,
		FullName:     "Wrong Pwd Tester",
		PasswordHash: &hashStr,
		Role:         domain.RoleCustomer,
	})

	payload := LoginRequest{Email: email, Password: "IncorrectPassword!"}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleLogin(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Email hoặc mật khẩu không chính xác") {
		t.Errorf("expected unauthorized message, got %s", rr.Body.String())
	}
}

func TestHandleLogin_RateLimiting(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	email := "rate_limited_unique_victim@tdt.vn"
	hash, _ := bcrypt.GenerateFromPassword([]byte("Correct123456"), bcrypt.DefaultCost)
	hashStr := string(hash)

	_ = repo.CreateUser(context.Background(), &domain.User{
		ID:           uuid.New(),
		Email:        email,
		FullName:     "Rate Limit Target",
		PasswordHash: &hashStr,
		Role:         domain.RoleCustomer,
	})

	// Perform 5 consecutive failed login attempts
	for i := 1; i <= 5; i++ {
		payload := LoginRequest{Email: email, Password: "WrongPassword"}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		h.HandleLogin(rr, req)

		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("attempt %d: expected status 401, got %d", i, rr.Code)
		}
	}

	// 6th attempt must be blocked by rate limiter with 429 Too Many Requests
	{
		payload := LoginRequest{Email: email, Password: "WrongPassword"}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		h.HandleLogin(rr, req)

		if rr.Code != http.StatusTooManyRequests {
			t.Fatalf("6th attempt: expected status 429 Too Many Requests, got %d", rr.Code)
		}
		if !strings.Contains(rr.Body.String(), "Tài khoản tạm thời bị khóa 15 phút do nhập sai mật khẩu quá 5 lần") {
			t.Errorf("expected lockout message, got %s", rr.Body.String())
		}
	}
}

func TestHandleLogin_DBError(t *testing.T) {
	repo := newMockUserRepo()
	repo.findByEmailErr = errors.New("database connection refused")
	jwtSvc := auth.NewJWTService("secret")
	h := NewAuthHandler(repo, jwtSvc)

	payload := LoginRequest{Email: "dberr_login@tdt.vn", Password: "Password123"}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.HandleLogin(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Lỗi hệ thống máy chủ") {
		t.Errorf("expected server error message, got %s", rr.Body.String())
	}
}


func TestHandleGetMe_Success(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-key-32-bytes-long-123456789")
	h := NewAuthHandler(repo, jwtSvc)

	testUser := &domain.User{
		ID:           uuid.New(),
		Email:        "getme@tdt.vn",
		FullName:     "Nguyễn Văn Sáu",
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}
	_ = repo.CreateUser(context.Background(), testUser)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/users/me", nil)
	claims := &auth.Claims{
		UserID: testUser.ID.String(),
		Role:   domain.RoleCustomer,
	}
	ctx := context.WithValue(req.Context(), middleware.ClaimsKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	h.HandleGetMe(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp domain.UserProfileResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.Email != "getme@tdt.vn" || resp.FullName != "Nguyễn Văn Sáu" {
		t.Errorf("unexpected profile data: %+v", resp)
	}
}

func TestHandleUpdateProfile_Success(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-key-32-bytes-long-123456789")
	h := NewAuthHandler(repo, jwtSvc)

	testUser := &domain.User{
		ID:           uuid.New(),
		Email:        "update@tdt.vn",
		FullName:     "Tên Cũ",
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}
	_ = repo.CreateUser(context.Background(), testUser)

	newPhone := "0912345678"
	updateReq := domain.UpdateProfileRequest{
		FullName: "Tên Mới",
		Phone:    &newPhone,
	}
	body, _ := json.Marshal(updateReq)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/users/me", bytes.NewReader(body))
	claims := &auth.Claims{
		UserID: testUser.ID.String(),
		Role:   domain.RoleCustomer,
	}
	ctx := context.WithValue(req.Context(), middleware.ClaimsKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	h.HandleUpdateProfile(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp domain.UserProfileResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.FullName != "Tên Mới" || resp.Phone == nil || *resp.Phone != "0912345678" {
		t.Errorf("unexpected updated data: %+v", resp)
	}
}

func TestHandleChangePassword_Success(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-key-32-bytes-long-123456789")
	h := NewAuthHandler(repo, jwtSvc)

	oldHash, _ := bcrypt.GenerateFromPassword([]byte("OldPass1234"), bcrypt.DefaultCost)
	hashStr := string(oldHash)

	testUser := &domain.User{
		ID:           uuid.New(),
		Email:        "pw@tdt.vn",
		FullName:     "Pass User",
		PasswordHash: &hashStr,
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}
	_ = repo.CreateUser(context.Background(), testUser)

	pwReq := domain.ChangePasswordRequest{
		OldPassword: "OldPass1234",
		NewPassword: "NewPass5678",
	}
	body, _ := json.Marshal(pwReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/me/change-password", bytes.NewReader(body))
	claims := &auth.Claims{
		UserID: testUser.ID.String(),
		Role:   domain.RoleCustomer,
	}
	ctx := context.WithValue(req.Context(), middleware.ClaimsKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	h.HandleChangePassword(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	// Verify new password works
	u, _ := repo.FindByID(context.Background(), testUser.ID)
	if err := bcrypt.CompareHashAndPassword([]byte(*u.PasswordHash), []byte("NewPass5678")); err != nil {
		t.Errorf("new password hash does not match: %v", err)
	}
}

func TestHandleChangePassword_WrongOld(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-key-32-bytes-long-123456789")
	h := NewAuthHandler(repo, jwtSvc)

	oldHash, _ := bcrypt.GenerateFromPassword([]byte("OldPass1234"), bcrypt.DefaultCost)
	hashStr := string(oldHash)

	testUser := &domain.User{
		ID:           uuid.New(),
		Email:        "wrongpw@tdt.vn",
		FullName:     "Pass User",
		PasswordHash: &hashStr,
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}
	_ = repo.CreateUser(context.Background(), testUser)

	pwReq := domain.ChangePasswordRequest{
		OldPassword: "WrongPassword999",
		NewPassword: "NewPass5678",
	}
	body, _ := json.Marshal(pwReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/me/change-password", bytes.NewReader(body))
	claims := &auth.Claims{
		UserID: testUser.ID.String(),
		Role:   domain.RoleCustomer,
	}
	ctx := context.WithValue(req.Context(), middleware.ClaimsKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	h.HandleChangePassword(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
}

func TestHandleChangePassword_GoogleUser(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-key-32-bytes-long-123456789")
	h := NewAuthHandler(repo, jwtSvc)

	testUser := &domain.User{
		ID:           uuid.New(),
		Email:        "google@tdt.vn",
		FullName:     "Google User",
		PasswordHash: nil,
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderGoogle,
	}
	_ = repo.CreateUser(context.Background(), testUser)

	pwReq := domain.ChangePasswordRequest{
		OldPassword: "OldPass1234",
		NewPassword: "NewPass5678",
	}
	body, _ := json.Marshal(pwReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/me/change-password", bytes.NewReader(body))
	claims := &auth.Claims{
		UserID: testUser.ID.String(),
		Role:   domain.RoleCustomer,
	}
	ctx := context.WithValue(req.Context(), middleware.ClaimsKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	h.HandleChangePassword(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for google user, got %d", rr.Code)
	}
}


func TestHandleVerifyPassword_Success(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-key-32-bytes-long-123456789")
	h := NewAuthHandler(repo, jwtSvc)

	pw := "OldPass1234"
	hash, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	hStr := string(hash)

	testUser := &domain.User{
		ID:           uuid.New(),
		Email:        "verify@tdt.vn",
		PasswordHash: &hStr,
		AuthProvider: domain.AuthProviderLocal,
		Role:         domain.RoleCustomer,
	}
	_ = repo.CreateUser(context.Background(), testUser)

	verifyReq := domain.VerifyPasswordRequest{
		Password: "OldPass1234",
	}
	body, _ := json.Marshal(verifyReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/me/verify-password", bytes.NewReader(body))
	claims := &auth.Claims{
		UserID: testUser.ID.String(),
		Role:   domain.RoleCustomer,
	}
	ctx := context.WithValue(req.Context(), middleware.ClaimsKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	h.HandleVerifyPassword(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp domain.VerifyPasswordResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode resp: %v", err)
	}
	if !resp.Valid {
		t.Fatalf("expected valid true, got false")
	}
}

func TestHandleVerifyPassword_Wrong(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret-key-32-bytes-long-123456789")
	h := NewAuthHandler(repo, jwtSvc)

	pw := "OldPass1234"
	hash, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	hStr := string(hash)

	testUser := &domain.User{
		ID:           uuid.New(),
		Email:        "verify2@tdt.vn",
		PasswordHash: &hStr,
		AuthProvider: domain.AuthProviderLocal,
		Role:         domain.RoleCustomer,
	}
	_ = repo.CreateUser(context.Background(), testUser)

	verifyReq := domain.VerifyPasswordRequest{
		Password: "WrongPassword999",
	}
	body, _ := json.Marshal(verifyReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/me/verify-password", bytes.NewReader(body))
	claims := &auth.Claims{
		UserID: testUser.ID.String(),
		Role:   domain.RoleCustomer,
	}
	ctx := context.WithValue(req.Context(), middleware.ClaimsKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	h.HandleVerifyPassword(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp domain.VerifyPasswordResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode resp: %v", err)
	}
	if resp.Valid {
		t.Fatalf("expected valid false, got true")
	}
}
