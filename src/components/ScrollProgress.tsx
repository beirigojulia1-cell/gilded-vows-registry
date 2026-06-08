import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { scaleX: 0, transformOrigin: "left center" });
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => gsap.to(el, { scaleX: self.progress, duration: 0.15, ease: "none", overwrite: true }),
    });
    return () => st.kill();
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed top-0 left-0 right-0 h-px z-[60] pointer-events-none"
      style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }}
    />
  );
}
