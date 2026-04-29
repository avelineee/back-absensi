<<<<<<< HEAD
# Backend - Sistem Presensi Pegawai Aqua Danone

Server REST API berbasis **Node.js + Express + PostgreSQL**.

## Persiapan

1. Pastikan **Node.js 20+** dan **mysql** sudah terpasang.
2. Salin `.env.example` menjadi `.env` lalu sesuaikan `DATABASE_URL`, `PORT`, `FRONTEND_ORIGIN`, dan `SESSION_SECRET`.
3. Buat database kosong di mysql, contoh:
   ```sql
   -- =============================================================================
-- Sistem Presensi Pegawai Aqua Danone (MariaDB Version)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CREATE DATABASE
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS presensi_aqua;
USE presensi_aqua;

-- -----------------------------------------------------------------------------
-- DROP TABLE (aman untuk re-run)
-- -----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS employees;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- TABEL: employees
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name TEXT NOT NULL,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role ENUM('admin','employee') DEFAULT 'employee',
    position TEXT,
    department TEXT,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX employees_role_idx ON employees(role);

-- -----------------------------------------------------------------------------
-- TABEL: sessions
-- -----------------------------------------------------------------------------
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

-- -----------------------------------------------------------------------------
-- TABEL: attendance
-- -----------------------------------------------------------------------------
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_at DATETIME,
    check_out_at DATETIME,
    check_in_photo TEXT,
    check_out_photo TEXT,
    status ENUM('hadir','terlambat','izin') DEFAULT 'hadir',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY attendance_employee_date_idx (employee_id, date)
);

CREATE INDEX attendance_date_idx ON attendance(date);

-- =============================================================================
-- SEED DATA (PASSWORD SUDAH HASH BCRYPT)
-- =============================================================================

INSERT INTO employees
(full_name, username, password_hash, role, position, department, email, phone)
VALUES
('Andi Pratama', 'admin', '$2b$10$txjr58ni3oUmDKOktXgbAO7vpv7xYbVh91LJfvnXYaf.zWJOaWScO', 'admin', 'HR Manager', 'Sumber Daya Manusia', 'andi.pratama@aqua.co.id', '+62 812-1111-1111'),
('Budi Santoso', 'budi', '$2b$10$E9ufOKPrV6zyH2GbZX.SIuSzD8Ud7Xo9VOtJp0cCzZkjqhO390O4u', 'employee', 'Operator Produksi', 'Produksi', 'budi.santoso@aqua.co.id', '+62 813-2222-2222'),
('Sari Wulandari', 'sari', '$2b$10$P6y4HKxylz9dmaAWk7Mq9.6eW9OrH3g2NN9dyaFVwzvofzeAgeQLS', 'employee', 'Quality Control', 'QA & Quality', 'sari.wulandari@aqua.co.id', '+62 813-3333-3333'),
('Rizky Hidayat', 'rizky', '$2b$10$1k3.pWjO4Yi1WS678HxVqu8WFtDUdKINbBv5eEeqZhP224M0G1/9m', 'employee', 'Teknisi Mesin', 'Maintenance', 'rizky.hidayat@aqua.co.id', '+62 813-4444-4444'),
('Dewi Anggraini', 'dewi', '$2b$10$6zgwaHE8e3CxQnPnHfj2j./87vsvGYiEfh7wYHYabYGRWyDe.jWa2', 'employee', 'Supervisor Logistik', 'Logistik', 'dewi.anggraini@aqua.co.id', '+62 813-5555-5555'),
('Agus Setiawan', 'agus', '$2b$10$nUiYH0iZFEyt76n3LtakS.abzFd9MLyQSlvTf507Mv8Oxnrv8WUGS', 'employee', 'Operator Filling', 'Produksi', 'agus.setiawan@aqua.co.id', '+62 813-6666-6666');

-- -----------------------------------------------------------------------------
-- SEED ATTENDANCE HARI INI
-- -----------------------------------------------------------------------------
INSERT INTO attendance
(employee_id, date, check_in_at, check_in_photo, status)
VALUES
(
    (SELECT id FROM employees WHERE username = 'budi'),
    CURDATE(),
    CONCAT(CURDATE(), ' 08:05:00'),
    'placeholder.png',
    'hadir'
),
(
    (SELECT id FROM employees WHERE username = 'sari'),
    CURDATE(),
    CONCAT(CURDATE(), ' 08:45:00'),
    'placeholder.png',
    'terlambat'
),
(
    (SELECT id FROM employees WHERE username = 'dewi'),
    CURDATE(),
    CONCAT(CURDATE(), ' 08:10:00'),
    'placeholder.png',
    'hadir'
);
   ```
4. Pasang dependensi:
   ```bash
   npm install
   ```

## Menjalankan

- Mode pengembangan (auto-reload):
  ```bash
  npm run dev
  ```
- Mode produksi:
  ```bash
  npm start
  ```

Server akan berjalan di `http://localhost:3001` (sesuai `PORT`).

## Endpoint utama

| Metode | Path | Keterangan |
| --- | --- | --- |
| POST | `/api/auth/login` | Login (`username`, `password`) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Info user yang sedang login |
| GET | `/api/employees` | Daftar pegawai (admin) |
| POST | `/api/employees` | Tambah pegawai (admin) |
| GET | `/api/employees/:id` | Detail pegawai (admin) |
| PATCH | `/api/employees/:id` | Update pegawai (admin) |
| DELETE | `/api/employees/:id` | Hapus pegawai (admin) |
| GET | `/api/attendance` | Riwayat presensi (filter `date`, `employeeId`) |
| GET | `/api/attendance/today` | Presensi hari ini (user login) |
| POST | `/api/attendance/check-in` | Absen masuk + foto selfie |
| POST | `/api/attendance/check-out` | Absen pulang + foto selfie |
| GET | `/api/dashboard/summary` | Ringkasan statistik (admin) |
| GET | `/api/dashboard/recent` | Aktivitas presensi terbaru (admin) |

## Akun demo (setelah `npm run seed`)

| Username | Password | Role |
| --- | --- | --- |
| admin | admin123 | admin |
| budi | budi123 | employee |
| sari | sari123 | employee |
| rizky | rizky123 | employee |
| dewi | dewi123 | employee |
| agus | agus123 | employee |
=======
