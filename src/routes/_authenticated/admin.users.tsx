import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import {
  listAdminUsers,
  setUserAccessLevel,
  type AccessLevel,
} from "@/lib/firebase/users";

const authRoute = getRouteApi("/_authenticated");
const adminRoute = getRouteApi("/_authenticated/admin");

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) throw redirect({ to: "/admin" });
  },
  component: AdminUsers,
});

const ACCESS_OPTIONS: { value: AccessLevel; label: string }[] = [
  { value: "none", label: "No access" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

const selectCls =
  "w-full max-w-[10rem] bg-surface border border-divider px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold";

function AdminUsers() {
  const { user } = authRoute.useRouteContext();
  const { userEmail } = adminRoute.useRouteContext();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: listAdminUsers,
  });

  const updateAccess = useMutation({
    mutationFn: ({ userId, level }: { userId: string; level: AccessLevel }) =>
      setUserAccessLevel(userId, level),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update access");
    },
  });

  function onAccessChange(userId: string, level: AccessLevel, current: AccessLevel) {
    if (level === current) return;
    if (userId === user.uid && current === "admin" && level !== "admin") {
      setError("You cannot remove your own admin access.");
      return;
    }
    updateAccess.mutate({ userId, level });
  }

  return (
    <>
      <AdminPageHeader
        title={`${data?.length ?? 0} users`}
        description="Grant editor or admin access to registered accounts."
      />

      {error && <p className="mb-6 text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <p className="text-text-secondary text-sm">Loading users…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-text-secondary uppercase tracking-wider text-xs">
            <tr>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Registered</th>
              <th className="py-3">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {(data ?? []).map((row) => {
              const isSelf = row.id === user.uid;
              const email = row.email || (isSelf ? userEmail : "—");
              return (
                <tr key={row.id}>
                  <td className="py-3 pr-4">
                    {email}
                    {isSelf && (
                      <span className="ml-2 text-xs text-text-secondary">(you)</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3">
                    <select
                      value={row.accessLevel}
                      disabled={updateAccess.isPending}
                      onChange={(e) =>
                        onAccessChange(
                          row.id,
                          e.target.value as AccessLevel,
                          row.accessLevel,
                        )
                      }
                      className={selectCls}
                      aria-label={`Access level for ${email}`}
                    >
                      {ACCESS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {(data?.length ?? 0) === 0 && !isLoading && (
        <p className="text-text-secondary text-sm">
          No users yet. Accounts appear here after they register.
        </p>
      )}
    </>
  );
}
