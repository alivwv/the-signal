"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@prt.iq")) {
      setError("Only @prt.iq emails are allowed.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Check your email</h2>
        <p className="text-sm text-txt2">
          We sent a confirmation link to <strong>{email}</strong>. Click the
          link to activate your account.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 text-sm text-teal font-medium hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold mb-4">Create account</h2>

      {error && (
        <div className="text-sm text-bad bg-[#FFEBEE] rounded-[var(--radius-sm)] p-3 mb-4">
          {error}
        </div>
      )}

      <label className="block text-sm font-medium mb-1" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border border-border rounded-[var(--radius-sm)] px-3 py-2 text-sm mb-3"
        placeholder="you@prt.iq"
      />

      <label className="block text-sm font-medium mb-1" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="w-full border border-border rounded-[var(--radius-sm)] px-3 py-2 text-sm mb-3"
        placeholder="Min 8 characters"
      />

      <label
        className="block text-sm font-medium mb-1"
        htmlFor="confirm-password"
      >
        Confirm password
      </label>
      <input
        id="confirm-password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        className="w-full border border-border rounded-[var(--radius-sm)] px-3 py-2 text-sm mb-4"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal text-white font-semibold text-sm py-2.5 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>

      <p className="text-sm text-txt2 text-center mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-teal font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
