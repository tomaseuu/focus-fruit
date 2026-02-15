import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatCard } from "../components/StatCard";
import { TagChip } from "../components/TagChip";
import { Clock, Target, CheckCircle2, Flame } from "lucide-react";
import { apiFetch } from "../api";

export function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  const [summary, setSummary] = useState({
    total_sessions: 0,
    total_focus_minutes: 0,
  });
  const [daily, setDaily] = useState({
    sessions_today: 0,
    focus_minutes_today: 0,
  });
  const [streak, setStreak] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // ✅ hero timer (seconds)
  const [heroTimeLeft, setHeroTimeLeft] = useState(25 * 60);
  const FOCUS_SECONDS = 25 * 60;

  const formatMMSS = (seconds) => {
    const s = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Keep your “Today's Tasks” list at 4 items like before
  const topTasks = useMemo(() => tasks.slice(0, 4), [tasks]);

  // Completed tasks count (for your stat card)
  const tasksCompleted = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks],
  );

  // ✅ active task title for hero (maps activeSession.task_id -> tasks)
  const activeTaskTitle = useMemo(() => {
    const id = activeSession?.task_id;
    if (!id) return "";
    return tasks.find((t) => String(t.id) === String(id))?.title ?? "";
  }, [activeSession, tasks]);

  const toggleTask = async (id) => {
    // optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );

    try {
      const updated = await apiFetch(`/tasks/${id}`, { method: "PATCH" });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      // revert on fail
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      );
      alert(e?.message ?? "Failed to update task");
    }
  };

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const results = await Promise.allSettled([
          apiFetch("/tasks"),
          apiFetch("/analytics/summary"),
          apiFetch("/analytics/daily"),
          apiFetch("/analytics/streak"),
          apiFetch("/sessions/active"),
          apiFetch("/sessions/recent"),
        ]);

        const [t, s, d, st, a, r] = results.map((x) =>
          x.status === "fulfilled" ? x.value : null,
        );

        setTasks(Array.isArray(t) ? t : []);
        setSummary(s ?? { total_sessions: 0, total_focus_minutes: 0 });
        setDaily(d ?? { sessions_today: 0, focus_minutes_today: 0 });
        setStreak(Number(st?.streak ?? 0));
        setActiveSession(a?.active ? a.session : null);
        setRecentSessions(Array.isArray(r) ? r : []);

        setSummary(s ?? { total_sessions: 0, total_focus_minutes: 0 });
        setDaily(d ?? { sessions_today: 0, focus_minutes_today: 0 });
        setStreak(Number(st?.streak ?? 0));

        // /sessions/active returns { active: boolean, session?: ... }
        setActiveSession(a?.active ? a.session : null);

        // /sessions/recent returns array [{ time, task, duration, clarity }]
        setRecentSessions(Array.isArray(r) ? r : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load dashboard");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ Hero countdown based on activeSession.started_at
  useEffect(() => {
    // no active session -> show default block
    if (!activeSession?.started_at) {
      setHeroTimeLeft(FOCUS_SECONDS);
      return;
    }

    function computeRemaining() {
      const startedStr = activeSession.started_at;

      // handle timestamps without Z like your FocusSession did
      const started = new Date(
        startedStr.endsWith("Z") ? startedStr : `${startedStr}Z`,
      );

      const now = new Date();
      const elapsed = Math.floor((now.getTime() - started.getTime()) / 1000);
      const remaining = Math.max(0, FOCUS_SECONDS - Math.max(0, elapsed));
      setHeroTimeLeft(remaining);
    }

    computeRemaining();
    const id = setInterval(computeRemaining, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero */}
      <Card
        padding="lg"
        className="bg-gradient-to-br from-[#E07A5F] to-[#d66b53] 
             text-white border-0 
             min-h-[220px] 
             w-full 
             px-10 py-12"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl mb-2">
              {activeSession ? "Resume Focus Session" : "Start Focus Session"}
            </h1>

            <p className="text-white/90 mb-6">
              {activeSession ? (
                <>
                  You already have a session running. Jump back in and keep
                  going.
                  {activeTaskTitle ? (
                    <span className="block mt-2 text-white/95">
                      Focusing on:{" "}
                      <span className="font-medium">{activeTaskTitle}</span>
                    </span>
                  ) : null}
                </>
              ) : (
                "Ready to focus? Begin a new Pomodoro session and get things done."
              )}
            </p>

            <Link to="/focus">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-[#E07A5F] hover:bg-[#FAF7F2]"
              >
                <Clock className="w-5 h-5 mr-2" />
                {activeSession ? "Resume Session" : "Start Session"}
              </Button>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="text-6xl mb-2">
              {activeSession ? formatMMSS(heroTimeLeft) : "25:00"}
            </div>
            <div className="text-white/80">
              {activeSession ? "Time left" : "Next focus block"}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Focus Minutes"
          value={String(daily.focus_minutes_today ?? 0)}
          icon={<Clock className="w-8 h-8" />}
          trend={`${summary.total_focus_minutes ?? 0} total`}
        />
        <StatCard
          label="Sessions"
          value={String(daily.sessions_today ?? 0)}
          icon={<Target className="w-8 h-8" />}
          trend={`${summary.total_sessions ?? 0} total`}
        />
        <StatCard
          label="Tasks Completed"
          value={String(tasksCompleted)}
          icon={<CheckCircle2 className="w-8 h-8" />}
          trend={`${topTasks.length} shown`}
        />
        <StatCard
          label="Streak"
          value={`${streak} days`}
          icon={<Flame className="w-8 h-8" />}
          trend="Keep it going!"
        />
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-[#1F2937]">Today's Tasks</h2>
            <Link to="/tasks">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10 text-[#6B7280]">Loading…</div>
            ) : topTasks.length === 0 ? (
              <div className="text-center py-10 text-[#6B7280]">
                No tasks yet
              </div>
            ) : (
              topTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/focus?taskId=${task.id}`)
                  }
                >
                  <input
                    type="checkbox"
                    checked={Boolean(task.completed)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 rounded-lg border-2 border-[rgba(31,41,55,0.2)] checked:bg-[#E07A5F] checked:border-[#E07A5F] cursor-pointer"
                  />
                  <span
                    className={`flex-1 ${
                      task.completed
                        ? "line-through text-[#6B7280]"
                        : "text-[#1F2937]"
                    }`}
                  >
                    {task.title}
                  </span>
                  <TagChip label={task.tag ?? "Work"} />
                </div>
              ))
            )}
          </div>

          <Link to="/tasks">
            <Button variant="secondary" className="w-full mt-4">
              Add New Task
            </Button>
          </Link>
        </Card>

        {/* Recent Sessions */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-[#1F2937]">Recent Sessions</h2>
            <Link to="/analytics">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10 text-[#6B7280]">Loading…</div>
            ) : recentSessions.length === 0 ? (
              <div className="text-center py-10 text-[#6B7280]">
                No recent sessions yet
              </div>
            ) : (
              recentSessions.map((session, index) => (
                <div
                  key={index}
                  onClick={() => (window.location.href = "/analytics")}
                  className="p-4 rounded-xl border border-[rgba(31,41,55,0.08)] hover:border-[#E07A5F] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-[#6B7280]">
                      {session.time}
                    </span>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        session.clarity === "Clear"
                          ? "bg-green-50 text-green-700"
                          : session.clarity === "Meh"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {session.clarity}
                    </span>
                  </div>
                  <div className="text-[#1F2937] mb-1">{session.task}</div>
                  <div className="text-sm text-[#6B7280]">
                    {session.duration}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
