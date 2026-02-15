import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { apiFetch } from "../api";

function clampInt(n, min, max) {
  const v = Number.parseInt(String(n), 10);
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

export function FocusSession() {
  const [hydrating, setHydrating] = useState(true);

  // ✅ Persist focus length so refresh doesn't reset to 25
  const [focusLength, setFocusLength] = useState(() => {
    const saved = localStorage.getItem("focusLengthMinutes");
    return clampInt(saved ?? 25, 1, 240);
  });

  const [breakLength, setBreakLength] = useState(5);
  const [cycles, setCycles] = useState(4);

  const [timeLeft, setTimeLeft] = useState(() => Math.max(1, focusLength * 60));
  const [isRunning, setIsRunning] = useState(false);

  // store selected task as TASK ID (string), not title
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const [showReflection, setShowReflection] = useState(false);
  const [clarity, setClarity] = useState("");
  const [note, setNote] = useState("");

  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState(null);

  // real tasks
  const [tasks, setTasks] = useState([]);

  // ✅ Time dropdown (Figma-style)
  const presetTimes = [5, 10, 15, 25, 45, 60, 90, 120];
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const dropdownRef = useRef(null);

  // read ?taskId= from URL (works with your window.location.href approach)
  const initialTaskId = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("taskId") || "";
    } catch {
      return "";
    }
  }, []);

  // ✅ auto-complete helper
  const completeSelectedTask = async (taskId) => {
    if (!taskId) return;
    try {
      await apiFetch(`/tasks/${taskId}/complete`, { method: "PATCH" });
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds) => {
    const s = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ✅ Apply a chosen focus length (minutes)
  const applyFocusMinutes = (minutes) => {
    const m = clampInt(minutes, 1, 240);
    localStorage.setItem("focusLengthMinutes", String(m));
    setFocusLength(m);
    // "minimum 1 second" safety: never allow 0
    setTimeLeft(Math.max(1, m * 60));
    setShowCustomInput(false);
    setCustomTime("");
  };

  const handleTimeSelect = (minutes) => {
    // Don't allow changing time mid-session
    if (isRunning || activeSession) return;
    applyFocusMinutes(minutes);
  };

  const handleCustomTimeSubmit = () => {
    const m = clampInt(customTime, 1, 240);
    handleTimeSelect(m);
    setShowTimeDropdown(false);
  };

  // ✅ close dropdown when clicking outside
  useEffect(() => {
    const onDown = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) {
        setShowTimeDropdown(false);
        setShowCustomInput(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // 🔥 Restore active session + load tasks + preselect URL taskId
  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        const [tasksData, active] = await Promise.all([
          apiFetch("/tasks"),
          apiFetch("/sessions/active"),
        ]);

        if (!alive) return;

        const list = Array.isArray(tasksData) ? tasksData : [];
        setTasks(list);

        // preselect from URL if present and exists
        if (initialTaskId) {
          const found = list.find(
            (t) => String(t.id) === String(initialTaskId),
          );
          if (found) setSelectedTaskId(String(found.id));
        }

        if (active?.active) {
          setActiveSession(active.session);
          setIsRunning(true);

          // best-effort: if session has task_id, select it
          if (active.session?.task_id) {
            setSelectedTaskId(String(active.session.task_id));
          }

          const startedStr = active.session.started_at;
          const started = new Date(
            startedStr.endsWith("Z") ? startedStr : `${startedStr}Z`,
          );

          const now = new Date();
          const rawElapsed = Math.floor(
            (now.getTime() - started.getTime()) / 1000,
          );
          const elapsedSeconds = Math.max(0, rawElapsed);

          // Use current focusLength (persisted) for remaining estimate
          const remaining = Math.max(0, focusLength * 60 - elapsedSeconds);
          setTimeLeft(remaining > 0 ? remaining : 0);
        } else {
          // no active session -> ensure timer matches chosen focusLength
          setTimeLeft((prev) => Math.max(1, focusLength * 60));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!alive) return;
        setHydrating(false);
      }
    }

    boot();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTaskId]);

  // 🔥 Timer interval
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  // 🔥 When timer hits 0
  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      async function endSession() {
        try {
          await apiFetch("/sessions/end", { method: "POST" });

          // ✅ auto-complete task tied to this session
          const taskId = activeSession?.task_id || selectedTaskId;
          await completeSelectedTask(taskId);

          setActiveSession(null);
        } catch (err) {
          console.error(err);
        }
      }

      setIsRunning(false);
      endSession();
      setShowReflection(true);
    }
  }, [timeLeft, isRunning, activeSession, selectedTaskId]);

  const handleStart = async () => {
    setError(null);

    if (!selectedTaskId) {
      setError("Please select a task first.");
      return;
    }

    if (activeSession) {
      setError("A session is already running. Resume or reset it first.");
      return;
    }

    try {
      const session = await apiFetch("/sessions/start", {
        method: "POST",
        body: JSON.stringify({ task_id: selectedTaskId }),
      });

      setActiveSession(session);
      setIsRunning(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err?.message ?? "Failed to start session.");
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = async () => {
    setError(null);
    setIsRunning(false);

    if (activeSession) {
      try {
        await apiFetch("/sessions/end", { method: "POST" });
      } catch (err) {
        console.error(err);
      } finally {
        setActiveSession(null);
      }
    }

    setTimeLeft(Math.max(1, focusLength * 60));
  };

  const handleEndSession = () => {
    setShowReflection(false);
    setClarity("");
    setNote("");
    setTimeLeft(Math.max(1, focusLength * 60));
  };

  const total = focusLength * 60;
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  const selectedTaskTitle =
    tasks.find((t) => String(t.id) === String(selectedTaskId))?.title ?? "";

  if (hydrating) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card padding="lg" className="text-center">
          <h1 className="text-2xl text-[#1F2937] mb-2">Focus Session</h1>
          <p className="text-[#6B7280]">Restoring session…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Card padding="lg" className="text-center">
        <h1 className="text-2xl text-[#1F2937] mb-8">Focus Session</h1>

        <div className="mb-8 relative">
          <div className="relative inline-block">
            <svg className="w-64 h-64 -rotate-90">
              <circle
                cx="128"
                cy="128"
                r={radius}
                stroke="#F2E9E4"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="128"
                cy="128"
                r={radius}
                stroke="#E07A5F"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl text-[#1F2937]">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* ✅ Time Dropdown Button (top-right) */}
          <div className="absolute top-0 right-0 md:right-8" ref={dropdownRef}>
            <button
              onClick={() => setShowTimeDropdown((v) => !v)}
              disabled={isRunning || Boolean(activeSession)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl hover:bg-[#FAF7F2] transition-all text-[#1F2937] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="w-4 h-4 text-[#E07A5F]" />
              <span className="text-sm">{focusLength} min</span>
            </button>

            {showTimeDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-[rgba(31,41,55,0.08)] py-2 z-50 max-h-80 overflow-y-auto">
                {presetTimes.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      handleTimeSelect(m);
                      setShowTimeDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#FAF7F2] transition-colors ${
                      focusLength === m && !showCustomInput
                        ? "text-[#E07A5F] bg-[#FAF7F2]"
                        : "text-[#1F2937]"
                    }`}
                  >
                    {m} minutes
                  </button>
                ))}

                <div className="border-t border-[rgba(31,41,55,0.08)] my-2" />

                <div className="px-4 py-2">
                  <button
                    onClick={() => setShowCustomInput((v) => !v)}
                    className="w-full text-left text-[#E07A5F] hover:text-[#d66b53] text-sm transition-colors"
                  >
                    {showCustomInput ? "Cancel Custom" : "Custom Time"}
                  </button>

                  {showCustomInput && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="number"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        placeholder="Enter minutes (1–240)"
                        min="1"
                        max="240"
                        className="w-full px-3 py-2 bg-white border border-[rgba(31,41,55,0.08)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] text-sm"
                      />
                      <button
                        onClick={handleCustomTimeSubmit}
                        className="w-full px-3 py-2 bg-[#E07A5F] text-white rounded-xl hover:bg-[#d66b53] transition-colors text-sm"
                      >
                        Set Time
                      </button>
                      <p className="text-xs text-[#6B7280]">
                        Max: 240 min (4 hours)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-[#6B7280] mb-3">
          {selectedTaskTitle
            ? `Focusing on: ${selectedTaskTitle}`
            : "Pick a task to focus on"}
        </div>

        {error ? (
          <div className="text-sm text-red-600 mb-6">{error}</div>
        ) : null}

        <div className="flex items-center justify-center gap-4 mb-8">
          {!isRunning ? (
            <Button variant="primary" size="lg" onClick={handleStart}>
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={handlePause}>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}

          <Button variant="ghost" size="lg" onClick={handleReset}>
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>

        <div className="max-w-md mx-auto mb-6">
          <label className="block text-left text-sm text-[#6B7280] mb-2">
            Select Task
          </label>

          <select
            value={selectedTaskId}
            onChange={(e) => {
              setSelectedTaskId(e.target.value);
              setError(null);
            }}
            disabled={isRunning}
            className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl"
          >
            <option value="">Choose a task...</option>
            {tasks.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Modal
        isOpen={showReflection}
        onClose={() => setShowReflection(false)}
        title="Session Complete!"
        onSubmit={handleEndSession}
        submitText="Done"
      >
        <div className="space-y-6">
          <p>Nice work. Reflect if you'd like.</p>
        </div>
      </Modal>
    </div>
  );
}
