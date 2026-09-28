package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	chi_middleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/handler"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/repository"
)

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgrespassword@localhost:5432/vlxd_db?sslmode=disable&search_path=me_supplies"
	}

	db, err := sqlx.Connect("postgres", dbURL)
	if err != nil {
		fmt.Printf("failed to connect database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	db.SetConnMaxLifetime(time.Hour)
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "tdt-me-platform-jwt-secret-key-change-in-prod"
	}

	productRepo := repository.NewProductRepository(db)
	userRepo := repository.NewUserRepository(db)
	jwtService := auth.NewJWTService(jwtSecret)
	
	// Create middlewares
	authMiddleware := middleware.NewAuthMiddleware(jwtService)

	productHandler := handler.New(productRepo)
	ssoHandler := handler.NewSSOHandler(userRepo, jwtService)
	authHandler := handler.NewAuthHandler(userRepo, jwtService)

	r := chi.NewRouter()
	r.Use(chi_middleware.Logger)
	r.Use(chi_middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{os.Getenv("FRONTEND_URL"), "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.Get("/health", healthHandler(db))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthHandler(db))

		r.Route("/auth", func(r chi.Router) {
			// Local Auth
			r.Post("/register", authHandler.HandleRegister)
			r.Post("/login", authHandler.HandleLogin)
			
			// SSO Google
			r.Route("/google", func(r chi.Router) {
				r.Get("/login", ssoHandler.HandleGoogleLogin)
				r.Get("/callback", ssoHandler.HandleGoogleCallback)
			})
		})

		r.Get("/products", productHandler.ListProducts)
		r.Get("/products/sku/{sku}", productHandler.GetProductBySKU)
		r.Get("/products/{id}", productHandler.GetProduct)
		r.Get("/units", productHandler.ListUnits)
		r.Get("/brands", productHandler.ListBrands)
		r.Get("/categories", productHandler.ListCategories)
		
		// Protected endpoints example:
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin, domain.RoleManager))
			r.Get("/orders", productHandler.ListOrders)
			r.Post("/orders", productHandler.CreateOrder)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server starting on :%s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		fmt.Printf("server error: %v\n", err)
		os.Exit(1)
	}
}

func healthHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "CONNECTED"
		if err := db.PingContext(r.Context()); err != nil {
			dbStatus = "DISCONNECTED"
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":    "UP",
			"database":  dbStatus,
			"timestamp": time.Now().UTC(),
		})
	}
}

