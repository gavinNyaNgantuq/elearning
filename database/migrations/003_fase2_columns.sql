-- ============================================================
-- Migrasi 003: Tambah kolom soft-delete & audit ke tabel data master
-- FASE 2 — Admin Data Master
-- ============================================================
-- Aman dijalankan berulang kali: pakai "IF NOT EXISTS" via
-- IGNORE pada ALTER. Tidak menghapus data atau tabel existing.
--
-- Jalankan SETELAH schema.sql dan 001/002:
--   mysql -u root -p elearning < database/migrations/003_fase2_columns.sql
-- ============================================================

-- ========================
-- TABEL: students
-- ========================
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP NULL DEFAULT NULL;

-- ========================
-- TABEL: teachers
-- ========================
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP NULL DEFAULT NULL;

-- ========================
-- TABEL: teacher_subjects
-- ========================
ALTER TABLE teacher_subjects
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP NULL DEFAULT NULL;

-- ========================
-- TABEL: classes
-- (+ kolom fungsional: academic_year untuk info TP pada kelas)
-- ========================
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)   NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by    INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by    INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by    INT           NULL DEFAULT NULL;

-- ========================
-- TABEL: majors
-- (+ kolom code untuk kode jurusan, mis. "TKJ", "MP")
-- ========================
ALTER TABLE majors
  ADD COLUMN IF NOT EXISTS code         VARCHAR(20)   NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by   INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by   INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by   INT           NULL DEFAULT NULL;

-- Set kode default untuk data existing (sesuai seed)
UPDATE majors SET code = name WHERE code IS NULL;

-- ========================
-- TABEL: schedules
-- (+ room untuk info ruang kelas)
-- ========================
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS room        VARCHAR(50)   NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by  INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by  INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by  INT           NULL DEFAULT NULL;

-- ========================
-- TABEL: materials
-- (+ class_id, file, link — extend skema lama yang hanya punya file_path)
-- ========================
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS class_id    INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS file        VARCHAR(500)  NULL DEFAULT NULL COMMENT 'path file unggahan (ganti file_path lama)',
  ADD COLUMN IF NOT EXISTS link        VARCHAR(500)  NULL DEFAULT NULL COMMENT 'link video / URL eksternal',
  ADD COLUMN IF NOT EXISTS created_by  INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by  INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by  INT           NULL DEFAULT NULL;

-- ========================
-- TABEL: announcements
-- ========================
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by  INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by  INT           NULL DEFAULT NULL;

-- ========================
-- TABEL: assignments
-- (deadline sebagai alias due_date — kolom baru agar model berjalan
--  tanpa menghapus due_date yang ada)
-- ========================
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS deadline    DATETIME      NULL DEFAULT NULL COMMENT 'alias due_date untuk model baru',
  ADD COLUMN IF NOT EXISTS created_by  INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by  INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by  INT           NULL DEFAULT NULL;

-- Sinkronkan data lama ke kolom baru
UPDATE assignments SET deadline = due_date WHERE deadline IS NULL AND due_date IS NOT NULL;

-- ========================
-- TABEL: attendances
-- (+ class_id, subject_id, note — extend skema)
-- ========================
ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS class_id    INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subject_id  INT           NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS note        TEXT          NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP     NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP     NULL DEFAULT NULL;

-- ========================
-- TABEL: grades
-- (+ type, reference_id, score, teacher_id, class_id — extend skema)
-- ========================
ALTER TABLE grades
  ADD COLUMN IF NOT EXISTS type         VARCHAR(20)  NULL DEFAULT NULL COMMENT 'materi | tugas | ujian',
  ADD COLUMN IF NOT EXISTS reference_id INT          NULL DEFAULT NULL COMMENT 'id sumber (materi/tugas/ujian)',
  ADD COLUMN IF NOT EXISTS score        DECIMAL(5,2) NULL DEFAULT NULL COMMENT 'alias grade untuk model baru',
  ADD COLUMN IF NOT EXISTS teacher_id   INT          NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS class_id     INT          NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by   INT          NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP    NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by   INT          NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMP    NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by   INT          NULL DEFAULT NULL;

-- Sinkronkan data lama ke kolom score baru
UPDATE grades SET score = grade WHERE score IS NULL AND grade IS NOT NULL;

-- ========================
-- TABEL: users
-- (+ phone — dipakai userModel.updatePhone)
-- ========================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL DEFAULT NULL;

-- ========================
-- INDEX untuk kolom yang sering difilter
-- ========================
-- students
CREATE INDEX IF NOT EXISTS idx_students_deleted  ON students  (deleted_at);
CREATE INDEX IF NOT EXISTS idx_students_class    ON students  (class_id);
-- teachers
CREATE INDEX IF NOT EXISTS idx_teachers_deleted  ON teachers  (deleted_at);
-- classes
CREATE INDEX IF NOT EXISTS idx_classes_deleted   ON classes   (deleted_at);
CREATE INDEX IF NOT EXISTS idx_classes_major     ON classes   (major_id);
-- schedules
CREATE INDEX IF NOT EXISTS idx_schedules_deleted ON schedules (deleted_at);
CREATE INDEX IF NOT EXISTS idx_schedules_class   ON schedules (class_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher ON schedules (teacher_id);
-- materials
CREATE INDEX IF NOT EXISTS idx_materials_deleted ON materials (deleted_at);
CREATE INDEX IF NOT EXISTS idx_materials_class   ON materials (class_id);
-- announcements
CREATE INDEX IF NOT EXISTS idx_announcements_del ON announcements (deleted_at);
-- assignments
CREATE INDEX IF NOT EXISTS idx_assignments_del   ON assignments   (deleted_at);
-- grades
CREATE INDEX IF NOT EXISTS idx_grades_deleted    ON grades    (deleted_at);
CREATE INDEX IF NOT EXISTS idx_grades_student    ON grades    (student_id);
