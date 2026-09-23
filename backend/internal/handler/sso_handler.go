package handler

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

const oauthStateCookie = "oauth_state"

type SSOHandler struct {
	cfg         *oauth2.Config
	jwtService  *auth.JWTService
	userRepo    domain.UserRepository
	frontendURL string
}

func NewSSOHandler(userRepo domain.UserRepository, jwtService *auth.JWTService) *SSOHandler {
	return &SSOHandler{
		cfg: &oauth2.Config{
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URI"),
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		},
		jwtService:  jwtService,
		userRepo:    userRepo,
		frontendURL: envOrDefault("FRONTEND_URL", "http://localhost:3000"),
	}
}

// HandleGoogleLogin tạo state CSRF, lưu cookie và redirect sang Google Consent Screen.
func (h *SSOHandler) HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	state, err := randomState()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     oauthStateCookie,
		Value:    state,
		Path:     "/",
		MaxAge:   600,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	http.Redirect(w, r, h.cfg.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

// HandleGoogleCallback xác minh state, đổi code lấy token, upsert user, trả JWT.
func (h *SSOHandler) HandleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	stateCookie, err := r.Cookie(oauthStateCookie)
	if err != nil || stateCookie.Value != r.URL.Query().Get("state") {
		h.errRedirect(w, r, "invalid_state")
		return
	}
	http.SetCookie(w, &http.Cookie{Name: oauthStateCookie, MaxAge: -1, Path: "/"})

	code := r.URL.Query().Get("code")
	if code == "" {
		h.errRedirect(w, r, "access_denied")
		return
	}

	oauthToken, err := h.cfg.Exchange(r.Context(), code)
	if err != nil {
		h.errRedirect(w, r, "token_exchange_failed")
		return
	}

	googleUser, err := fetchGoogleUserInfo(r.Context(), h.cfg, oauthToken)
	if err != nil {
		h.errRedirect(w, r, "userinfo_failed")
		return
	}
	if !googleUser.EmailVerified {
		h.errRedirect(w, r, "email_not_verified")
		return
	}

	user, err := h.userRepo.UpsertGoogleUser(r.Context(), googleUser)
	if err != nil {
		h.errRedirect(w, r, "db_error")
		return
	}

	tokenPair, err := h.jwtService.GenerateTokenPair(user)
	if err != nil {
		h.errRedirect(w, r, "token_generation_failed")
		return
	}

	redirectURL := fmt.Sprintf(
		"%s/auth/callback?token=%s&refresh=%s",
		h.frontendURL, tokenPair.AccessToken, tokenPair.RefreshToken,
	)
	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

func fetchGoogleUserInfo(ctx context.Context, cfg *oauth2.Config, token *oauth2.Token) (*domain.GoogleUserInfo, error) {
	client := cfg.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var info domain.GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	return &info, nil
}

func randomState() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (h *SSOHandler) errRedirect(w http.ResponseWriter, r *http.Request, reason string) {
	http.Redirect(w, r, h.frontendURL+"/auth/error?reason="+reason, http.StatusTemporaryRedirect)
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
