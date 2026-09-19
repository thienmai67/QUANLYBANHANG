package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	_ "github.com/lib/pq"
	"github.com/jmoiron/sqlx"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/handler"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/repository"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/me_supplies?sslmode=disable"
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

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:8080"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	productRepo := repository.NewProductRepository(db)
	h := handler.New(productRepo)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/products", h.ListProducts)
		r.Get("/products/{id}", h.GetProduct)
		r.Get("/products/sku/{sku}", h.GetProductBySKU)
		r.Get("/units", h.ListUnits)
		r.Get("/brands", h.ListBrands)
		r.Get("/categories", h.ListCategories)
		r.Get("/orders", h.ListOrders)
		r.Post("/orders", h.CreateOrder)
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

