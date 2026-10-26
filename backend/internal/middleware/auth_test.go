package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

const testJWTSecret = "test-jwt-secret-for-middleware-tests"

func dummyOKHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
}

func TestRequireAuth_MissingHeader(t *testing.T) {
	jwtSvc := auth.NewJWTService(testJWTSecret)
	mw := NewAuthMiddleware(jwtSvc)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	rr := httptest.NewRecorder()

	handler := mw.RequireAuth(dummyOKHandler())
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "missing authorization header") {
		t.Fatalf("expected 'missing authorization header' message, got %q", rr.Body.String())
	}
}

func TestRequireAuth_InvalidHeaderFormat(t *testing.T) {
	jwtSvc := auth.NewJWTService(testJWTSecret)
	mw := NewAuthMiddleware(jwtSvc)

	testCases := []struct {
		name   string
		header string
	}{
		{"empty bearer", "Bearer"},
		{"three parts", "Bearer token extra"},
		{"basic auth", "Basic dXNlcjpwYXNz"},
		{"no scheme", "some-raw-token-value"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			req.Header.Set("Authorization", tc.header)
			rr := httptest.NewRecorder()

			handler := mw.RequireAuth(dummyOKHandler())
			handler.ServeHTTP(rr, req)

			if rr.Code != http.StatusUnauthorized {
				t.Fatalf("expected status 401 for header %q, got %d", tc.header, rr.Code)
			}
			if !strings.Contains(rr.Body.String(), "invalid authorization header format") {
				t.Fatalf("expected 'invalid authorization header format' message, got %q", rr.Body.String())
			}
		})
	}
}

func TestRequireAuth_InvalidToken(t *testing.T) {
	jwtSvc := auth.NewJWTService(testJWTSecret)
	mw := NewAuthMiddleware(jwtSvc)

	testCases := []struct {
		name  string
		token string
	}{
		{"random string", "garbage.jwt.token"},
		{"wrong secret", func() string {
			otherSvc := auth.NewJWTService("wrong-secret-key-1234567")
			p, _ := otherSvc.GenerateTokenPair(&domain.User{ID: uuid.New(), Role: domain.RoleCustomer})
			return p.AccessToken
		}()},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+tc.token)
			rr := httptest.NewRecorder()

			handler := mw.RequireAuth(dummyOKHandler())
			handler.ServeHTTP(rr, req)

			if rr.Code != http.StatusUnauthorized {
				t.Fatalf("expected status 401, got %d", rr.Code)
			}
			if !strings.Contains(rr.Body.String(), "invalid or expired token") {
				t.Fatalf("expected 'invalid or expired token', got %q", rr.Body.String())
			}
		})
	}
}

func TestRequireAuth_ValidToken(t *testing.T) {
	jwtSvc := auth.NewJWTService(testJWTSecret)
	mw := NewAuthMiddleware(jwtSvc)

	userID := uuid.New()
	user := &domain.User{
		ID:    userID,
		Email: "customer@tdt-me.com.vn",
		Role:  domain.RoleCustomer,
	}

	pair, err := jwtSvc.GenerateTokenPair(user)
	if err != nil {
		t.Fatalf("failed to generate token pair: %v", err)
	}

	var capturedClaims *auth.Claims
	inspectHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(ClaimsKey).(*auth.Claims)
		if ok {
			capturedClaims = claims
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("welcome"))
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	rr := httptest.NewRecorder()

	mw.RequireAuth(inspectHandler).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}
	if capturedClaims == nil {
		t.Fatal("expected claims to be populated in request context")
	}
	if capturedClaims.UserID != userID.String() {
		t.Errorf("expected userID %q, got %q", userID.String(), capturedClaims.UserID)
	}
	if capturedClaims.Email != user.Email {
		t.Errorf("expected email %q, got %q", user.Email, capturedClaims.Email)
	}
	if capturedClaims.Role != domain.RoleCustomer {
		t.Errorf("expected role CUSTOMER, got %q", capturedClaims.Role)
	}
}

func TestRequireRole_MissingClaims(t *testing.T) {
	// Request without claims in context
	req := httptest.NewRequest(http.MethodGet, "/manager", nil)
	rr := httptest.NewRecorder()

	handler := RequireRole(domain.RoleManager)(dummyOKHandler())
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "unauthorized") {
		t.Fatalf("expected 'unauthorized', got %q", rr.Body.String())
	}
}

func TestRequireRole_Forbidden(t *testing.T) {
	testCases := []struct {
		name         string
		userRole     domain.UserRole
		allowedRoles []domain.UserRole
	}{
		{
			name:         "customer accessing manager",
			userRole:     domain.RoleCustomer,
			allowedRoles: []domain.UserRole{domain.RoleManager},
		},
		{
			name:         "shipper accessing manager",
			userRole:     domain.RoleShipper,
			allowedRoles: []domain.UserRole{domain.RoleManager},
		},
		{
			name:         "sale accessing manager",
			userRole:     domain.RoleSale,
			allowedRoles: []domain.UserRole{domain.RoleManager},
		},
		{
			name:         "customer accessing shipper and manager",
			userRole:     domain.RoleCustomer,
			allowedRoles: []domain.UserRole{domain.RoleShipper, domain.RoleManager},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			claims := &auth.Claims{
				UserID: uuid.New().String(),
				Email:  "test@example.com",
				Role:   tc.userRole,
			}

			req := httptest.NewRequest(http.MethodGet, "/restricted", nil)
			ctx := context.WithValue(req.Context(), ClaimsKey, claims)
			req = req.WithContext(ctx)
			rr := httptest.NewRecorder()

			handler := RequireRole(tc.allowedRoles...)(dummyOKHandler())
			handler.ServeHTTP(rr, req)

			if rr.Code != http.StatusForbidden {
				t.Fatalf("expected status 403, got %d", rr.Code)
			}
			if !strings.Contains(rr.Body.String(), "forbidden: insufficient permissions") {
				t.Fatalf("expected forbidden message, got %q", rr.Body.String())
			}
		})
	}
}

