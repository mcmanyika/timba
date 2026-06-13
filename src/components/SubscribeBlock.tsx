import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  first_name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
});

export function SubscribeBlock({ variant = "panel" }: { variant?: "panel" | "inline" }) {
  const [first, setFirst] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ first_name: first, email });
    if (!parsed.success) {
      setState("error");
      setMsg(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setState("loading");
    const { error } = await supabase.from("subscribers").insert({
      first_name: parsed.data.first_name,
      email: parsed.data.email.toLowerCase(),
      source: typeof window !== "undefined" ? window.location.pathname : null,
    });
    if (error) {
      setState("error");
      setMsg(
        error.code === "23505"
          ? "You're already on the list — thank you."
          : "Something went wrong. Please try again.",
      );
      return;
    }
    setState("done");
    setMsg("Thank you. You'll receive future essays, speeches and papers.");
    setFirst("");
    setEmail("");
  }

  const wrap =
    variant === "panel"
      ? "border border-divider bg-surface p-8 md:p-12"
      : "border-t border-divider pt-10";

  return (
    <section className={wrap}>
      <div className="pub-number">Subscribe</div>
      <h3 className="mt-3 font-serif text-2xl md:text-3xl max-w-2xl">
        Receive future essays, speeches and policy papers from Jameson Timba.
      </h3>
      <p className="mt-3 text-text-secondary max-w-xl text-sm">
        Delivered occasionally. No advertising. Unsubscribe at any time.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl">
        <input
          aria-label="First name"
          placeholder="First name"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          className="flex-1 bg-background border border-divider px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:border-gold transition-colors"
        />
        <input
          aria-label="Email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-[2] bg-background border border-divider px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:border-gold transition-colors"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="bg-gold text-background px-6 py-3 font-medium uppercase tracking-wider text-xs hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {state === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {msg && (
        <p className={`mt-4 text-sm ${state === "error" ? "text-destructive" : "text-gold"}`}>
          {msg}
        </p>
      )}
    </section>
  );
}