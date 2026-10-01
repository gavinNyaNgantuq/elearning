-- ============================================================
-- Migrasi 001: Tabel password_resets (alur lupa password / OTP)
-- ============================================================
-- Jalankan:
--   mysql -u <DB_USER> -p <DB_NAME> < database/migrations/001_password_resets.sql
--
-- CATATAN:
--   * File ini ADDITIVE. database/schema.sql TIDAK diubah/ditimpa.
--   * user_id NULL pada awalnya dimungkinkan agar cooldown kirim ulang
--     berlaku seragam untuk SEMUA email (anti enumeration), termasuk
--     email yang tidak terdaftar.
--   * otp_hash menyimpan hash bcrypt dari kode OTP (bukan kode plaintext).
--   * status: pending -> verified -> used (sekali pakai).
-- ============================================================

CREATE TABLE IF NOT EXISTS password_resets (
  id           INT NOT NULL AUTO_INCREMENT,
  user_id      INT DEFAULT NULL,
  email        VARCHAR(100) NOT NULL,
  otp_hash     VARCHAR(255) NOT NULL,
  attempts     INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  status       ENUM('pending','verified','used') NOT NULL DEFAULT 'pending',
  expires_at   DATETIME NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NULL DEFAULT NULL,
  updated_by   INT DEFAULT NULL,
  deleted_at   TIMESTAMP NULL DEFAULT NULL,
  deleted_by   INT DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_password_resets_email (email),
  KEY idx_password_resets_user (user_id),
  KEY idx_password_resets_status (status),
  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
