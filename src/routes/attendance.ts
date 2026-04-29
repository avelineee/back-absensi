import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../lib/auth.js";
import {
  approxBytes,
  AttendanceRow,
  EmployeeBrief,
  shapeAttendance,
  statusFromCheckIn,
  todayJakarta,
} from "../lib/attendance-helpers.js";
import {
  CheckInSchema,
  CheckOutSchema,
  ListAttendanceQuerySchema,
} from "../lib/schemas.js";

const router = Router();

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

interface JoinedRow extends AttendanceRow {
  full_name: string;
  position: string;
  department: string;
}

function splitJoined(r: JoinedRow): { row: AttendanceRow; emp: EmployeeBrief } {
  const { full_name, position, department, ...rest } = r;
  return {
    row: rest as AttendanceRow,
    emp: { full_name, position, department },
  };
}

router.get("/attendance", requireAuth, async (req, res) => {
  const parsed = ListAttendanceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (parsed.data.date) {
    values.push(parsed.data.date);
    conditions.push(`a.date = $${values.length}`);
  }
  if (parsed.data.employeeId) {
    values.push(parsed.data.employeeId);
    conditions.push(`a.employee_id = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query<JoinedRow>(
    `SELECT a.*, e.full_name, e.position, e.department
     FROM attendance a
     INNER JOIN employees e ON e.id = a.employee_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT 500`,
    values,
  );
  res.json(rows.map((r) => {
    const { row, emp } = splitJoined(r);
    return shapeAttendance(row, emp);
  }));
});

router.get("/attendance/today", requireAuth, async (req, res) => {
  const user = req.user!;
  const today = todayJakarta();
  const { rows } = await query<AttendanceRow>(
    `SELECT * FROM attendance
     WHERE employee_id = $1 AND date = $2
     LIMIT 1`,
    [user.id, today],
  );
  if (rows.length === 0) {
    res.json({ hasRecord: false, record: null });
    return;
  }
  res.json({
    hasRecord: true,
    record: shapeAttendance(rows[0], {
      full_name: user.full_name,
      position: user.position,
      department: user.department,
    }),
  });
});

router.post("/attendance/check-in", requireAuth, async (req, res) => {
  const parsed = CheckInSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!parsed.data.photo.startsWith("data:image/")) {
    res.status(400).json({ error: "Foto tidak valid" });
    return;
  }
  if (approxBytes(parsed.data.photo) > MAX_PHOTO_BYTES) {
    res.status(400).json({ error: "Ukuran foto melebihi 2MB. Coba ambil ulang." });
    return;
  }
  const user = req.user!;
  const today = todayJakarta();
  const now = new Date();

  const existing = await query<AttendanceRow>(
    "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 LIMIT 1",
    [user.id, today],
  );

  if (existing.rows.length > 0 && existing.rows[0].check_in_at) {
    res.status(400).json({ error: "Anda sudah absen masuk hari ini" });
    return;
  }

  const status = statusFromCheckIn(now);
  let row: AttendanceRow;

  if (existing.rows.length > 0) {
    const r = await query<AttendanceRow>(
      `UPDATE attendance
         SET check_in_at = $1, check_in_photo = $2, status = $3, notes = COALESCE($4, notes)
       WHERE id = $5
       RETURNING *`,
      [now, parsed.data.photo, status, parsed.data.notes ?? null, existing.rows[0].id],
    );
    row = r.rows[0];
  } else {
    const r = await query<AttendanceRow>(
      `INSERT INTO attendance
         (employee_id, date, check_in_at, check_in_photo, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user.id, today, now, parsed.data.photo, status, parsed.data.notes ?? null],
    );
    row = r.rows[0];
  }

  res.status(201).json(
    shapeAttendance(row, {
      full_name: user.full_name,
      position: user.position,
      department: user.department,
    }),
  );
});

router.post("/attendance/check-out", requireAuth, async (req, res) => {
  const parsed = CheckOutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!parsed.data.photo.startsWith("data:image/")) {
    res.status(400).json({ error: "Foto tidak valid" });
    return;
  }
  if (approxBytes(parsed.data.photo) > MAX_PHOTO_BYTES) {
    res.status(400).json({ error: "Ukuran foto melebihi 2MB. Coba ambil ulang." });
    return;
  }
  const user = req.user!;
  const today = todayJakarta();

  const existing = await query<AttendanceRow>(
    "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 LIMIT 1",
    [user.id, today],
  );

  if (existing.rows.length === 0 || !existing.rows[0].check_in_at) {
    res.status(400).json({ error: "Anda belum absen masuk hari ini" });
    return;
  }
  if (existing.rows[0].check_out_at) {
    res.status(400).json({ error: "Anda sudah absen pulang hari ini" });
    return;
  }

  const r = await query<AttendanceRow>(
    `UPDATE attendance
       SET check_out_at = NOW(), check_out_photo = $1, notes = COALESCE($2, notes)
     WHERE id = $3
     RETURNING *`,
    [parsed.data.photo, parsed.data.notes ?? null, existing.rows[0].id],
  );

  res.json(
    shapeAttendance(r.rows[0], {
      full_name: user.full_name,
      position: user.position,
      department: user.department,
    }),
  );
});

export default router;
