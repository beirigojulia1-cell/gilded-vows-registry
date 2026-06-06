import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function CountdownTimer({ date }: { date: string }) {
  const target = new Date(date).getTime();
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: [string, number][] = [
    ["Dias", t.days],
    ["Horas", t.hours],
    ["Minutos", t.minutes],
    ["Segundos", t.seconds],
  ];

  return (
    <div className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="font-serif text-[24rem] md:text-[32rem] leading-none text-gold/[0.04] font-light">2026</span>
      </div>
      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <p className="text-[10px] tracking-[0.45em] uppercase text-gold/70 mb-3">A contagem regressiva começou</p>
        <h2 className="font-serif text-4xl md:text-5xl text-champagne mb-12">
          Faltam para o nosso <em className="text-gradient-gold not-italic">grande dia</em>
        </h2>
        <div className="grid grid-cols-4 gap-3 md:gap-6 max-w-3xl mx-auto">
          {cells.map(([label, val]) => (
            <div key={label} className="bg-card/60 backdrop-blur border border-gold/15 rounded-md py-6 md:py-10">
              <div className="font-serif text-4xl md:text-7xl text-gradient-gold tabular-nums">{String(val).padStart(2, "0")}</div>
              <div className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-champagne/60 mt-2">{label}</div>
            </div>
          ))}
        </div>
        <p className="font-serif italic text-champagne/70 mt-10 text-lg">28 de Junho de 2026</p>
      </div>
    </div>
  );
}
