import { pool } from "./db.js";

export async function ensureUserRow(req, res, next) {
  try {
    const id = req.user.id;
    const email = req.user.email ?? null;

    const name =
      req.user.user_metadata?.full_name || req.user.user_metadata?.name || null;

    await pool.query(
      `
      INSERT INTO users (id, email, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        name = COALESCE(users.name, EXCLUDED.name)
      `,
      [id, email, name],
    );

    await pool.query(
      `
      INSERT INTO user_settings (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [id],
    );

    next();
  } catch (err) {
    console.error("ensureUserRow error:", err);
    res.status(500).json({ error: "Failed to ensure user row" });
  }
}
