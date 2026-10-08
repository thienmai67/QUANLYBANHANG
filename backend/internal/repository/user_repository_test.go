package repository

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

func getTestDB(t *testing.T) *sqlx.DB {
	t.Helper()
	_ = godotenv.Load("../../.env", "../.env", ".env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/me_supplies?sslmode=disable&search_path=me_supplies"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	db, err := sqlx.ConnectContext(ctx, "postgres", dbURL)
	if err != nil {
		t.Skipf("PostgreSQL database is not reachable (%v); skipping repository live test", err)
		return nil
	}

	// Verify schema is accessible
	var dummy int
	if err := db.GetContext(ctx, &dummy, "SELECT 1"); err != nil {
		t.Skipf("PostgreSQL ping failed (%v); skipping repository live test", err)
		return nil
	}

	return db
}

func TestUserRepository_CreateUser_And_FindByEmail(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	repo := NewUserRepository(db)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	testEmail := "repo_test_" + uuid.New().String()[:8] + "@tdt-me.com.vn"
	passHash := "$2a$10$abcdefghijklmnopqrstuvwxyz123456"
	user := &domain.User{
		ID:           uuid.New(),
		Email:        testEmail,
		FullName:     "Repo Unit Tester",
		PasswordHash: &passHash,
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}

	// 1. Create user
	if err := repo.CreateUser(ctx, user); err != nil {
		t.Fatalf("failed to create user in db: %v", err)
	}

	// Register cleanup
	t.Cleanup(func() {
		_, _ = db.Exec("DELETE FROM me_supplies.users WHERE id = $1", user.ID)
	})

	// 2. Find by email
	found, err := repo.FindByEmail(ctx, testEmail)
	if err != nil {
		t.Fatalf("failed to find user by email: %v", err)
	}

	if found.ID != user.ID {
		t.Errorf("expected user ID %s, got %s", user.ID, found.ID)
	}
	if found.Email != testEmail {
		t.Errorf("expected email %q, got %q", testEmail, found.Email)
	}
	if found.FullName != user.FullName {
		t.Errorf("expected fullName %q, got %q", user.FullName, found.FullName)
	}
	if found.Role != domain.RoleCustomer {
		t.Errorf("expected role CUSTOMER, got %q", found.Role)
	}
	if found.PasswordHash == nil || *found.PasswordHash != passHash {
		t.Errorf("password hash mismatch")
	}
}

func TestUserRepository_FindByEmail_NotFound(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	repo := NewUserRepository(db)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	nonExistentEmail := "totally_unknown_" + uuid.New().String() + "@tdt.vn"
	_, err := repo.FindByEmail(ctx, nonExistentEmail)
	if err == nil {
		t.Fatal("expected error for non-existent user, got nil")
	}
	if err != domain.ErrUserNotFound {
		t.Errorf("expected domain.ErrUserNotFound, got %v", err)
	}
}

func TestUserRepository_UpsertGoogleUser(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	repo := NewUserRepository(db)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	email := "google_upsert_" + uuid.New().String()[:8] + "@gmail.com"
	uniqueSub := "google-sub-" + uuid.New().String()[:12]
	info := &domain.GoogleUserInfo{
		Sub:           uniqueSub,
		Email:         email,
		EmailVerified: true,
		Name:          "Google Tester",
		Picture:       "https://avatar.google.com/pic.png",
	}

	// 1. First insert
	user, err := repo.UpsertGoogleUser(ctx, info)
	if err != nil {
		t.Fatalf("failed to upsert google user: %v", err)
	}

	t.Cleanup(func() {
		_, _ = db.Exec("DELETE FROM me_supplies.users WHERE google_id = $1 OR id = $2", uniqueSub, user.ID)
	})

	if user.Email != email {
		t.Errorf("expected email %q, got %q", email, user.Email)
	}
	if user.GoogleID == nil || *user.GoogleID != info.Sub {
		t.Errorf("expected google_id %q, got %v", info.Sub, user.GoogleID)
	}
	if user.Role != domain.RoleCustomer {
		t.Errorf("expected default role CUSTOMER, got %q", user.Role)
	}

	// 2. Update same user (conflict on email)
	updatedInfo := &domain.GoogleUserInfo{
		Sub:           uniqueSub,
		Email:         email,
		EmailVerified: true,
		Name:          "Google Tester Renamed",
		Picture:       "https://avatar.google.com/pic2.png",
	}

	updatedUser, err := repo.UpsertGoogleUser(ctx, updatedInfo)
	if err != nil {
		t.Fatalf("failed to update google user on conflict: %v", err)
	}

	if updatedUser.ID != user.ID {
		t.Errorf("expected ID to remain %s, got %s", user.ID, updatedUser.ID)
	}
	if updatedUser.AvatarURL == nil || *updatedUser.AvatarURL != updatedInfo.Picture {
		t.Errorf("expected updated avatar, got %v", updatedUser.AvatarURL)
	}
}
