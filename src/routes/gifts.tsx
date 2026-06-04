import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ParticleCanvas } from "@/components/ParticleHero";
import { PurchaseModal } from "@/components/PurchaseModal";
import { ToastProvider } from "@/components/Toast";
import { ensureDefaultPassword, formatBRL, store, useStoreSubscribe, type Gift, type Purchase } from "@/lib/store";

export const Route = createFileRoute("/gifts")({
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
  const [gifts, setGifts] = useState<Gift[]>(() => store.getGifts());
  const [purchases, setPurchases] = useState<Purchase[]>(() => store.getPurchases());
  const [activeCat, setActiveCat] = useState("Todos");
  const [selected, setSelected] = useState<Gift | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = useStoreSubscribe(() => {
      setGifts(store.getGifts());
      setPurchases(store.getPurchases());
    });
    return cleanup;
  }, []);

  const purchasedMap = useMemo(() => {
    const m = new Map<string, Purchase>();
    for (const p of purchases) if (!m.has(p.giftId)) m.set(p.giftId, p);
    return m;
  }, [purchases]);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(gifts.map((g) => g.category)))], [gifts]);
  const filtered = useMemo(() => (activeCat === "Todos" ? gifts : gifts.filter((g) => g.category === activeCat)), [gifts, activeCat]);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-card]");
    gsap.fromTo(cards, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out" });
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Link to="/" className="fixed top-6 left-6 z-30 text-[10px] tracking-[0.3em] uppercase text-champagne/60 hover:text-gold transition-colors">← Voltar ao site</Link>
      <Link to="/admin" className="fixed top-6 right-6 z-30 opacity-0 pointer-events-none">admin</Link>

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
          const purchase = purchasedMap.get(gift.id);
          const taken = !!purchase;
          return (
            <article
              key={gift.id}
              data-card
              className={`group relative rounded-lg border overflow-hidden flex flex-col transition-all duration-500 ${taken ? "opacity-60 grayscale border-border/40" : "border-gold/15 hover:border-gold/50 hover:shadow-[0_30px_80px_-30px_rgba(201,169,110,0.45)] hover:-translate-y-1"}`}
              style={{ background: gift.gradient }}
            >
              <div className="relative h-48 overflow-hidden flex items-center justify-center">
                {gift.imageUrl ? (
                  <img src={gift.imageUrl} alt={gift.title} className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="text-6xl drop-shadow-[0_8px_24px_rgba(201,169,110,0.4)] transition-transform duration-700 group-hover:scale-110" style={{ color: gift.accent }}>{gift.icon}</div>
                )}
                <span className="absolute top-3 left-3 text-[0.6rem] tracking-[0.3em] uppercase bg-black/50 backdrop-blur px-2.5 py-1 rounded" style={{ color: gift.accent ?? "var(--gold)" }}>{gift.category}</span>
                {taken && <span className="absolute top-3 right-3 text-[0.6rem] tracking-[0.2em] uppercase text-gold bg-black/60 px-2.5 py-1 rounded">✦ Presenteado</span>}
              </div>
              <div className="p-6 flex-1 flex flex-col bg-black/45 backdrop-blur-sm">
                <h3 className="font-serif text-2xl text-champagne mb-2">{gift.title}</h3>
                <p className="text-champagne/55 text-xs leading-relaxed mb-4 line-clamp-2">{gift.description}</p>
                {taken && <p className="text-[10px] tracking-wider uppercase text-gold/80 italic mb-3">Presenteado por {purchase!.guestName}</p>}
                <div className="mt-auto pt-4 border-t border-gold/10 flex items-end justify-between">
                  <div>
                    <div className="text-[9px] tracking-[0.3em] uppercase text-champagne/40">Valor sugerido</div>
                    <div className="text-gradient-gold font-serif text-xl">{formatBRL(gift.priceCents)}</div>
                  </div>
                  <button
                    disabled={taken}
                    onClick={() => setSelected(gift)}
                    className="btn-gold px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {taken ? "Presenteado ✦" : "Presentear"}
                  </button>
                </div>
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
        </div>
      </footer>

      {selected && <PurchaseModal gift={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
