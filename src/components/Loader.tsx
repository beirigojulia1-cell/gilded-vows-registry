import { useEffect, useState } from "react";

export function Loader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 12 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        setTimeout(() => setDone(true), 400);
      }
      setProgress(p);
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[400] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${done ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <div className="font-serif text-6xl md:text-7xl text-gradient-gold mb-12 tracking-wider">
        G &amp; S
      </div>
      <div className="w-56 h-px bg-gold/20 mb-6 overflow-hidden">
        <div
          className="h-full bg-gold transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] tracking-[0.4em] uppercase text-champagne/50 italic">
        Uma história escrita pelo destino…
      </p>
    </div>
  );
}
