"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { login } from "@/app/actions";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="minimal-card p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-1 text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to Buddy Matching Game
            </p>

            {/* Faculty color dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-[var(--color-faculty-eng)]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-faculty-sci)]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-faculty-pharm)]" />
            </div>
          </div>

          {/* Messages */}
          {registered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 text-green-700 px-4 py-3 rounded-md mb-6 text-sm border border-green-100"
            >
              Successfully registered! Please log in.
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6 text-sm border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Student ID
              </label>
              <input
                name="studentId"
                type="text"
                maxLength={10}
                required
                placeholder="6xxxxxxxxx"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="password"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full minimal-btn bg-primary text-primary-foreground py-2.5 text-sm disabled:opacity-50 mt-2 flex items-center justify-center"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Register link */}
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-foreground hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-sm font-medium text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
