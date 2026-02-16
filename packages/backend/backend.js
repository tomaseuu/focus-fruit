import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
const port = 8000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});

/* tasks */
const TEST_USER_ID = "8e889881-5afc-4439-b36a-b196c304875c";

app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [TEST_USER_ID],
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

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await pool.query(
      "INSERT INTO tasks (title, user_id) VALUES ($1, $2) RETURNING *",
      [title, TEST_USER_ID],
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
      "UPDATE tasks SET completed = NOT completed WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM tasks WHERE id = $1", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

app.post("/sessions/start", async (req, res) => {
  try {
    const { task_id } = req.body;

    // 🔒 Check for active session
    const activeCheck = await pool.query(
      `
    SELECT id FROM focus_sessions
    WHERE user_id = $1
    AND ended_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1

      `,
      [TEST_USER_ID],
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
      [TEST_USER_ID, task_id || null],
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
      WHERE user_id = $1
        AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [TEST_USER_ID],
    );

    if (result.rows.length === 0) {
      return res.json({ active: false });
    }

    res.json({
      active: true,
      session: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch active session" });
  }
});

app.post("/sessions/end", async (req, res) => {
  try {
    // 1️⃣ Find active session
    const activeSession = await pool.query(
      `
      SELECT id, started_at
      FROM focus_sessions
      WHERE user_id = $1
        AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [TEST_USER_ID],
    );

    if (activeSession.rows.length === 0) {
      return res.status(400).json({
        error: "No active session to end",
      });
    }

    const sessionId = activeSession.rows[0].id;

    // 2️⃣ End it
    const result = await pool.query(
      `
      UPDATE focus_sessions
      SET
        ended_at = NOW(),
        duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
      WHERE id = $1
      RETURNING *
      `,
      [sessionId],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end session" });
  }
});

app.get("/analytics/summary", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) AS total_sessions,
        COALESCE(SUM(duration_minutes), 0) AS total_focus_minutes
      FROM focus_sessions
      WHERE user_id = $1
        AND ended_at IS NOT NULL
      `,
      [TEST_USER_ID],
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

// recent sessions (last 6)
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
      WHERE fs.user_id = $1
        AND fs.ended_at IS NOT NULL
      ORDER BY fs.started_at DESC
      LIMIT 6
      `,
      [TEST_USER_ID],
    );

    const rows = result.rows;

    const out = rows.map((r) => {
      const started = r.started_at ? new Date(r.started_at) : null;

      // quick “time” label (Today / Yesterday / date)
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

    const active = await pool.query(
      `
      SELECT id
      FROM focus_sessions
      WHERE user_id = $1 AND ended_at IS NOT NULL
      ORDER BY ended_at DESC
      LIMIT 1
      `,
      [TEST_USER_ID],
    );

    if (active.rows.length === 0) {
      return res.status(400).json({ error: "No recent session to reflect on" });
    }

    const sessionId = active.rows[0].id;

    const result = await pool.query(
      `
      UPDATE focus_sessions
      SET clarity = $1, note = $2
      WHERE id = $3
      RETURNING *
      `,
      [clarity || null, note || null, sessionId],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save reflection" });
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
      [TEST_USER_ID],
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
      WHERE user_id = $1
        AND ended_at IS NOT NULL
      ORDER BY day DESC
      `,
      [TEST_USER_ID],
    );

    const days = result.rows.map((r) => r.day);

    if (days.length === 0) {
      return res.json({ streak: 0 });
    }

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let day of days) {
      const sessionDate = new Date(day);
      sessionDate.setHours(0, 0, 0, 0);

      const diff = (currentDate - sessionDate) / (1000 * 60 * 60 * 24);

      if (diff === streak) {
        streak++;
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate streak" });
  }
});

// clarity breakdown over last 30 days
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
      [TEST_USER_ID],
    );

    res.json(
      result.rows.map((r) => ({
        day: r.day, // YYYY-MM-DD
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

// minutes per day over last 7 days
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
      [TEST_USER_ID],
    );

    res.json(
      result.rows.map((r) => ({
        day: r.day, // YYYY-MM-DD
        minutes: Math.round(Number(r.minutes)),
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weekly analytics" });
  }
});

app.patch("/tasks/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE tasks SET completed = true WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete task" });
  }
});
