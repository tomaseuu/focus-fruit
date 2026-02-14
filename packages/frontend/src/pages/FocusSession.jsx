import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Play, Pause, RotateCcw } from "lucide-react";
import { apiFetch } from "../api";

export function FocusSession() {
  const [hydrating, setHydrating] = useState(true);
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [cycles, setCycles] = useState(4);

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const [selectedTask, setSelectedTask] = useState("");
  const [showReflection, setShowReflection] = useState(false);
  const [clarity, setClarity] = useState("");
  const [note, setNote] = useState("");

  const [activeSession, setActiveSession] = useState(null);

  const tasks = useMemo(
    () => [
      "Review project proposal",
      "Design mockups",
      "Study for exam",
      "Write blog post",
      "Team meeting prep",
    ],
    [],
  );

  // 🔥 Restore active session on load
  useEffect(() => {
    async function checkActive() {
      try {
        const data = await apiFetch("/sessions/active");

        if (data.active) {
          setActiveSession(data.session);
          setIsRunning(true);

          const startedStr = data.session.started_at;
          const started = new Date(
            startedStr.endsWith("Z") ? startedStr : `${startedStr}Z`,
          );

          const now = new Date();
          const rawElapsed = Math.floor(
            (now.getTime() - started.getTime()) / 1000,
          );

          // if parsing ever causes negative elapsed, clamp to 0
          const elapsedSeconds = Math.max(0, rawElapsed);

          const remaining = Math.max(0, focusLength * 60 - elapsedSeconds);

          if (remaining > 0) {
            setTimeLeft(remaining);
          } else {
            setTimeLeft(0);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setHydrating(false);
      }
    }

    checkActive();
  }, []);

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
          setActiveSession(null);
        } catch (err) {
          console.error(err);
        }
      }

      setIsRunning(false);
      endSession();
      setShowReflection(true);
    }
  }, [timeLeft, isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!selectedTask) {
      alert("Please select a task first");
      return;
    }

    try {
      const session = await apiFetch("/sessions/start", {
        method: "POST",
        body: JSON.stringify({ task_id: null }),
      });

      setActiveSession(session);
      setIsRunning(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = async () => {
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

    setTimeLeft(focusLength * 60);
  };

  const handleEndSession = () => {
    setShowReflection(false);
    setClarity("");
    setNote("");
    setTimeLeft(focusLength * 60);
  };

  const total = focusLength * 60;
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;

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

        <div className="mb-8">
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
        </div>

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
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            disabled={isRunning}
            className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl"
          >
            <option value="">Choose a task...</option>
            {tasks.map((task) => (
              <option key={task} value={task}>
                {task}
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
