import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { requireUser } from "./requireUser.js";
import { ensureUserRow } from "./ensureUserRow.js";

const app = express();
const port = process.env.PORT || 8000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/postman
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use(requireUser);
app.use(ensureUserRow);

/* tasks */
app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const result = await pool.query(
      "INSERT INTO tasks (title, user_id) VALUES ($1, $2) RETURNING *",
      [title, req.user.id],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.patch("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE tasks
      SET completed = NOT completed
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, req.user.id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Task not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.patch("/tasks/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE tasks
      SET completed = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, req.user.id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Task not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, req.user.id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Task not found" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

/* sessions */
app.post("/sessions/start", async (req, res) => {
  try {
    const { task_id } = req.body;

    if (task_id) {
      const taskCheck = await pool.query(
        "SELECT id FROM tasks WHERE id = $1 AND user_id = $2",
        [task_id, req.user.id],
      );
      if (taskCheck.rows.length === 0) {
        return res.status(403).json({ error: "Task does not belong to user" });
      }
    }

    const activeCheck = await pool.query(
      `
      SELECT id FROM focus_sessions
      WHERE user_id = $1 AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [req.user.id],
    );

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        error: "A session is already active",
        active_session_id: activeCheck.rows[0].id,
      });
    }

    const result = await pool.query(
      `
      INSERT INTO focus_sessions (user_id, task_id, started_at)
      VALUES ($1, $2, NOW())
      RETURNING *
      `,
      [req.user.id, task_id || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start session" });
  }
});

app.get("/sessions/active", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM focus_sessions
      WHERE user_id = $1 AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [req.user.id],
    );

    if (result.rows.length === 0) return res.json({ active: false });

    res.json({ active: true, session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch active session" });
  }
});

app.post("/sessions/end", async (req, res) => {
  try {
    const activeSession = await pool.query(
      `
      SELECT id, started_at
      FROM focus_sessions
      WHERE user_id = $1 AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [req.user.id],
    );

    if (activeSession.rows.length === 0) {
      return res.status(400).json({ error: "No active session to end" });
    }

    const sessionId = activeSession.rows[0].id;

    const result = await pool.query(
      `
      UPDATE focus_sessions
      SET
        ended_at = NOW(),
        duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [sessionId, req.user.id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end session" });
  }
});

app.get("/sessions/recent", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        fs.started_at,
        fs.duration_minutes,
        fs.clarity,
        fs.note,
        t.title AS task_title
      FROM focus_sessions fs
      LEFT JOIN tasks t ON t.id = fs.task_id
      WHERE fs.user_id = $1 AND fs.ended_at IS NOT NULL
      ORDER BY fs.started_at DESC
      LIMIT 6
      `,
      [req.user.id],
    );

    const out = result.rows.map((r) => {
      const started = r.started_at ? new Date(r.started_at) : null;

      let time = "—";
      if (started) {
        const d = new Date(started);
        const now = new Date();

        const startDay = new Date(d);
        startDay.setHours(0, 0, 0, 0);

        const nowDay = new Date(now);
        nowDay.setHours(0, 0, 0, 0);

        const diffDays = Math.round(
          (nowDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 0)
          time = d.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          });
        else if (diffDays === 1) time = "Yesterday";
        else time = d.toLocaleDateString();
      }

      const mins = Math.round(Number(r.duration_minutes || 0));
      return {
        time,
        task: r.task_title || "Focus Session",
        duration: `${mins} min`,
        clarity: r.clarity || null,
        note: r.note || null,
      };
    });

    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recent sessions" });
  }
});

app.post("/sessions/reflect", async (req, res) => {
  try {
    const { clarity, note } = req.body;
    const allowedClarity = ["clear", "meh", "foggy"];

    if (clarity && !allowedClarity.includes(clarity)) {
      return res.status(400).json({ error: "Invalid clarity value" });
    }

    const latestEnded = await pool.query(
      `
      SELECT id
      FROM focus_sessions
      WHERE user_id = $1 AND ended_at IS NOT NULL
      ORDER BY ended_at DESC
      LIMIT 1
      `,
      [req.user.id],
    );

    if (latestEnded.rows.length === 0) {
      return res.status(400).json({ error: "No recent session to reflect on" });
    }

    const sessionId = latestEnded.rows[0].id;

    const result = await pool.query(
      `
      UPDATE focus_sessions
      SET clarity = $1, note = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
      `,
      [clarity || null, note || null, sessionId, req.user.id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save reflection" });
  }
});

/* analytics */
app.get("/analytics/summary", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) AS total_sessions,
        COALESCE(SUM(duration_minutes), 0) AS total_focus_minutes
      FROM focus_sessions
      WHERE user_id = $1 AND ended_at IS NOT NULL
      `,
      [req.user.id],
    );

    const row = result.rows[0];

    res.json({
      total_sessions: Number(row.total_sessions),
      total_focus_minutes: Number(row.total_focus_minutes),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/analytics/daily", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) AS sessions_today,
        COALESCE(SUM(duration_minutes), 0) AS focus_minutes_today
      FROM focus_sessions
      WHERE user_id = $1
        AND ended_at IS NOT NULL
        AND DATE(started_at) = CURRENT_DATE
      `,
      [req.user.id],
    );

    const row = result.rows[0];

    res.json({
      sessions_today: Number(row.sessions_today),
      focus_minutes_today: Number(row.focus_minutes_today),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch daily analytics" });
  }
});

app.get("/analytics/streak", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT DATE(started_at) AS day
      FROM focus_sessions
      WHERE user_id = $1 AND ended_at IS NOT NULL
      ORDER BY day DESC
      `,
      [req.user.id],
    );

    const days = result.rows.map((r) => r.day);

    if (days.length === 0) return res.json({ streak: 0 });

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const day of days) {
      const sessionDate = new Date(day);
      sessionDate.setHours(0, 0, 0, 0);

      const diff = (currentDate - sessionDate) / (1000 * 60 * 60 * 24);

      if (diff === streak) streak++;
      else break;
    }

    res.json({ streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate streak" });
  }
});

app.get("/analytics/clarity", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        DATE(started_at) AS day,
        SUM(CASE WHEN clarity = 'clear' THEN 1 ELSE 0 END) AS clear,
        SUM(CASE WHEN clarity = 'meh' THEN 1 ELSE 0 END) AS meh,
        SUM(CASE WHEN clarity = 'foggy' THEN 1 ELSE 0 END) AS foggy
      FROM focus_sessions
      WHERE user_id = $1
        AND ended_at IS NOT NULL
        AND started_at >= NOW() - INTERVAL '30 days'
        AND clarity IS NOT NULL
      GROUP BY day
      ORDER BY day ASC
      `,
      [req.user.id],
    );

    res.json(
      result.rows.map((r) => ({
        day: r.day,
        clear: Number(r.clear),
        meh: Number(r.meh),
        foggy: Number(r.foggy),
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clarity analytics" });
  }
});

app.get("/analytics/weekly", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        DATE(started_at) AS day,
        COALESCE(SUM(duration_minutes), 0) AS minutes
      FROM focus_sessions
      WHERE user_id = $1
        AND ended_at IS NOT NULL
        AND started_at >= NOW() - INTERVAL '7 days'
      GROUP BY day
      ORDER BY day ASC
      `,
      [req.user.id],
    );

    res.json(
      result.rows.map((r) => ({
        day: r.day,
        minutes: Math.round(Number(r.minutes)),
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weekly analytics" });
  }
});

/* profile */
app.get("/me", async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, email, name FROM users WHERE id = $1`,
      [userId],
    );

    res.json(
      result.rows[0] ?? { id: userId, email: req.user.email, name: null },
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.patch("/me", async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET name = $1
      WHERE id = $2
      RETURNING id, email, name
      `,
      [name ?? null, userId],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* settings */
app.get("/settings", async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT sound_enabled, notifications_enabled, theme
      FROM user_settings
      WHERE user_id = $1
      `,
      [userId],
    );

    res.json(
      result.rows[0] ?? {
        sound_enabled: true,
        notifications_enabled: true,
        theme: "light",
      },
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.patch("/settings", async (req, res) => {
  try {
    const userId = req.user.id;
    const { sound_enabled, notifications_enabled, theme } = req.body;

    const result = await pool.query(
      `
      INSERT INTO user_settings (user_id, sound_enabled, notifications_enabled, theme)
      VALUES ($4,
        COALESCE($1, true),
        COALESCE($2, true),
        COALESCE($3, 'light')
      )
      ON CONFLICT (user_id) DO UPDATE SET
        sound_enabled = COALESCE($1, user_settings.sound_enabled),
        notifications_enabled = COALESCE($2, user_settings.notifications_enabled),
        theme = COALESCE($3, user_settings.theme),
        updated_at = NOW()
      RETURNING sound_enabled, notifications_enabled, theme
      `,
      [
        typeof sound_enabled === "boolean" ? sound_enabled : null,
        typeof notifications_enabled === "boolean"
          ? notifications_enabled
          : null,
        typeof theme === "string" ? theme : null,
        userId,
      ],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
