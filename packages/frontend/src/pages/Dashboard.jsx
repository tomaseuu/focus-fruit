import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatCard } from "../components/StatCard";
import { TagChip } from "../components/TagChip";
import { Clock, Target, CheckCircle2, Flame } from "lucide-react";

export function Dashboard() {
  const tasks = [
    { id: 1, title: "Review project proposal", tag: "Work", completed: false },
    { id: 2, title: "Morning meditation", tag: "Health", completed: true },
    { id: 3, title: "Design mockups", tag: "Creative", completed: false },
    { id: 4, title: "Study for exam", tag: "School", completed: false },
  ];

  const recentSessions = [
    {
      time: "9:00 AM",
      task: "Morning meditation",
      duration: "25 min",
      clarity: "Clear",
    },
    {
      time: "2:30 PM",
      task: "Design mockups",
      duration: "50 min",
      clarity: "Clear",
    },
    {
      time: "Yesterday",
      task: "Study for exam",
      duration: "25 min",
      clarity: "Meh",
    },
  ];

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
            <h1 className="text-3xl md:text-4xl mb-2">Start Focus Session</h1>
            <p className="text-white/90 mb-6">
              Ready to focus? Begin a new Pomodoro session and get things done.
            </p>

            <Link to="/focus">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-[#E07A5F] hover:bg-[#FAF7F2]"
              >
                <Clock className="w-5 h-5 mr-2" />
                Start Session
              </Button>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="text-6xl mb-2">25:00</div>
            <div className="text-white/80">Next focus block</div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Focus Minutes"
          value="342"
          icon={<Clock className="w-8 h-8" />}
          trend="+12% this week"
        />
        <StatCard
          label="Sessions"
          value="28"
          icon={<Target className="w-8 h-8" />}
          trend="14 this week"
        />
        <StatCard
          label="Tasks Completed"
          value="45"
          icon={<CheckCircle2 className="w-8 h-8" />}
          trend="8 today"
        />
        <StatCard
          label="Streak"
          value="7 days"
          icon={<Flame className="w-8 h-8" />}
          trend="Keep it going!"
        />
      </div>

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
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {}}
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
                <TagChip label={task.tag} />
              </div>
            ))}
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
            {recentSessions.map((session, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-[rgba(31,41,55,0.08)] hover:border-[#E07A5F] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm text-[#6B7280]">{session.time}</span>
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
                <div className="text-sm text-[#6B7280]">{session.duration}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
