import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  PERSPECTIVE_LABELS,
  submitArticlePulse,
  type PerspectiveChange,
} from "@/lib/firebase/article-pulse";
import { hasReachedScrollThreshold } from "@/lib/scroll-progress";
import {
  getOrCreateVisitorId,
  hasDismissedArticlePulse,
  hasSubmittedArticlePulse,
  markArticlePulseDismissed,
  markArticlePulseSubmitted,
} from "@/lib/visitor-id";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 0.72;

const choiceBtn =
  "border px-3 py-2 text-xs uppercase tracking-wider transition-colors disabled:opacity-50";

export function ArticleReadPulse({
  publicationId,
  publicationSlug,
  publicationTitle,
}: {
  publicationId: string;
  publicationSlug: string;
  publicationTitle: string;
}) {
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perspective, setPerspective] = useState<PerspectiveChange | null>(null);
  const [recommend, setRecommend] = useState<number | null>(null);
  const [missingNote, setMissingNote] = useState("");

  const skipped =
    hasSubmittedArticlePulse(publicationId) || hasDismissedArticlePulse(publicationId);

  useEffect(() => {
    if (skipped || open || done) return;

    function trigger() {
      setOpen(true);
    }

    function checkScroll() {
      if (hasReachedScrollThreshold(SCROLL_THRESHOLD)) {
        trigger();
      }
    }

    const sentinel = sentinelRef.current;
    let observer: IntersectionObserver | undefined;

    if (sentinel && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            trigger();
          }
        },
        { root: null, threshold: 0, rootMargin: "0px 0px -12% 0px" },
      );
      observer.observe(sentinel);
    }

    window.addEventListener("scroll", checkScroll, { passive: true });
    document.addEventListener("scroll", checkScroll, { passive: true, capture: true });
    window.visualViewport?.addEventListener("scroll", checkScroll);
    window.visualViewport?.addEventListener("resize", checkScroll);

    checkScroll();
    const retry = window.setInterval(checkScroll, 800);
    const stopRetry = window.setTimeout(() => window.clearInterval(retry), 12_000);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", checkScroll);
      document.removeEventListener("scroll", checkScroll, true);
      window.visualViewport?.removeEventListener("scroll", checkScroll);
      window.visualViewport?.removeEventListener("resize", checkScroll);
      window.clearInterval(retry);
      window.clearTimeout(stopRetry);
    };
  }, [skipped, open, done]);

  function dismiss() {
    markArticlePulseDismissed(publicationId);
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!perspective || !recommend || !visitorId) {
      setError("Please answer both questions.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await submitArticlePulse({
        publication_id: publicationId,
        publication_slug: publicationSlug,
        publication_title: publicationTitle,
        visitor_id: visitorId,
        perspective_change: perspective,
        recommend,
        missing_note: missingNote,
      });
      markArticlePulseSubmitted(publicationId);
      setDone(true);
      setTimeout(() => setOpen(false), 2200);
    } catch (err) {
      console.error("Article pulse submit failed:", err);
      setError("Could not save your feedback. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full pointer-events-none" aria-hidden />

      {open && !skipped && (
        <div
          className="fixed z-[60] bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1.25rem,env(safe-area-inset-left))] right-[max(1.25rem,env(safe-area-inset-right))] md:left-auto md:right-24 md:max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300"
          role="dialog"
          aria-labelledby="read-pulse-title"
          aria-live="polite"
        >
          <div className="border border-divider bg-background shadow-lg p-5 md:p-6 max-h-[min(85dvh,640px)] overflow-y-auto overscroll-contain">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="pub-number">Reader pulse</div>
                <h2 id="read-pulse-title" className="mt-2 font-serif text-xl leading-snug">
                  {done ? "Thank you" : "You’ve read the piece"}
                </h2>
              </div>
              {!done && (
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-text-secondary hover:text-foreground transition-colors p-1 -m-1"
                  aria-label="Dismiss feedback"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {done ? (
              <p className="mt-3 text-sm text-text-secondary">
                Your anonymous feedback helps shape future essays and papers.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 space-y-5">
                <fieldset>
                  <legend className="text-sm text-foreground">
                    Did this change how you see the issue?
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Object.keys(PERSPECTIVE_LABELS) as PerspectiveChange[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPerspective(key)}
                        className={cn(
                          choiceBtn,
                          perspective === key
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-divider text-text-secondary hover:border-gold hover:text-gold",
                        )}
                      >
                        {PERSPECTIVE_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm text-foreground">Would you recommend it?</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRecommend(n)}
                        className={cn(
                          choiceBtn,
                          "min-w-10",
                          recommend === n
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-divider text-text-secondary hover:border-gold hover:text-gold",
                        )}
                        aria-label={`${n} out of 5`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="pulse-missing" className="text-sm text-foreground">
                    What’s missing? <span className="text-text-secondary">(optional)</span>
                  </label>
                  <textarea
                    id="pulse-missing"
                    value={missingNote}
                    onChange={(e) => setMissingNote(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="One line is enough…"
                    className="mt-2 w-full bg-background border border-divider px-3 py-2 text-sm text-foreground placeholder:text-text-secondary focus:outline-none focus:border-gold transition-colors resize-none"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={busy || !perspective || !recommend}
                  className="bg-gold text-background px-5 py-2.5 text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send feedback"}
                </button>

                <p className="text-xs text-text-secondary">Anonymous · one response per reader</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
