import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { User, Volume2, Bell, Palette, Download } from "lucide-react";
import { apiFetch } from "../api";
import { supabase } from "../supabaseClient";

function initialsFromNameOrEmail(displayName, realName, email) {
  const base = (displayName || realName || "").trim();

  if (base) {
    const parts = base.split(/\s+/).filter(Boolean);
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b || a || "U").slice(0, 2);
  }

  if (email) return email[0].toUpperCase();
  return "U";
}

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // profile
  const [email, setEmail] = useState("");
  const [realName, setRealName] = useState(""); // Supabase provider name (read-only)
  const [displayName, setDisplayName] = useState(""); // editable, stored in DB

  // settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState("light");

  const avatarInitials = useMemo(
    () => initialsFromNameOrEmail(displayName, realName, email),
    [displayName, realName, email],
  );

  async function loadAll() {
    setLoading(true);
    setErr(null);

    try {
      const sessionRes = await supabase.auth.getSession();
      const sUser = sessionRes?.data?.session?.user;

      const supabaseFullName =
        sUser?.user_metadata?.full_name || sUser?.user_metadata?.name || "";

      const [me, settings] = await Promise.all([
        apiFetch("/me"),
        apiFetch("/settings"),
      ]);

      setEmail(me?.email ?? sUser?.email ?? "");
      setRealName(supabaseFullName);
      setDisplayName(me?.name ?? "");

      setSoundEnabled(Boolean(settings?.sound_enabled ?? true));
      setNotificationsEnabled(Boolean(settings?.notifications_enabled ?? true));
      setTheme(settings?.theme ?? "light");
    } catch (e) {
      setErr(e?.message ?? "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveAll() {
    setErr(null);
    try {
      const [updatedMe, updatedSettings] = await Promise.all([
        apiFetch("/me", {
          method: "PATCH",
          body: JSON.stringify({ name: displayName }),
        }),
        apiFetch("/settings", {
          method: "PATCH",
          body: JSON.stringify({
            sound_enabled: soundEnabled,
            notifications_enabled: notificationsEnabled,
            theme,
          }),
        }),
      ]);

      setDisplayName(updatedMe?.name ?? "");

      setSoundEnabled(Boolean(updatedSettings?.sound_enabled));
      setNotificationsEnabled(Boolean(updatedSettings?.notifications_enabled));
      setTheme(updatedSettings?.theme ?? "light");
    } catch (e) {
      setErr(e?.message ?? "Failed to save settings");
    }
  }

  const handleExportData = () => {
    const data = {
      exported: new Date().toISOString(),
      settings: {
        sound: soundEnabled,
        notifications: notificationsEnabled,
        theme,
      },
      profile: { displayName, realName, email },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "focus-os-data.json";
    a.click();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-[#6B7280]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl text-[#1F2937] mb-1">Settings</h1>
        <p className="text-[#6B7280]">Manage your preferences and account</p>
        {err ? <p className="text-red-600 mt-2">{err}</p> : null}
      </div>

      <Card padding="lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#F2E9E4] rounded-xl">
            <User className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-[#1F2937] mb-1">Profile</h2>
            <p className="text-sm text-[#6B7280]">
              Real name comes from Supabase. Display name is your app name.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#F2E9E4] flex items-center justify-center text-[#E07A5F] text-2xl flex-shrink-0">
              {avatarInitials}
            </div>

            <Button variant="secondary" size="sm" disabled>
              Change Avatar (soon)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Real name (Supabase)" value={realName} disabled />
            <Input label="Email" type="email" value={email} disabled />

            <Input
              label="Display name (Focus OS)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Optional (ex: Joe)"
            />
          </div>

          <Button variant="primary" onClick={saveAll}>
            Save Settings
          </Button>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#F2E9E4] rounded-xl">
            <Volume2 className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-[#1F2937] mb-1">Sound</h2>
            <p className="text-sm text-[#6B7280]">Configure audio feedback</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-[#FAF7F2] transition-colors">
            <div>
              <p className="text-[#1F2937] mb-1">Timer Sounds</p>
              <p className="text-sm text-[#6B7280]">
                Play sound when timer starts/ends
              </p>
            </div>

            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className={`w-14 h-8 rounded-full transition-all relative ${
                soundEnabled ? "bg-[#E07A5F]" : "bg-[#D1D5DB]"
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                  soundEnabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#F2E9E4] rounded-xl">
            <Bell className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-[#1F2937] mb-1">Notifications</h2>
            <p className="text-sm text-[#6B7280]">
              Manage notification preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-[#FAF7F2] transition-colors">
            <div>
              <p className="text-[#1F2937] mb-1">Desktop Notifications</p>
              <p className="text-sm text-[#6B7280]">
                Get notified about session updates
              </p>
            </div>

            <button
              onClick={() => setNotificationsEnabled((v) => !v)}
              className={`w-14 h-8 rounded-full transition-all relative ${
                notificationsEnabled ? "bg-[#E07A5F]" : "bg-[#D1D5DB]"
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                  notificationsEnabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#F2E9E4] rounded-xl">
            <Palette className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-[#1F2937] mb-1">Appearance</h2>
            <p className="text-sm text-[#6B7280]">
              Customize the look and feel
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#6B7280] mb-3">Theme</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setTheme("light")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  theme === "light"
                    ? "border-[#E07A5F] bg-[#FAF7F2]"
                    : "border-[rgba(31,41,55,0.08)] hover:border-[#E07A5F]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-[rgba(31,41,55,0.08)]" />
                  <div className="text-left">
                    <p className="text-[#1F2937]">Light</p>
                    <p className="text-sm text-[#6B7280]">
                      {theme === "light" ? "Selected" : " "}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTheme("dark")}
                disabled
                className="p-4 rounded-xl border-2 border-[rgba(31,41,55,0.08)] opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#1F2937]" />
                  <div className="text-left">
                    <p className="text-[#1F2937]">Dark</p>
                    <p className="text-sm text-[#6B7280]">Coming soon</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-4">
              <Button variant="primary" onClick={saveAll}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#F2E9E4] rounded-xl">
            <Download className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-[#1F2937] mb-1">Data Export</h2>
            <p className="text-sm text-[#6B7280]">Download your data as JSON</p>
          </div>
        </div>

        <Button variant="secondary" onClick={handleExportData}>
          <Download className="w-5 h-5 mr-2" />
          Export Data
        </Button>
      </Card>
    </div>
  );
}
