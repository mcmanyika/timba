import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { AdminAuthShell, adminInputCls, adminSubmitCls } from "@/components/AdminAuthShell";
import { signUp } from "@/lib/firebase/auth";

export function AdminRegisterForm() {
  const nav = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      await router.invalidate();
      await nav({ to: "/admin", replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      title="Create account"
      description="Register for an editor account. An administrator must grant access before you can manage content."
      footer={
        <p>
          Already have an account?{" "}
          <Link to="/admin/login" className="text-gold hover:underline">
            Sign in →
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
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className={adminInputCls}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className={adminInputCls}
        />
        {err && <p className="text-destructive text-sm">{err}</p>}
        <button type="submit" disabled={loading} className={adminSubmitCls}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-xs text-text-secondary">
        New accounts cannot publish until a role is added in the Firestore{" "}
        <code>userRoles</code> collection.
      </p>
    </AdminAuthShell>
  );
}
