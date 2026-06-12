import { useEffect, useRef, useState } from "react";

interface Props {
  paragraphs: string[];
  className?: string;
  charDelay?: number; // ms per character
  paragraphPause?: number; // ms pause between paragraphs
}

/**
 * Typewriter effect that reveals text character by character.
 * Uses IntersectionObserver to start only when scrolled into view.
 * CSS-based – no GSAP dependency.
 */
export function TypewriterText({
  paragraphs,
  className = "",
  charDelay = 18,
  paragraphPause = 500,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<number[]>([]); // how many chars revealed per paragraph
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();
          runTyping();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [paragraphs]);

  function runTyping() {
    // Initialize all paragraphs to 0 revealed chars
    setVisible(paragraphs.map(() => 0));

    let pIdx = 0;
    let cIdx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    function next() {
      if (pIdx >= paragraphs.length) return;
      const para = paragraphs[pIdx];
      cIdx++;
      setVisible((prev) => {
        const next = [...prev];
        next[pIdx] = cIdx;
        return next;
      });

      if (cIdx < para.length) {
        timeout = setTimeout(next, charDelay);
      } else {
        // Move to next paragraph after a pause
        pIdx++;
        cIdx = 0;
        if (pIdx < paragraphs.length) {
          timeout = setTimeout(next, paragraphPause);
        }
      }
    }

    timeout = setTimeout(next, charDelay);
    return () => clearTimeout(timeout);
  }

  return (
    <div ref={ref} className={className}>
      {paragraphs.map((para, i) => {
        const revealedCount = visible[i] ?? 0;
        const shown = para.slice(0, revealedCount);
        const isCurrentPara = revealedCount > 0 && revealedCount < para.length;
        const isDone = revealedCount >= para.length;
        const isNextPending = !isDone && i === (visible.findIndex((v, idx) => v < paragraphs[idx]?.length && v > 0));

        return (
          <p
            key={i}
            className="block min-h-[1.6em]"
            aria-label={para}
          >
            <span aria-hidden="true">
              {shown}
              {(isCurrentPara || (!isDone && revealedCount === 0 && i === visible.findIndex((v, idx) => v > 0 && v < paragraphs[idx]?.length) + 1)) && (
                <span className="inline-block w-[2px] h-[1.1em] bg-gold/70 ml-[1px] align-middle animate-[blink_0.8s_step-end_infinite]" aria-hidden />
              )}
            </span>
          </p>
        );
      })}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
