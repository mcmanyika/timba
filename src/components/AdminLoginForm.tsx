import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AdminAuthShell, adminInputCls, adminSubmitCls } from "@/components/AdminAuthShell";
import { signIn } from "@/lib/firebase/auth";

function authErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Authentication failed";
  if (error.message.includes("INTERNAL ASSERTION FAILED")) {
    return "Connection error — please try signing in again.";
  }
  return error.message;
}

export function AdminLoginForm() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await signIn(email, password);
      await nav({ to: "/admin", replace: true });
    } catch (error) {
      setErr(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      title="Sign in"
      description="Sign in to manage publications and subscribers."
      footer={
        <p>
          No account?{" "}
          <Link to="/admin/register" className="text-gold hover:underline">
            Create one →
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={adminInputCls}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className={adminInputCls}
        />
        {err && <p className="text-destructive text-sm">{err}</p>}
        <button type="submit" disabled={loading} className={adminSubmitCls}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AdminAuthShell>
  );
}
