package handler

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
)

func TestHandleGoogleLogin_MissingClientID(t *testing.T) {
	// Temporarily clear GOOGLE_CLIENT_ID
	originalClientID := os.Getenv("GOOGLE_CLIENT_ID")
	os.Setenv("GOOGLE_CLIENT_ID", "")
	defer os.Setenv("GOOGLE_CLIENT_ID", originalClientID)

	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewSSOHandler(repo, jwtSvc)
	h.cfg.ClientID = "" // Ensure ClientID is empty

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/google/login", nil)
	rr := httptest.NewRecorder()

	h.HandleGoogleLogin(rr, req)

	if rr.Code != http.StatusTemporaryRedirect {
		t.Fatalf("expected 307 Temporary Redirect, got %d", rr.Code)
	}

	location := rr.Header().Get("Location")
	expectedSuffix := "/auth/error?reason=missing_google_client_id"
	if !strings.HasSuffix(location, expectedSuffix) {
		t.Errorf("expected redirect to %s, got %s", expectedSuffix, location)
	}
}

func TestHandleGoogleLogin_Success(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewSSOHandler(repo, jwtSvc)
	h.cfg.ClientID = "test-client-id-12345.apps.googleusercontent.com"
	h.cfg.RedirectURL = "http://localhost:8080/api/v1/auth/google/callback"

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/google/login", nil)
	rr := httptest.NewRecorder()

	h.HandleGoogleLogin(rr, req)

	if rr.Code != http.StatusTemporaryRedirect {
		t.Fatalf("expected 307 Temporary Redirect, got %d", rr.Code)
	}

	location := rr.Header().Get("Location")
	if !strings.HasPrefix(location, "https://accounts.google.com/o/oauth2/auth") {
		t.Errorf("expected Google OAuth URL, got %s", location)
	}
	if !strings.Contains(location, "client_id=test-client-id-12345.apps.googleusercontent.com") {
		t.Errorf("expected URL to include client_id, got %s", location)
	}

	// Verify oauth_state cookie is set
	cookies := rr.Result().Cookies()
	var stateCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == oauthStateCookie {
			stateCookie = c
			break
		}
	}
	if stateCookie == nil {
		t.Fatal("expected oauth_state cookie to be set")
	}
	if stateCookie.Value == "" {
		t.Error("expected non-empty state cookie value")
	}
	if !stateCookie.HttpOnly {
		t.Error("expected HttpOnly flag on oauth_state cookie")
	}
}

func TestHandleGoogleCallback_MissingStateCookie(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewSSOHandler(repo, jwtSvc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/google/callback?state=xyz&code=abc", nil)
	rr := httptest.NewRecorder()

	h.HandleGoogleCallback(rr, req)

	if rr.Code != http.StatusTemporaryRedirect {
		t.Fatalf("expected 307 Temporary Redirect, got %d", rr.Code)
	}

	location := rr.Header().Get("Location")
	if !strings.HasSuffix(location, "/auth/error?reason=invalid_state") {
		t.Errorf("expected invalid_state redirect, got %s", location)
	}
}

func TestHandleGoogleCallback_StateMismatch(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewSSOHandler(repo, jwtSvc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/google/callback?state=param-state-value&code=abc", nil)
	req.AddCookie(&http.Cookie{
		Name:  oauthStateCookie,
		Value: "different-cookie-state-value",
	})
	rr := httptest.NewRecorder()

	h.HandleGoogleCallback(rr, req)

	if rr.Code != http.StatusTemporaryRedirect {
		t.Fatalf("expected 307 Temporary Redirect, got %d", rr.Code)
	}

	location := rr.Header().Get("Location")
	if !strings.HasSuffix(location, "/auth/error?reason=invalid_state") {
		t.Errorf("expected invalid_state redirect, got %s", location)
	}
}

func TestHandleGoogleCallback_MissingCode(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewSSOHandler(repo, jwtSvc)

	stateVal := "valid-matching-state-1234"
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/google/callback?state="+stateVal, nil) // no code param
	req.AddCookie(&http.Cookie{
		Name:  oauthStateCookie,
		Value: stateVal,
	})
	rr := httptest.NewRecorder()

	h.HandleGoogleCallback(rr, req)

	if rr.Code != http.StatusTemporaryRedirect {
		t.Fatalf("expected 307 Temporary Redirect, got %d", rr.Code)
	}

	location := rr.Header().Get("Location")
	if !strings.HasSuffix(location, "/auth/error?reason=access_denied") {
		t.Errorf("expected access_denied redirect, got %s", location)
	}
}

func TestHandleGoogleCallback_TokenExchangeFailed(t *testing.T) {
	repo := newMockUserRepo()
	jwtSvc := auth.NewJWTService("secret")
	h := NewSSOHandler(repo, jwtSvc)
	h.cfg.ClientID = "test-client-id"
	h.cfg.ClientSecret = "test-client-secret"

	stateVal := "matching-state-token-fail"
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/google/callback?state="+stateVal+"&code=invalid-code", nil)
	req.AddCookie(&http.Cookie{
		Name:  oauthStateCookie,
		Value: stateVal,
	})
	rr := httptest.NewRecorder()

	h.HandleGoogleCallback(rr, req)

	if rr.Code != http.StatusTemporaryRedirect {
		t.Fatalf("expected 307 Temporary Redirect, got %d", rr.Code)
	}

	location := rr.Header().Get("Location")
	if !strings.HasSuffix(location, "/auth/error?reason=token_exchange_failed") {
		t.Errorf("expected token_exchange_failed redirect, got %s", location)
	}
}
