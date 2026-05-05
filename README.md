# Backend - Sistem Presensi Pegawai Aqua Danone

Server REST API berbasis **Node.js + Express + MySQL**.

## Persiapan

1. Pastikan **Node.js 20+** dan **MySQL 8.x** (atau MariaDB 10.6+) sudah terpasang.
2. Salin `.env.example` menjadi `.env` lalu sesuaikan `DATABASE_URL`, `PORT`, `FRONTEND_ORIGIN`, dan `SESSION_SECRET`.
   Format: `mysql://USER:PASSWORD@HOST:PORT/presensi_aqua`
3. Buat database + tabel + data awal dari file `database.sql` di root project. File ini sudah memuat `CREATE DATABASE`, jadi tidak perlu membuat database manual:
   ```bash
   mysql -u root -p < ../database.sql
   ```
   _atau_ jalankan via npm (memakai `DATABASE_URL` di `.env`):
   ```bash
   npm install
   npm run init-db
   ```
4. (Opsional) Tambah / refresh data demo via skrip TypeScript:
   ```bash
   npm run seed
   ```

## Folder upload

Foto selfie pegawai disimpan sebagai file di `backend/uploads/attendance/`. Folder ini dibuat otomatis saat server pertama kali dijalankan. Pastikan user sistem yang menjalankan Node.js punya hak tulis ke folder ini.

## Menjalankan

- Mode pengembangan (auto-reload, langsung dari TypeScript):
  ```bash
  npm run dev
  ```
- Mode produksi (compile dulu lalu jalankan hasil compile):
  ```bash
  npm install
  npm run build       # output: dist/index.js
  npm start           # menjalankan node dist/index.js
  ```
- Mode produksi via PM2:
  ```bash
  npm install
  npm run build
  pm2 start dist/index.js --name presensi-backend
  ```

Server akan berjalan di `http://localhost:3001` (sesuai `PORT`). File foto bisa diakses lewat `http://localhost:3001/uploads/attendance/<filename>`.

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
| POST | `/api/attendance/check-in` | Absen masuk + foto selfie (file disimpan otomatis) |
| POST | `/api/attendance/check-out` | Absen pulang + foto selfie (file disimpan otomatis) |
| GET | `/api/dashboard/summary` | Ringkasan statistik (admin) |
| GET | `/api/dashboard/recent` | Aktivitas presensi terbaru (admin) |
| GET | `/uploads/attendance/<file>` | File foto selfie (static) |

## Akun demo (setelah `mysql < database.sql` atau `npm run init-db`)

| Username | Password | Role |
| --- | --- | --- |
| admin | admin123 | admin |
| budi | budi123 | employee |
| sari | sari123 | employee |
| rizky | rizky123 | employee |
| dewi | dewi123 | employee |
| agus | agus123 | employee |
