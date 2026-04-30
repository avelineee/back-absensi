
pool.on("error", (err) => {
  console.error("mysql pool error", err);
});
>>>>>>> 714dd7bcd37ead92631f21d1fae039e872bb824c

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const [result] = await pool.query(text, params ?? []);
  if (Array.isArray(result)) {
    const rows = result as unknown as T[];
    return { rows, rowCount: rows.length, insertId: 0 };
  }
  const r = result as mysql.ResultSetHeader;
  return { rows: [], rowCount: r.affectedRows, insertId: r.insertId };
}

export async function findOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const { rows } = await query<T>(text, params);
  return rows[0] ?? null;
}
