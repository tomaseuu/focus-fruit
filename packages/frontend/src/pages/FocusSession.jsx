import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Play, Pause, RotateCcw } from "lucide-react";

export function FocusSession() {
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [cycles, setCycles] = useState(4);

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const [selectedTask, setSelectedTask] = useState("");
  const [showReflection, setShowReflection] = useState(false);
  const [clarity, setClarity] = useState("");
  const [note, setNote] = useState("");

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

  useEffect(() => {
    let intervalId = null;

    if (isRunning && timeLeft > 0) {
      intervalId = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      setShowReflection(true);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!selectedTask) {
      alert("Please select a task first");
      return;
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(focusLength * 60);
  };

  const handleEndSession = () => {
    setShowReflection(false);
    setClarity("");
    setNote("");
    handleReset();
  };

  const total = focusLength * 60;
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Timer Card */}
      <Card padding="lg" className="text-center">
        <h1 className="text-2xl text-[#1F2937] mb-8">Focus Session</h1>

        {/* Timer Display */}
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

        {/* Controls */}
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

        {/* Task Selection */}
        <div className="max-w-md mx-auto mb-6">
          <label className="block text-left text-sm text-[#6B7280] mb-2">
            Select Task
          </label>

          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] text-[#1F2937]"
            disabled={isRunning}
          >
            <option value="">Choose a task...</option>
            {tasks.map((task) => (
              <option key={task} value={task}>
                {task}
              </option>
            ))}
          </select>
        </div>

        {selectedTask ? (
          <div className="text-[#6B7280]">
            Working on: <span className="text-[#1F2937]">{selectedTask}</span>
          </div>
        ) : null}
      </Card>

      {/* Settings Card */}
      <Card padding="lg">
        <h2 className="text-xl text-[#1F2937] mb-6">Session Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-[#6B7280] mb-2">
              Focus Length (minutes)
            </label>
            <input
              type="number"
              value={focusLength}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFocusLength(val);
                if (!isRunning) setTimeLeft(val * 60);
              }}
              min="1"
              max="60"
              disabled={isRunning}
              className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] text-[#1F2937] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm text-[#6B7280] mb-2">
              Break Length (minutes)
            </label>
            <input
              type="number"
              value={breakLength}
              onChange={(e) => setBreakLength(Number(e.target.value))}
              min="1"
              max="30"
              disabled={isRunning}
              className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] text-[#1F2937] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm text-[#6B7280] mb-2">Cycles</label>
            <input
              type="number"
              value={cycles}
              onChange={(e) => setCycles(Number(e.target.value))}
              min="1"
              max="10"
              disabled={isRunning}
              className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] text-[#1F2937] disabled:opacity-50"
            />
          </div>
        </div>
      </Card>

      {/* Reflection Modal */}
      <Modal
        isOpen={showReflection}
        onClose={() => setShowReflection(false)}
        title="Session Complete!"
        onSubmit={handleEndSession}
        submitText="Done"
      >
        <div className="space-y-6">
          <div>
            <p className="text-[#6B7280] mb-4">How clear was your focus?</p>
            <div className="flex gap-3">
              {["Clear", "Meh", "Foggy"].map((option) => (
                <button
                  key={option}
                  onClick={() => setClarity(option)}
                  className={[
                    "flex-1 py-3 px-4 rounded-2xl border-2 transition-all",
                    clarity === option
                      ? "border-[#E07A5F] bg-[#E07A5F] text-white"
                      : "border-[rgba(31,41,55,0.08)] hover:border-[#E07A5F]",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#6B7280] mb-2">
              Optional Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any thoughts about this session?"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
