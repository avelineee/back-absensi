# Backend - Sistem Presensi Pegawai Aqua Danone

Server REST API berbasis **Node.js + Express + PostgreSQL**.

## Persiapan

1. Pastikan **Node.js 20+** dan **PostgreSQL 14+** sudah terpasang.
2. Salin `.env.example` menjadi `.env` lalu sesuaikan `DATABASE_URL`, `PORT`, `FRONTEND_ORIGIN`, dan `SESSION_SECRET`.
3. Buat database kosong di PostgreSQL, contoh:
   ```sql
   CREATE DATABASE presensi_aqua;
   ```
4. Pasang dependensi:
   ```bash
   npm install
   ```
5. Buat tabel + isi data awal dari file `database.sql` di root project:
   ```bash
   psql "$DATABASE_URL" -f ../database.sql
   ```
   _atau_ jalankan:
   ```bash
   npm run init-db
   ```
6. (Opsional) Tambah data demo lewat skrip TypeScript:
   ```bash
   npm run seed
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
