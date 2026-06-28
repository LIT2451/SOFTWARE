package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("DB_HOST", "127.0.0.1"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "software_user"),
		getEnv("DB_PASSWORD", "litsoftware2026"),
		getEnv("DB_NAME", "software"),
	)

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Loi ket noi database: %v", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatalf("Loi ping database: %v", err)
	}

	log.Println("Ket noi database thanh cong")
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
