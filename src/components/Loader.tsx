import { useEffect, useState } from "react";

export function Loader() {
  const [progress, setProgress] = useState(8);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let p = 8;
    let raf = 0;
    const start = performance.now();
    const MAX = 1200;

    const finish = () => {
      setProgress(100);
      setTimeout(() => setDone(true), 300);
    };

    const tick = () => {
      const elapsed = performance.now() - start;
      const ready = document.readyState === "complete";
      // gentle ease toward 90, jump to 100 when ready or cap reached
      p += (90 - p) * 0.06;
      setProgress(p);
      if (ready || elapsed >= MAX) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[400] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${done ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-hidden={done}
    >
      <div className="font-serif text-6xl md:text-7xl text-gradient-gold mb-10 tracking-wider">G &amp; S</div>
      <div className="w-56 h-px bg-gold/20 mb-6 overflow-hidden">
        <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[10px] tracking-[0.4em] uppercase text-champagne/50 italic">Uma história escrita pelo destino…</p>
    </div>
  );
}
