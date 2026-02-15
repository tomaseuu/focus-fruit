import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Award, Clock } from "lucide-react";
import { apiFetch } from "../api";

export function Analytics() {
  // ✅ real backend stats
  const [summary, setSummary] = useState({
    total_sessions: 0,
    total_focus_minutes: 0,
  });
  const [daily, setDaily] = useState({
    sessions_today: 0,
    focus_minutes_today: 0,
  });
  const [streak, setStreak] = useState(0);
  const [recentSessions, setRecentSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // ====== your existing mock chart data (kept as-is) ======
  const weeklyData = [
    { day: "Mon", minutes: 120 },
    { day: "Tue", minutes: 90 },
    { day: "Wed", minutes: 150 },
    { day: "Thu", minutes: 180 },
    { day: "Fri", minutes: 135 },
    { day: "Sat", minutes: 60 },
    { day: "Sun", minutes: 75 },
  ];

  const clarityData = [
    { week: "Week 1", clear: 12, meh: 5, foggy: 2 },
    { week: "Week 2", clear: 15, meh: 4, foggy: 1 },
    { week: "Week 3", clear: 18, meh: 3, foggy: 1 },
    { week: "Week 4", clear: 20, meh: 2, foggy: 0 },
  ];

  const heatmapData = [
    { day: "Mon", hours: [0, 45, 90, 120, 60, 30, 0, 0] },
    { day: "Tue", hours: [0, 30, 60, 90, 75, 45, 0, 0] },
    { day: "Wed", hours: [0, 60, 120, 150, 90, 30, 0, 0] },
    { day: "Thu", hours: [0, 75, 135, 180, 120, 45, 0, 0] },
    { day: "Fri", hours: [0, 45, 90, 135, 90, 30, 0, 0] },
    { day: "Sat", hours: [0, 0, 30, 60, 30, 0, 0, 0] },
    { day: "Sun", hours: [0, 0, 45, 75, 30, 0, 0, 0] },
  ];

  const getHeatmapColor = (minutes) => {
    if (minutes === 0) return "#F2E9E4";
    if (minutes < 60) return "#fcd5c6";
    if (minutes < 120) return "#f4a98f";
    if (minutes < 180) return "#E07A5F";
    return "#c66649";
  };

  // ✅ derive a couple insight values from your mock weeklyData (for now)
  const bestFocusDay = useMemo(() => {
    if (!weeklyData.length) return { day: "—", minutes: 0 };
    return weeklyData.reduce((best, cur) =>
      cur.minutes > best.minutes ? cur : best,
    );
  }, [weeklyData]);

  // ✅ clarity score derived from mock clarityData (for now)
  const clarityScore = useMemo(() => {
    const last = clarityData[clarityData.length - 1];
    if (!last) return 0;
    const total = (last.clear || 0) + (last.meh || 0) + (last.foggy || 0);
    if (!total) return 0;
    return Math.round(((last.clear || 0) / total) * 100);
  }, [clarityData]);

  // ✅ load real stats
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const [s, d, st, r] = await Promise.all([
          apiFetch("/analytics/summary"),
          apiFetch("/analytics/daily"),
          apiFetch("/analytics/streak"),
          apiFetch("/sessions/recent"),
        ]);

        if (!alive) return;

        setSummary(s ?? { total_sessions: 0, total_focus_minutes: 0 });
        setDaily(d ?? { sessions_today: 0, focus_minutes_today: 0 });
        setStreak(Number(st?.streak ?? 0));
        setRecentSessions(Array.isArray(r) ? r : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load analytics");
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl text-[#1F2937] mb-1">Analytics</h1>
        <p className="text-[#6B7280]">
          Track your focus patterns and productivity
        </p>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md" className="border-l-4 border-l-[#E07A5F]">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#F2E9E4] rounded-xl">
              <TrendingUp className="w-6 h-6 text-[#E07A5F]" />
            </div>
            <div>
              <p className="text-sm text-[#6B7280] mb-1">Best Focus Day</p>
              <p className="text-xl text-[#1F2937]">{bestFocusDay.day}</p>
              <p className="text-sm text-[#6B7280] mt-1">
                {bestFocusDay.minutes} min average
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-[#2A9D8F]">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#F2E9E4] rounded-xl">
              <Clock className="w-6 h-6 text-[#2A9D8F]" />
            </div>
            <div>
              <p className="text-sm text-[#6B7280] mb-1">Today</p>
              <p className="text-xl text-[#1F2937]">
                {loading ? "—" : `${daily.focus_minutes_today} min`}
              </p>
              <p className="text-sm text-[#6B7280] mt-1">
                {loading ? "—" : `${daily.sessions_today} sessions`}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-[#F4A261]">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#F2E9E4] rounded-xl">
              <Award className="w-6 h-6 text-[#F4A261]" />
            </div>
            <div>
              <p className="text-sm text-[#6B7280] mb-1">Streak</p>
              <p className="text-xl text-[#1F2937]">
                {loading ? "—" : `${streak} days`}
              </p>
              <p className="text-sm text-[#6B7280] mt-1">
                {loading ? "—" : `${summary.total_sessions} total sessions`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly Focus Chart */}
      <Card padding="lg">
        <h2 className="text-xl text-[#1F2937] mb-6">Weekly Focus Minutes</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2E9E4" />
            <XAxis
              dataKey="day"
              stroke="#6B7280"
              style={{ fontSize: "14px" }}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: "14px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(31, 41, 55, 0.08)",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            <Bar dataKey="minutes" fill="#E07A5F" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Clarity Trend */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-[#1F2937]">Clarity Trend</h2>
          <div className="text-sm text-[#6B7280]">
            Score: <span className="text-[#1F2937]">{clarityScore}%</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={clarityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2E9E4" />
            <XAxis
              dataKey="week"
              stroke="#6B7280"
              style={{ fontSize: "14px" }}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: "14px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(31, 41, 55, 0.08)",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="clear"
              stroke="#2A9D8F"
              strokeWidth={3}
              dot={{ fill: "#2A9D8F", r: 5 }}
              name="Clear"
            />
            <Line
              type="monotone"
              dataKey="meh"
              stroke="#F4A261"
              strokeWidth={3}
              dot={{ fill: "#F4A261", r: 5 }}
              name="Meh"
            />
            <Line
              type="monotone"
              dataKey="foggy"
              stroke="#6B7280"
              strokeWidth={3}
              dot={{ fill: "#6B7280", r: 5 }}
              name="Foggy"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Heatmap Calendar */}
      <Card padding="lg">
        <h2 className="text-xl text-[#1F2937] mb-6">Focus Heatmap</h2>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-2 mb-3 text-sm text-[#6B7280] pl-16">
              {["6AM", "9AM", "12PM", "3PM", "6PM", "9PM", "12AM", "3AM"].map(
                (hour) => (
                  <div key={hour} className="w-12 text-center">
                    {hour}
                  </div>
                ),
              )}
            </div>

            {heatmapData.map((dayData) => (
              <div key={dayData.day} className="flex items-center gap-2 mb-2">
                <div className="w-12 text-sm text-[#6B7280]">{dayData.day}</div>
                {dayData.hours.map((minutes, i) => (
                  <div
                    key={`${dayData.day}-${i}`}
                    className="w-12 h-12 rounded-lg transition-all hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: getHeatmapColor(minutes) }}
                    title={`${minutes} minutes`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6 text-sm text-[#6B7280]">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 60, 120, 180].map((val) => (
              <div
                key={val}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: getHeatmapColor(val) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </Card>

      {/* ✅ Optional: show recent sessions pulled from backend */}
      <Card padding="lg">
        <h2 className="text-xl text-[#1F2937] mb-6">Recent Sessions</h2>

        {loading ? (
          <div className="text-center py-10 text-[#6B7280]">Loading…</div>
        ) : recentSessions.length === 0 ? (
          <div className="text-center py-10 text-[#6B7280]">
            No recent sessions yet
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-[rgba(31,41,55,0.08)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm text-[#6B7280]">
                    {session.time ?? "—"}
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
                    {session.clarity ?? "—"}
                  </span>
                </div>
                <div className="text-[#1F2937] mb-1">{session.task ?? "—"}</div>
                <div className="text-sm text-[#6B7280]">
                  {session.duration ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