func TestRequireRole_AllowedExact(t *testing.T) {
	testCases := []struct {
		name         string
		userRole     domain.UserRole
		allowedRoles []domain.UserRole
	}{
		{
			name:         "customer accessing customer",
			userRole:     domain.RoleCustomer,
			allowedRoles: []domain.UserRole{domain.RoleCustomer},
		},
		{
			name:         "manager accessing manager",
			userRole:     domain.RoleManager,
			allowedRoles: []domain.UserRole{domain.RoleManager},
		},
		{
			name:         "shipper accessing shipper",
			userRole:     domain.RoleShipper,
			allowedRoles: []domain.UserRole{domain.RoleShipper},
		},
		{
			name:         "shipper accessing multi-role list",
			userRole:     domain.RoleShipper,
			allowedRoles: []domain.UserRole{domain.RoleManager, domain.RoleShipper},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			claims := &auth.Claims{
				UserID: uuid.New().String(),
				Email:  "allowed@example.com",
				Role:   tc.userRole,
			}

			req := httptest.NewRequest(http.MethodGet, "/restricted", nil)
			ctx := context.WithValue(req.Context(), ClaimsKey, claims)
			req = req.WithContext(ctx)
			rr := httptest.NewRecorder()

			handler := RequireRole(tc.allowedRoles...)(dummyOKHandler())
			handler.ServeHTTP(rr, req)

			if rr.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d", rr.Code)
			}
		})
	}
}

func TestRequireRole_AdminTokenRejected(t *testing.T) {
	// Old ADMIN tokens are rejected by RequireRole after ADMIN role consolidation
	targetRoles := [][]domain.UserRole{
		{domain.RoleCustomer},
		{domain.RoleManager},
		{domain.RoleShipper},
		{domain.RoleSale},
		{domain.RoleManager, domain.RoleShipper},
	}

	for _, roles := range targetRoles {
		claims := &auth.Claims{
			UserID: uuid.New().String(),
			Email:  "admin@tdt.vn",
			Role:   domain.UserRole("ADMIN"),
		}

		req := httptest.NewRequest(http.MethodGet, "/any-route", nil)
		ctx := context.WithValue(req.Context(), ClaimsKey, claims)
		req = req.WithContext(ctx)
		rr := httptest.NewRecorder()

		handler := RequireRole(roles...)(dummyOKHandler())
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected old ADMIN token to be rejected with 403 for roles %v, got %d", roles, rr.Code)
		}
	}
}

func TestContextHelpers(t *testing.T) {
	userID := uuid.New().String()
	role := domain.RoleManager
	email := "manager@tdt-me.com.vn"

	claims := &auth.Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
	}

	// 1. Success cases with populated context
	ctx := context.WithValue(context.Background(), ClaimsKey, claims)

	gotClaims, ok := GetClaimsFromContext(ctx)
	if !ok || gotClaims == nil {
		t.Fatal("expected GetClaimsFromContext to succeed")
	}
	if gotClaims.UserID != userID || gotClaims.Role != role || gotClaims.Email != email {
		t.Errorf("claims mismatch: %+v", gotClaims)
	}

	gotUserID, ok := GetUserIDFromContext(ctx)
	if !ok || gotUserID != userID {
		t.Errorf("expected userID %q, got %q (ok: %v)", userID, gotUserID, ok)
	}

	gotRole, ok := GetUserRoleFromContext(ctx)
	if !ok || gotRole != role {
		t.Errorf("expected role %q, got %q (ok: %v)", role, gotRole, ok)
	}

	// 2. Empty context cases
	emptyCtx := context.Background()

	if _, ok := GetClaimsFromContext(emptyCtx); ok {
		t.Error("expected GetClaimsFromContext to fail on empty context")
	}
	if _, ok := GetUserIDFromContext(emptyCtx); ok {
		t.Error("expected GetUserIDFromContext to fail on empty context")
	}
	if _, ok := GetUserRoleFromContext(emptyCtx); ok {
		t.Error("expected GetUserRoleFromContext to fail on empty context")
	}

	// 3. Wrong type in context
	wrongTypeCtx := context.WithValue(context.Background(), ClaimsKey, "not-a-claims-struct")
	if _, ok := GetClaimsFromContext(wrongTypeCtx); ok {
		t.Error("expected GetClaimsFromContext to fail on wrong type")
	}
}

func init() {
	_ = time.Second // keep time package imported if needed
}
