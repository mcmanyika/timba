import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/papers", label: "The Papers" },
  { to: "/policy", label: "Policy" },
  { to: "/speeches", label: "Speeches" },
  { to: "/books", label: "Books" },
  { to: "/media", label: "Media" },
  { to: "/about", label: "About" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-divider">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between gap-6">
        <Link to="/" className="flex flex-col leading-none">
          <span className="pub-number">Volume I · 2025–2026</span>
          <span className="font-serif text-2xl md:text-3xl mt-1">The Timba Papers</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-text-secondary hover:text-gold transition-colors"
              activeProps={{ className: "text-gold" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="md:hidden border-t border-divider">
        <div className="max-w-7xl mx-auto px-6 py-3 flex gap-5 overflow-x-auto text-sm">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="whitespace-nowrap text-text-secondary hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-divider">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid gap-10 md:grid-cols-3 text-sm">
        <div>
          <div className="pub-number mb-3">Colophon</div>
          <p className="text-text-secondary leading-relaxed max-w-sm">
            The Timba Papers publishes essays, policy papers, speeches and commentary
            by Jameson Timba on democracy, constitutionalism, and political economy —
            with a focus on Zimbabwe and Africa.
          </p>
        </div>
        <div>
          <div className="pub-number mb-3">Sections</div>
          <ul className="space-y-2">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-foreground hover:text-gold">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="pub-number mb-3">Editorial</div>
          <p className="text-text-secondary">
            © {new Date().getFullYear()} Jameson Timba.
            <br />
            All rights reserved.
          </p>
          <Link to="/auth" className="inline-block mt-4 text-text-secondary hover:text-gold text-xs">
            Editor sign in →
          </Link>
        </div>
      </div>
    </footer>
  );
}