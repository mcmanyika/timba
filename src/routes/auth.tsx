import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Editor Sign In — The Timba Papers" }] }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin + "/admin" },
          });
    setLoading(false);
    if (res.error) {
      setErr(res.error.message);
      return;
    }
    nav({ to: "/admin" });
  }

  return (
    <SiteShell>
      <div className="max-w-md mx-auto px-6 py-24">
        <div className="pub-number">Editor</div>
        <h1 className="mt-3 font-serif text-4xl">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-3 text-text-secondary text-sm">
          Admin access for managing publications and subscribers.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface border border-divider px-4 py-3 focus:outline-none focus:border-gold"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-surface border border-divider px-4 py-3 focus:outline-none focus:border-gold"
          />
          {err && <p className="text-destructive text-sm">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-background px-6 py-3 font-medium uppercase tracking-wider text-xs disabled:opacity-60"
          >
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-text-secondary hover:text-gold"
        >
          {mode === "signin" ? "Need an account? Create one →" : "Already have an account? Sign in →"}
        </button>
        <p className="mt-8 text-xs text-text-secondary">
          New accounts have no admin privileges until granted by a database admin.
        </p>
      </div>
    </SiteShell>
  );
}