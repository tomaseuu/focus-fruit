import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { TagChip } from "../components/TagChip";
import { Plus, Search } from "lucide-react";
import { apiFetch } from "../api";

const DEFAULT_TASK_META = {
  tag: "Work",
  priority: "Low",
  estimate: "30m",
};

function normalizeTask(t) {
  return {
    ...t,
    tag: t?.tag ?? DEFAULT_TASK_META.tag,
    priority: t?.priority ?? DEFAULT_TASK_META.priority,
    estimate: t?.estimate ?? DEFAULT_TASK_META.estimate,
    completed: Boolean(t?.completed),
  };
}

export function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showAddTask, setShowAddTask] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    tag: "Work",
    priority: "Low",
    estimate: "30m",
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const tags = useMemo(
    () => ["All", "School", "Work", "Creative", "Health"],
    [],
  );

  const priorityColors = {
    High: "text-red-600",
    Medium: "text-yellow-600",
    Low: "text-green-600",
  };

  const remainingCount = tasks.filter((t) => !t.completed).length;

  const handleAddTask = async () => {
    const title = newTask.title.trim();
    if (!title) return;

    try {
      const created = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          tag: newTask.tag,
          priority: newTask.priority,
          estimate: newTask.estimate,
        }),
      });

      setTasks((prev) => [normalizeTask(created), ...prev]);
      setNewTask({ title: "", tag: "Work", priority: "Low", estimate: "30m" });
      setShowAddTask(false);
    } catch (e) {
      alert(e?.message ?? "Failed to create task");
    }
  };

  const toggleComplete = async (id) => {
    try {
      const updated = await apiFetch(`/tasks/${id}`, { method: "PATCH" });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? normalizeTask(updated) : t)),
      );
    } catch (e) {
      alert(e?.message ?? "Failed to update task");
    }
  };

  const deleteTask = async (id) => {
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e?.message ?? "Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const tag = task.tag ?? DEFAULT_TASK_META.tag;
    const matchesFilter = activeFilter === "All" || tag === activeFilter;

    const title = (task.title ?? "").toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const data = await apiFetch("/tasks");
        if (!alive) return;

        const list = Array.isArray(data) ? data : [];
        setTasks(list.map(normalizeTask));
      } catch (e) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load tasks");
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-[#1F2937] mb-1">Tasks</h1>
          <p className="text-[#6B7280]">{remainingCount} tasks remaining</p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setShowAddTask((v) => !v);
            setErr(null);
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Add Task Form */}
      {showAddTask ? (
        <Card padding="lg">
          <h2 className="text-xl text-[#1F2937] mb-4">New Task</h2>

          <div className="space-y-4">
            <Input
              placeholder="Task title..."
              value={newTask.title}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, title: e.target.value }))
              }
              autoFocus
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">Tag</label>
                <select
                  value={newTask.tag}
                  onChange={(e) =>
                    setNewTask((t) => ({ ...t, tag: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
                >
                  <option value="Work">Work</option>
                  <option value="School">School</option>
                  <option value="Creative">Creative</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((t) => ({ ...t, priority: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  Estimate
                </label>
                <select
                  value={newTask.estimate}
                  onChange={(e) =>
                    setNewTask((t) => ({ ...t, estimate: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
                >
                  <option value="30m">30 min</option>
                  <option value="60m">60 min</option>
                  <option value="90m">90 min</option>
                  <option value="120m">120 min</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleAddTask}>
                Add Task
              </Button>
              <Button variant="secondary" onClick={() => setShowAddTask(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Search and Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[rgba(31,41,55,0.08)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {tags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                active={activeFilter === tag}
                onClick={() => setActiveFilter(tag)}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <Card padding="md">
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-[#6B7280]">Loading…</div>
          ) : err ? (
            <div className="text-center py-12 text-red-600">{err}</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-[#6B7280]">
              No tasks found
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#FAF7F2] transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task.id)}
                  className="w-5 h-5 rounded-lg border-2 border-[rgba(31,41,55,0.2)] checked:bg-[#E07A5F] checked:border-[#E07A5F] cursor-pointer flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div
                    className={[
                      "text-[#1F2937] mb-1",
                      task.completed ? "line-through text-[#6B7280]" : "",
                    ].join(" ")}
                  >
                    {task.title}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <TagChip label={task.tag} />
                    <span
                      className={`text-sm ${priorityColors[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-sm text-[#6B7280]">
                      {task.estimate}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#6B7280] hover:text-red-600 transition-all p-2 flex-shrink-0"
                  aria-label="Delete task"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 5L15 15M15 5L5 15" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
