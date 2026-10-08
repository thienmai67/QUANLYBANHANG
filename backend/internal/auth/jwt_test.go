package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

const testSecret = "test-jwt-secret-key-for-testing-12345"

func TestNewJWTService(t *testing.T) {
	svc := NewJWTService(testSecret)
	if svc == nil {
		t.Fatal("expected non-nil JWTService")
	}
	if string(svc.secret) != testSecret {
		t.Fatalf("expected secret %q, got %q", testSecret, string(svc.secret))
	}
}

func TestGenerateTokenPair(t *testing.T) {
	svc := NewJWTService(testSecret)

	user := &domain.User{
		ID:    uuid.New(),
		Email: "customer@tdt-me.com.vn",
		Role:  domain.RoleCustomer,
	}

	tokenPair, err := svc.GenerateTokenPair(user)
	if err != nil {
		t.Fatalf("unexpected error generating token pair: %v", err)
	}

	if tokenPair == nil {
		t.Fatal("expected non-nil token pair")
	}

	if tokenPair.AccessToken == "" {
		t.Error("expected non-empty access token")
	}
	if tokenPair.RefreshToken == "" {
		t.Error("expected non-empty refresh token")
	}
	if tokenPair.ExpiresIn != int64(AccessTokenTTL.Seconds()) {
		t.Errorf("expected expiresIn %d, got %d", int64(AccessTokenTTL.Seconds()), tokenPair.ExpiresIn)
	}

	// Validate access token claims
	claims, err := svc.ValidateClaims(tokenPair.AccessToken)
	if err != nil {
		t.Fatalf("failed to validate generated access token: %v", err)
	}

	if claims.UserID != user.ID.String() {
		t.Errorf("expected userID %q, got %q", user.ID.String(), claims.UserID)
	}
	if claims.Email != user.Email {
		t.Errorf("expected email %q, got %q", user.Email, claims.Email)
	}
	if claims.Role != user.Role {
		t.Errorf("expected role %q, got %q", user.Role, claims.Role)
	}
	if claims.Issuer != "tdt-me-platform" {
		t.Errorf("expected issuer 'tdt-me-platform', got %q", claims.Issuer)
	}
}

func TestValidateClaims_Success(t *testing.T) {
	svc := NewJWTService(testSecret)

	roles := []domain.UserRole{
		domain.RoleCustomer,
		domain.RoleManager,
		domain.RoleShipper,
		domain.RoleAdmin,
		domain.RoleSale,
	}

	for _, role := range roles {
		t.Run(string(role), func(t *testing.T) {
			userID := uuid.New()
			user := &domain.User{
				ID:    userID,
				Email: string(role) + "@tdt-me.com.vn",
				Role:  role,
			}

			pair, err := svc.GenerateTokenPair(user)
			if err != nil {
				t.Fatalf("error generating token: %v", err)
			}

			claims, err := svc.ValidateClaims(pair.AccessToken)
			if err != nil {
				t.Fatalf("unexpected validation error: %v", err)
			}

			if claims.UserID != userID.String() {
				t.Errorf("expected userID %q, got %q", userID.String(), claims.UserID)
			}
			if claims.Email != user.Email {
				t.Errorf("expected email %q, got %q", user.Email, claims.Email)
			}
			if claims.Role != role {
				t.Errorf("expected role %q, got %q", role, claims.Role)
			}
		})
	}
}

func TestValidateClaims_Expired(t *testing.T) {
	svc := NewJWTService(testSecret)

	// Create an expired token manually using same signing secret
	now := time.Now().Add(-2 * time.Hour)
	claims := Claims{
		UserID: uuid.New().String(),
		Email:  "expired@tdt-me.com.vn",
		Role:   domain.RoleCustomer,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "expired-user",
			Issuer:    "tdt-me-platform",
			Audience:  jwt.ClaimStrings{"access"},
			IssuedAt:  jwt.NewNumericDate(now.Add(-time.Hour)),
			ExpiresAt: jwt.NewNumericDate(now), // Expired 2 hours ago
		},
	}

	tokenStr, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(testSecret))
	if err != nil {
		t.Fatalf("failed to sign expired token: %v", err)
	}

	_, err = svc.ValidateClaims(tokenStr)
	if err == nil {
		t.Fatal("expected validation error for expired token, got nil")
	}
}

func TestValidateClaims_WrongSecret(t *testing.T) {
	svc := NewJWTService(testSecret)

	otherSvc := NewJWTService("a-completely-different-secret-key-1234")
	user := &domain.User{
		ID:    uuid.New(),
		Email: "user@tdt-me.com.vn",
		Role:  domain.RoleCustomer,
	}

	pair, err := otherSvc.GenerateTokenPair(user)
	if err != nil {
		t.Fatalf("failed to generate token with other secret: %v", err)
	}

	_, err = svc.ValidateClaims(pair.AccessToken)
	if err == nil {
		t.Fatal("expected validation error for token signed with different secret, got nil")
	}
}

func TestValidateClaims_WrongIssuer(t *testing.T) {
	svc := NewJWTService(testSecret)

	now := time.Now()
	claims := Claims{
		UserID: uuid.New().String(),
		Email:  "user@foreign.com",
		Role:   domain.RoleCustomer,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "user",
			Issuer:    "foreign-issuer-platform",
			Audience:  jwt.ClaimStrings{"access"},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour)),
		},
	}

	tokenStr, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(testSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	_, err = svc.ValidateClaims(tokenStr)
	if err == nil {
		t.Fatal("expected error for wrong issuer, got nil")
	}
	if err.Error() != "invalid token issuer" {
		t.Errorf("expected 'invalid token issuer' error, got %q", err.Error())
	}
}

func TestValidateClaims_RefreshTokenRejected(t *testing.T) {
	svc := NewJWTService(testSecret)

	user := &domain.User{
		ID:    uuid.New(),
		Email: "user@tdt-me.com.vn",
		Role:  domain.RoleCustomer,
	}

	pair, err := svc.GenerateTokenPair(user)
	if err != nil {
		t.Fatalf("failed to generate token pair: %v", err)
	}

	// ValidateClaims expects audience "access", but RefreshToken has audience "refresh"
	_, err = svc.ValidateClaims(pair.RefreshToken)
	if err == nil {
		t.Fatal("expected error when validating refresh token as access token, got nil")
	}
	if err.Error() != "invalid token audience: expected access token" {
		t.Errorf("expected 'invalid token audience: expected access token', got %q", err.Error())
	}
}

func TestValidateClaims_Malformed(t *testing.T) {
	svc := NewJWTService(testSecret)

	testCases := []struct {
		name  string
		token string
	}{
		{"empty string", ""},
		{"random string", "random-garbage-string"},
		{"two dot string", "header.payload.signature"},
		{"partial token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := svc.ValidateClaims(tc.token)
			if err == nil {
				t.Fatalf("expected error for malformed token %q, got nil", tc.token)
			}
		})
	}
}

func TestValidateClaims_UnexpectedSigningMethod(t *testing.T) {
	svc := NewJWTService(testSecret)

	now := time.Now()
	claims := Claims{
		UserID: uuid.New().String(),
		Email:  "user@none.com",
		Role:   domain.RoleCustomer,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "user",
			Issuer:    "tdt-me-platform",
			Audience:  jwt.ClaimStrings{"access"},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour)),
		},
	}

	// Sign with None algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
	tokenStr, err := token.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("failed to sign token with None: %v", err)
	}

	_, err = svc.ValidateClaims(tokenStr)
	if err == nil {
		t.Fatal("expected error for unexpected signing method, got nil")
	}
}
