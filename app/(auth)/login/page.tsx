"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold mb-4">Sign in</h2>

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
        className="w-full border border-border rounded-[var(--radius-sm)] px-3 py-2 text-sm mb-4"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal text-white font-semibold text-sm py-2.5 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-sm text-txt2 text-center mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-teal font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
