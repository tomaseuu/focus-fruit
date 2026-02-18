import { supabaseAdmin } from "./supabaseAdmin.js";
import { pool } from "./db.js";

export async function requireUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    const token = match[1];

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = data.user;

    await pool.query(
      `
  INSERT INTO users (id, email)
  VALUES ($1, $2)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  `,
      [req.user.id, req.user.email],
    );

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ error: "Auth middleware failed" });
  }
}
