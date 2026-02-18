import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Mail, Lock, User, Chrome } from "lucide-react";
import { supabase } from "../supabaseClient";

export function SignUp() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // saves name in user metadata
      },
    });

    if (error) {
      setPasswordError(error.message);
      return;
    }

    // If email confirmations are ON, session might be null until confirmed.
    // We'll send them to sign in either way.
    nav("/signin");
  };

  const handleGoogleSignUp = () => {
    console.log("Sign up with Google");
    nav("/");
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E07A5F] rounded-2xl mb-4">
              <span className="text-3xl">🍊</span>
            </div>
            <h1 className="text-2xl text-[#1F2937] mb-2">Focus Fruit</h1>
            <p className="text-[#6B7280]">Create your account</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm text-[#1F2937] mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[rgba(31,41,55,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#1F2937] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[rgba(31,41,55,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#1F2937] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[rgba(31,41,55,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#1F2937] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[rgba(31,41,55,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                  required
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 -mt-2">{passwordError}</p>
            )}

            <Button variant="primary" className="w-full mt-6" type="submit">
              Create Account
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(31,41,55,0.1)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#6B7280]">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-[rgba(31,41,55,0.1)] rounded-2xl hover:bg-[#FAF7F2] transition-all text-[#1F2937]"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-[#6B7280]">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-[#E07A5F] hover:text-[#d66b53] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#9CA3AF] px-8">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
