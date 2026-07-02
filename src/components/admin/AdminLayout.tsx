import { Link, useNavigate, useRouterState, getRouteApi } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { signOutUser } from "@/lib/firebase/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

const adminRoute = getRouteApi("/_authenticated/admin");

const NAV = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/publications", label: "Publications" },
  { to: "/admin/comments", label: "Comments" },
  { to: "/admin/pulse", label: "Reader pulse" },
  { to: "/admin/stats", label: "Stats" },
  { to: "/admin/quotes", label: "Quotes", adminOnly: true },
  { to: "/admin/subscribers", label: "Subscribers" },
  { to: "/admin/inquiries", label: "Inquiries", adminOnly: true },
  { to: "/admin/users", label: "Users", adminOnly: true },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = adminRoute.useRouteContext();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await signOutUser();
    nav({ to: "/admin/login", replace: true });
  }

  function isActive(to: string, exact?: boolean) {
    if (to === "/admin/publications" && pathname.startsWith("/admin/editor")) return true;
    if (exact) return pathname === to;
    return pathname === to || pathname.startsWith(`${to}/`);
  }

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-divider h-full">
        <div className="px-5 py-6 border-b border-divider">
          <Link to="/" className="block">
            <span className="pub-number">Editorial Desk</span>
            <span className="font-serif text-xl mt-1 block">The Timba Papers</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin).map(
            (item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 text-sm rounded transition-colors ${
                isActive(item.to, "exact" in item ? item.exact : undefined)
                  ? "bg-surface text-gold border border-divider"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ),
          )}
        </nav>
        <div className="px-3 py-4 border-t border-divider space-y-1">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wider">Theme</span>
            <ThemeToggle />
          </div>
          <Link
            to="/admin/editor/$id"
            params={{ id: "new" }}
            className="block px-3 py-2 text-sm text-gold hover:bg-surface rounded transition-colors"
          >
            + New publication
          </Link>
          <Link
            to="/"
            className="block px-3 py-2 text-sm text-text-secondary hover:text-foreground rounded transition-colors"
          >
            View site
          </Link>
          <button
            onClick={signOut}
            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-foreground rounded transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="md:hidden shrink-0 border-b border-divider px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/admin" className="font-serif text-lg">
            Admin
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <ThemeToggle className="size-8" />
            <Link to="/admin/publications" className="text-text-secondary">
              Publications
            </Link>
            <Link to="/admin/comments" className="text-text-secondary">
              Comments
            </Link>
            <Link to="/admin/pulse" className="text-text-secondary">
              Pulse
            </Link>
            <Link to="/admin/stats" className="text-text-secondary">
              Stats
            </Link>
            <Link to="/admin/subscribers" className="text-text-secondary">
              Subscribers
            </Link>
            {isAdmin && (
              <Link to="/admin/quotes" className="text-text-secondary">
                Quotes
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/inquiries" className="text-text-secondary">
                Inquiries
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/users" className="text-text-secondary">
                Users
              </Link>
            )}
            <button onClick={signOut} className="text-text-secondary">
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-divider pb-6 mb-8">
      <div>
        <div className="pub-number">Admin</div>
        <h1 className="mt-2 font-serif text-3xl lg:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 text-text-secondary text-sm max-w-xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
