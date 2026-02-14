import React, { useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { User, Volume2, Bell, Palette, Download } from "lucide-react";

export function Settings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState("light");
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");

  const handleExportData = () => {
    const data = {
      exported: new Date().toISOString(),
      settings: {
        sound: soundEnabled,
        notifications: notificationsEnabled,
        theme,
      },
      profile: { name, email },
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl text-[#1F2937] mb-1">Settings</h1>
        <p className="text-[#6B7280]">Manage your preferences and account</p>
      </div>

      {/* Profile Section */}
      <Card padding="lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#F2E9E4] rounded-xl">
            <User className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-[#1F2937] mb-1">Profile</h2>
            <p className="text-sm text-[#6B7280]">
              Update your personal information
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#F2E9E4] flex items-center justify-center text-[#E07A5F] text-2xl flex-shrink-0">
              JD
            </div>
            <Button variant="secondary" size="sm">
              Change Avatar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button variant="primary">Save Changes</Button>
        </div>
      </Card>

      {/* Sound Settings */}
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
              onClick={() => setSoundEnabled(!soundEnabled)}
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

      {/* Notifications */}
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
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
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

      {/* Theme */}
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
                    <p className="text-sm text-[#6B7280]">Current theme</p>
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
          </div>
        </div>
      </Card>

      {/* Data Export */}
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
