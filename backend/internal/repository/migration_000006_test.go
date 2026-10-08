package repository

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestMigration000006_UpDownUp(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		t.Skip("database not available")
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	upSQLPath := filepath.Join("..", "..", "migrations", "000006_order_metadata_persistence.up.sql")
	downSQLPath := filepath.Join("..", "..", "migrations", "000006_order_metadata_persistence.down.sql")

	upSQLBytes, err := os.ReadFile(upSQLPath)
	if err != nil {
		t.Fatalf("failed to read up sql: %v", err)
	}
	downSQLBytes, err := os.ReadFile(downSQLPath)
	if err != nil {
		t.Fatalf("failed to read down sql: %v", err)
	}

	upSQL := string(upSQLBytes)
	downSQL := string(downSQLBytes)

	// Step 1: Run UP
	t.Log("Testing Migration 000006 UP (1)...")
	if _, err := db.ExecContext(ctx, upSQL); err != nil {
		t.Fatalf("Migration 000006 UP (1) failed: %v", err)
	}

	// Step 2: Run DOWN
	t.Log("Testing Migration 000006 DOWN...")
	if _, err := db.ExecContext(ctx, downSQL); err != nil {
		t.Fatalf("Migration 000006 DOWN failed: %v", err)
	}

	// Step 3: Run UP again
	t.Log("Testing Migration 000006 UP (2)...")
	if _, err := db.ExecContext(ctx, upSQL); err != nil {
		t.Fatalf("Migration 000006 UP (2) failed: %v", err)
	}

	t.Log("Migration 000006 UP -> DOWN -> UP executed successfully without errors!")
}
