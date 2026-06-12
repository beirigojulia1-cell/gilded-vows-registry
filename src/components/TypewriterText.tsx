import { useEffect, useRef } from "react";

interface Props {
  paragraphs: string[];
  className?: string;
  charDelay?: number; // ms per character
  paragraphPause?: number; // ms pause between paragraphs
  startDelay?: number; // initial delay before starting typing
}

/**
 * Typewriter effect that reveals text character by character.
 * Uses IntersectionObserver to start only when scrolled into view.
 * CSS-based – no GSAP dependency. Highly optimized with direct DOM updates.
 */
export function TypewriterText({
  paragraphs,
  className = "",
  charDelay = 18,
  paragraphPause = 500,
  startDelay = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const started = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount or re-render
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // Reset typing state if paragraphs change
    started.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Reset all texts to empty initially
    pRefs.current.forEach(span => {
      if (span) span.textContent = "";
    });

    const el = containerRef.current;
    if (!el) return;

    function runTyping() {
      let pIdx = 0;
      let cIdx = 0;

      function next() {
        if (pIdx >= paragraphs.length) return;
        const para = paragraphs[pIdx];
        cIdx++;
        
        const span = pRefs.current[pIdx];
        if (span) {
          span.textContent = para.slice(0, cIdx);
        }

        if (cIdx < para.length) {
          timeoutRef.current = setTimeout(next, charDelay);
        } else {
          // Move to next paragraph after a pause
          pIdx++;
          cIdx = 0;
          if (pIdx < paragraphs.length) {
            timeoutRef.current = setTimeout(next, paragraphPause);
          }
        }
      }
      
      timeoutRef.current = setTimeout(next, charDelay);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();
          if (startDelay > 0) {
            timeoutRef.current = setTimeout(runTyping, startDelay);
          } else {
            runTyping();
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    
    return () => observer.disconnect();
  }, [paragraphs, charDelay, paragraphPause, startDelay]);

  return (
    <div ref={containerRef} className={className}>
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className="block min-h-[1.6em]"
          aria-label={para}
        >
          <span 
            ref={(el) => { pRefs.current[i] = el; }} 
            aria-hidden="true" 
          />
        </p>
      ))}
    </div>
  );
}
