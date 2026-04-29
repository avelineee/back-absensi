import "dotenv/config";
import { pool, query } from "../db.js";
import { hashPassword } from "../lib/auth.js";
import { todayJakarta } from "../lib/attendance-helpers.js";

async function ensureUser(input: {
  fullName: string;
  username: string;
  password: string;
  role: "admin" | "employee";
  position: string;
  department: string;
  email?: string;
  phone?: string;
}): Promise<number> {
  const existing = await query<{ id: number }>(
    "SELECT id FROM employees WHERE username = $1 LIMIT 1",
    [input.username],
  );
  if (existing.rows.length > 0) return existing.rows[0].id;
  const passwordHash = await hashPassword(input.password);
  const { rows } = await query<{ id: number }>(
    `INSERT INTO employees
       (full_name, username, password_hash, role, position, department, email, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.fullName,
      input.username,
      passwordHash,
      input.role,
      input.position,
      input.department,
      input.email ?? null,
      input.phone ?? null,
    ],
  );
  return rows[0].id;
}

async function main() {
  console.log("Mengisi data awal ...");

  await ensureUser({
    fullName: "Andi Pratama",
    username: "admin",
    password: "admin123",
    role: "admin",
    position: "HR Manager",
    department: "Sumber Daya Manusia",
    email: "andi.pratama@aqua.co.id",
    phone: "+62 812-1111-1111",
  });

  const employees = await Promise.all([
    ensureUser({ fullName: "Budi Santoso", username: "budi", password: "budi123", role: "employee", position: "Operator Produksi", department: "Produksi", email: "budi.santoso@aqua.co.id", phone: "+62 813-2222-2222" }),
    ensureUser({ fullName: "Sari Wulandari", username: "sari", password: "sari123", role: "employee", position: "Quality Control", department: "QA & Quality", email: "sari.wulandari@aqua.co.id", phone: "+62 813-3333-3333" }),
    ensureUser({ fullName: "Rizky Hidayat", username: "rizky", password: "rizky123", role: "employee", position: "Teknisi Mesin", department: "Maintenance", email: "rizky.hidayat@aqua.co.id", phone: "+62 813-4444-4444" }),
    ensureUser({ fullName: "Dewi Anggraini", username: "dewi", password: "dewi123", role: "employee", position: "Supervisor Logistik", department: "Logistik", email: "dewi.anggraini@aqua.co.id", phone: "+62 813-5555-5555" }),
    ensureUser({ fullName: "Agus Setiawan", username: "agus", password: "agus123", role: "employee", position: "Operator Filling", department: "Produksi", email: "agus.setiawan@aqua.co.id", phone: "+62 813-6666-6666" }),
  ]);

  const today = todayJakarta();
  const placeholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZitFTYAAAAASUVORK5CYII=";

  const checkInBase = new Date();
  checkInBase.setUTCHours(1, 5, 0, 0); // ~08:05 WIB
  const lateBase = new Date();
  lateBase.setUTCHours(1, 45, 0, 0); // ~08:45 WIB

  const samples = [
    { id: employees[0], time: checkInBase, status: "hadir" },
    { id: employees[1], time: lateBase, status: "terlambat" },
    { id: employees[3], time: checkInBase, status: "hadir" },
  ];

  for (const s of samples) {
    const exists = await query(
      "SELECT id FROM attendance WHERE employee_id = $1 AND date = $2",
      [s.id, today],
    );
    if (exists.rowCount && exists.rowCount > 0) continue;
    await query(
      `INSERT INTO attendance (employee_id, date, check_in_at, check_in_photo, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [s.id, today, s.time, placeholder, s.status],
    );
  }

  console.log("Selesai. Akun admin: admin / admin123");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
