import { Router } from "express";
import { query } from "../db.js";
import {
  Employee,
  hashPassword,
  publicEmployee,
  requireAdmin,
  requireAuth,
} from "../lib/auth.js";
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
} from "../lib/schemas.js";

const router = Router();

router.get("/employees", requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await query<Employee>(
    "SELECT * FROM employees ORDER BY full_name ASC",
  );
  res.json(rows.map(publicEmployee));
});

router.post("/employees", requireAuth, requireAdmin, async (req, res) => {
  const parsed = CreateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const exists = await query(
    "SELECT id FROM employees WHERE username = $1 LIMIT 1",
    [data.username],
  );
  if (exists.rowCount && exists.rowCount > 0) {
    res.status(400).json({ error: "Username sudah digunakan" });
    return;
  }
  const passwordHash = await hashPassword(data.password);
  const { rows } = await query<Employee>(
    `INSERT INTO employees
       (full_name, username, password_hash, role, position, department, email, phone, photo_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.fullName,
      data.username,
      passwordHash,
      data.role ?? "employee",
      data.position,
      data.department,
      data.email ?? null,
      data.phone ?? null,
      data.photoUrl ?? null,
    ],
  );
  res.status(201).json(publicEmployee(rows[0]));
});

router.get("/employees/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "ID tidak valid" });
    return;
  }
  const { rows } = await query<Employee>(
    "SELECT * FROM employees WHERE id = $1 LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Pegawai tidak ditemukan" });
    return;
  }
  res.json(publicEmployee(rows[0]));
});

router.patch("/employees/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "ID tidak valid" });
    return;
  }
  const parsed = UpdateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;

  const sets: string[] = [];
  const values: unknown[] = [];
  const map: Record<string, unknown> = {
    full_name: data.fullName,
    username: data.username,
    role: data.role,
    position: data.position,
    department: data.department,
    email: data.email,
    phone: data.phone,
    photo_url: data.photoUrl,
  };
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    }
  }
  if (data.password !== undefined && data.password.length > 0) {
    values.push(await hashPassword(data.password));
    sets.push(`password_hash = $${values.length}`);
  }
  if (sets.length === 0) {
    res.status(400).json({ error: "Tidak ada perubahan" });
    return;
  }
  values.push(id);
  const { rows } = await query<Employee>(
    `UPDATE employees SET ${sets.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length} RETURNING *`,
    values,
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Pegawai tidak ditemukan" });
    return;
  }
  res.json(publicEmployee(rows[0]));
});

router.delete("/employees/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "ID tidak valid" });
    return;
  }
  const result = await query("DELETE FROM employees WHERE id = $1", [id]);
  if (!result.rowCount) {
    res.status(404).json({ error: "Pegawai tidak ditemukan" });
    return;
  }
  res.status(204).send();
});

export default router;
