import { useEffect, useRef, type ElementType, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Split = "words" | "chars" | "lines";

interface Props {
  text: string;
  as?: ElementType;
  split?: Split;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;
  duration?: number;
  start?: string;
  blur?: boolean;
  y?: number;
  clip?: boolean;
}

export function AnimatedText({
  text,
  as: Tag = "span",
  split = "words",
  className,
  style,
  delay = 0,
  stagger = 0.05,
  duration = 1,
  start = "top 85%",
  blur = true,
  y = 100,
  clip = true,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-anim-item]"));
    if (!items.length) return;
    if (reduce) {
      gsap.set(items, { opacity: 1, y: 0, filter: "none" });
      return;
    }
    const fromY = isMobile ? Math.min(y, 40) : y;
    const useBlur = blur && !isMobile;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        {
          yPercent: fromY,
          opacity: 0,
          filter: useBlur ? "blur(10px)" : "blur(0px)",
        },
        {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration,
          ease: "power3.out",
          stagger,
          delay,
          scrollTrigger: { trigger: el, start },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [text, split, delay, stagger, duration, start, blur, y]);

  const tokens =
    split === "chars"
      ? Array.from(text).map((c) => (c === " " ? "\u00A0" : c))
      : split === "lines"
        ? text.split("\n")
        : text.split(/(\s+)/);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      className={className}
      style={style}
      aria-label={text}
    >
      {tokens.map((tok, i) => {
        if (split === "words" && /^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: "inline-block",
              overflow: clip ? "hidden" : "visible",
              verticalAlign: "baseline",
              ...(split === "lines" ? { display: "block" } : null),
            }}
          >
            <span
              data-anim-item
              style={{ 
                display: "inline-block", 
                willChange: clip ? "transform,opacity,filter" : "auto",
                padding: !clip ? "0 0.8em" : undefined,
                margin: !clip ? "0 -0.8em" : undefined,
              }}
            >
              {tok === "" ? "\u00A0" : tok}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
