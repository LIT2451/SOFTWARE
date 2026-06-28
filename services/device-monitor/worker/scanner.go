package worker

import (
	"log"
	"time"

	"github.com/LIT2451/SOFTWARE/services/device-monitor/db"
)

// StartOfflineScanner quet database dinh ky moi 10 giay de phat hien va cap nhat thiet bi offline
func StartOfflineScanner() {
	ticker := time.NewTicker(10 * time.Second)
	go func() {
		for range ticker.C {
			scanAndSetOffline()
		}
	}()
}

func scanAndSetOffline() {
	// Tim cac thiet bi dang o trang thai 'online' nhung khong co cap nhat (updated_at) trong vong 15 giay qua
	query := `
		UPDATE devices 
		SET status = 'offline', updated_at = CURRENT_TIMESTAMP 
		WHERE status = 'online' AND updated_at < $1
	`
	// Thoi diem cat toc de tinh offline (hien tai tru di 15 giay)
	threshold := time.Now().Add(-15 * time.Second)

	result, err := db.DB.Exec(query, threshold)
	if err != nil {
		log.Printf("Loi quet trang thai offline thiet bi: %v", err)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err == nil && rowsAffected > 0 {
		log.Printf("Phat hien va cap nhat %d thiet bi sang trang thai offline", rowsAffected)
	}
}
