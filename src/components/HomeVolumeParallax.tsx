import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ParallaxLayers = {
  bg: number;
  label: number;
  title: number;
  body: number;
  cta: number;
};

const ZERO_LAYERS: ParallaxLayers = { bg: 0, label: 0, title: 0, body: 0, cta: 0 };

function ParallaxLayer({
  offset,
  className,
  children,
}: {
  offset: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      style={{ transform: `translate3d(0, ${offset}px, 0)` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function HomeScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("home-scroll-reveal", visible && "is-visible", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function HomeVolumeParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const [layers, setLayers] = useState<ParallaxLayers>(ZERO_LAYERS);
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    setMotionEnabled(true);
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      const progress = (viewHeight - rect.top) / (viewHeight + rect.height);
      const p = Math.max(0, Math.min(1, progress));
      const shift = (p - 0.5) * Math.min(rect.height, 520);

      setLayers({
        bg: shift * 0.18,
        label: shift * 0.08,
        title: shift * -0.1,
        body: shift * -0.16,
        cta: shift * -0.22,
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.visualViewport?.addEventListener("scroll", onScroll);
    window.visualViewport?.addEventListener("resize", onScroll);
    update();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, true);
      window.visualViewport?.removeEventListener("scroll", onScroll);
      window.visualViewport?.removeEventListener("resize", onScroll);
    };
  }, []);

  const layer = motionEnabled ? layers : ZERO_LAYERS;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-surface border-b border-divider"
    >
      <ParallaxLayer
        offset={layer.bg}
        className="pointer-events-none absolute inset-0 select-none will-change-transform"
      >
        <div
          className="absolute -right-6 md:right-8 top-1/2 -translate-y-1/2 font-serif text-[11rem] md:text-[20rem] leading-none text-gold/[0.07]"
          aria-hidden
        >
          I
        </div>
        <div
          className="absolute left-[8%] top-[18%] h-px w-24 md:w-40 bg-gold/25"
          aria-hidden
        />
        <div
          className="absolute right-[20%] bottom-[22%] h-24 md:h-32 w-px bg-divider/80"
          aria-hidden
        />
      </ParallaxLayer>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-12 md:py-16 grid md:grid-cols-3 gap-8 items-start">
        <ParallaxLayer offset={layer.label} className="will-change-transform">
          <HomeScrollReveal delay={0}>
            <div className="pub-number">The Timba Papers</div>
          </HomeScrollReveal>
        </ParallaxLayer>

        <div className="md:col-span-2 space-y-0">
          <ParallaxLayer offset={layer.title} className="will-change-transform">
            <HomeScrollReveal delay={100}>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight">
                Volume I (2025–2026) — Democracy, Constitutionalism and the Future of Zimbabwe
              </h2>
            </HomeScrollReveal>
          </ParallaxLayer>

          <ParallaxLayer offset={layer.body} className="will-change-transform">
            <HomeScrollReveal delay={180}>
              <p className="mt-4 text-text-secondary leading-relaxed max-w-2xl">
                A coherent body of essays, policy papers and speeches addressing the architecture of
                legitimate authority, the political economy of patience, and Africa&apos;s position in a
                multipolar world.
              </p>
            </HomeScrollReveal>
          </ParallaxLayer>

          <ParallaxLayer offset={layer.cta} className="will-change-transform">
            <HomeScrollReveal delay={260}>
              <Link
                to="/papers"
                className="mt-6 inline-flex items-center gap-2 text-gold text-sm uppercase tracking-wider"
              >
                Browse the archive →
              </Link>
            </HomeScrollReveal>
          </ParallaxLayer>
        </div>
      </div>
    </section>
  );
}
