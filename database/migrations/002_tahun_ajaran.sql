-- Migration 002: tabel tahun_ajaran
-- Aman dijalankan berulang kali (IF NOT EXISTS), tidak menghapus data existing.

CREATE TABLE IF NOT EXISTS tahun_ajaran (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(20) NOT NULL,
  semester ENUM('ganjil', 'genap') NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_at TIMESTAMP NULL,
  updated_by INT NULL,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  INDEX idx_tahun_ajaran_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
