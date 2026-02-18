import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Mail, Lock, Chrome } from "lucide-react";
import { supabase } from "../supabaseClient";

export function SignIn() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    nav("/");
  };

  const handleGoogleSignIn = () => {
    // TODO: replace with real OAuth later
    console.log("Sign in with Google");
    nav("/");
  };

  const handleResetPassword = () => {
    console.log("Reset password for:", resetEmail);
    setShowForgotPassword(false);
    setResetEmail("");
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
            <p className="text-[#6B7280]">Welcome back</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[rgba(31,41,55,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[#E07A5F] hover:text-[#d66b53] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button variant="primary" className="w-full" type="submit">
              Sign In
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
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-[rgba(31,41,55,0.1)] rounded-2xl hover:bg-[#FAF7F2] transition-all text-[#1F2937]"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-[#6B7280]">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-[#E07A5F] hover:text-[#d66b53] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        title="Reset Password"
        onSubmit={handleResetPassword}
        submitText="Send Reset Link"
      >
        <div className="space-y-4">
          <p className="text-[#6B7280]">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
          <div>
            <label className="block text-sm text-[#1F2937] mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 bg-white border border-[rgba(31,41,55,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
