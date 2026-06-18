import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AdminAuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-divider">
        <div className="max-w-md mx-auto px-6 py-6">
          <Link to="/" className="flex flex-col leading-none">
            <span className="pub-number">Editorial Desk</span>
            <span className="font-serif text-2xl mt-1">The Timba Papers</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="pub-number">Admin</div>
          <h1 className="mt-3 font-serif text-4xl">{title}</h1>
          <p className="mt-3 text-text-secondary text-sm">{description}</p>
          {children}
        </div>
      </main>

      <footer className="border-t border-divider">
        <div className="max-w-md mx-auto px-6 py-6 text-xs text-text-secondary space-y-3">
          {footer}
          <Link to="/" className="inline-block hover:text-gold transition-colors">
            ← Back to the site
          </Link>
        </div>
      </footer>
    </div>
  );
}

export const adminInputCls =
  "w-full bg-surface border border-divider px-4 py-3 focus:outline-none focus:border-gold";

export const adminSubmitCls =
  "w-full bg-gold text-background px-6 py-3 font-medium uppercase tracking-wider text-xs disabled:opacity-60 hover:bg-gold/90 transition-colors";
