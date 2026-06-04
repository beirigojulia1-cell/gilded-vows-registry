import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ParticleCanvas } from "@/components/ParticleHero";
import { PurchaseModal } from "@/components/PurchaseModal";
import { ToastProvider } from "@/components/Toast";
import { ensureDefaultPassword, formatBRL, store, useStoreSubscribe, type Gift } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Geovana & Sérgio · Lista de Presentes" },
      { name: "description", content: "Seu presente é uma forma de fazer parte da nossa história." },
      { property: "og:title", content: "Geovana & Sérgio · Lista de Presentes" },
      { property: "og:description", content: "Seu presente é uma forma de fazer parte da nossa história." },
    ],
  }),
  component: () => (
    <ToastProvider>
      <GiftsPage />
    </ToastProvider>
  ),
});

function GiftsPage() {
  ensureDefaultPassword();
  const [, setTick] = useState(0);
  const [gifts, setGifts] = useState<Gift[]>(() => store.getGifts());
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(() => new Set(store.getPurchases().map((p) => p.giftId)));
  const [activeCat, setActiveCat] = useState("Todos");
  const [selected, setSelected] = useState<Gift | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      setGifts(store.getGifts());
      setPurchasedIds(new Set(store.getPurchases().map((p) => p.giftId)));
      setTick((n) => n + 1);
    };
    return useStoreSubscribe(sync);
  }, []);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(gifts.map((g) => g.category)))], [gifts]);
  const filtered = useMemo(() => (activeCat === "Todos" ? gifts : gifts.filter((g) => g.category === activeCat)), [gifts, activeCat]);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-card]");
    gsap.fromTo(cards, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power2.out" });
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.18),transparent_60%)]" />
        <ParticleCanvas />
        <div className="relative max-w-5xl mx-auto px-6 py-28 md:py-40 text-center">
          <p className="text-[0.7rem] md:text-xs tracking-[0.45em] uppercase text-gold/80 mb-8 animate-fade-up">— Geovana &amp; Sérgio · 2026 —</p>
          <h1 className="font-serif text-5xl md:text-7xl text-champagne animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Lista de <em className="text-gradient-gold not-italic">Presentes</em>
          </h1>
          <div className="gold-rule w-32 mx-auto my-8" />
          <p className="max-w-xl mx-auto text-champagne/70 leading-relaxed text-sm md:text-base font-light animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Seu presente é uma forma de fazer parte da nossa história. Cada gesto de amor transforma o nosso começo.
          </p>
        </div>
      </header>

      {/* FILTER */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-y border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap gap-2 justify-center">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-5 py-2 text-xs tracking-[0.18em] uppercase rounded-full border transition-all ${activeCat === c ? "bg-gold text-ink border-gold" : "border-gold/30 text-champagne/70 hover:border-gold/70 hover:text-gold"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <main ref={gridRef} className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((gift) => {
          const taken = purchasedIds.has(gift.id);
          return (
            <article
              key={gift.id}
              data-card
              className={`group relative rounded-lg border border-gold/15 overflow-hidden flex flex-col transition-all ${taken ? "opacity-50 grayscale" : "hover:border-gold/50 hover:shadow-[0_20px_60px_-20px_rgba(201,169,110,0.35)] hover:-translate-y-1"}`}
              style={{ background: gift.gradient }}
            >
              <div className="relative h-44 flex items-center justify-center">
                {gift.imageUrl ? (
                  <img src={gift.imageUrl} alt={gift.title} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                ) : (
                  <div className="text-6xl drop-shadow-lg">{gift.icon}</div>
                )}
                <span className="absolute top-3 left-3 text-[0.6rem] tracking-[0.25em] uppercase text-gold/90 bg-black/40 backdrop-blur px-2 py-1 rounded">{gift.category}</span>
                {taken && <span className="absolute top-3 right-3 text-[0.6rem] tracking-wider uppercase text-emerald-300 bg-emerald-900/40 px-2 py-1 rounded">Já presenteado ✓</span>}
              </div>
              <div className="p-5 flex-1 flex flex-col bg-black/40">
                <h3 className="font-serif text-2xl text-champagne mb-2">{gift.title}</h3>
                <div className="text-gradient-gold font-serif text-xl mb-5">{formatBRL(gift.priceCents)}</div>
                <button
                  disabled={taken}
                  onClick={() => setSelected(gift)}
                  className="btn-gold mt-auto py-2.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {taken ? "Indisponível" : "Presentear"}
                </button>
              </div>
            </article>
          );
        })}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/60 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="gold-rule w-24 mx-auto mb-6" />
          <p className="font-serif text-2xl text-champagne italic">Geovana Stefany &amp; Sérgio Vasconcelos</p>
          <p className="text-xs tracking-[0.4em] uppercase text-gold/70 mt-3">15 · 11 · 2026</p>
          <p className="text-champagne/50 text-xs mt-6">Com todo o nosso amor ✦</p>
          <Link to="/admin" className="inline-block mt-8 opacity-0 hover:opacity-100 text-[10px] text-champagne/40 tracking-widest">admin</Link>
        </div>
      </footer>

      {selected && <PurchaseModal gift={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
