import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Loader } from "@/components/Loader";

import { SmoothScroll } from "@/components/SmoothScroll";
import { ParticleCanvas } from "@/components/ParticleHero";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ToastProvider } from "@/components/Toast";
import { PurchaseModal } from "@/components/PurchaseModal";
import { AnimatedText } from "@/components/AnimatedText";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ensureDefaultPassword, formatBRL, store, useStoreSubscribe, type Gift, type Purchase } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { lookupMercadoPagoByGift } from "@/lib/wedding.functions";
import heroAsset from "@/assets/sentados-banco.jpeg.asset.json";
const heroImg = heroAsset.url;
import closingImg from "@/assets/closing.jpg";
import chapter1Asset from "@/assets/se-olhando.jpeg.asset.json";
import chapter2Asset from "@/assets/mao-dada-se-olhando.jpeg.asset.json";
import chapter3Asset from "@/assets/gi-olhando-sergio.jpeg.asset.json";
import chapter4Asset from "@/assets/beijando-testa-gigante.jpeg.asset.json";
import g1Asset from "@/assets/sorriso-gi.jpeg.asset.json";
import g2Asset from "@/assets/sentados-banco.jpeg.asset.json";
import g3Asset from "@/assets/maos-gi.jpeg.asset.json";
import g4Asset from "@/assets/sergio-segurando-gi.jpeg.asset.json";
import g5Asset from "@/assets/sergio-segurando-gi-sorrindo.jpeg.asset.json";
import g6Asset from "@/assets/se-olhando.jpeg.asset.json";

const chapter1 = chapter1Asset.url;
const chapter2 = chapter2Asset.url;
const chapter3 = chapter3Asset.url;
const chapter4 = chapter4Asset.url;
const g1 = g1Asset.url;
const g2 = g2Asset.url;
const g3 = g3Asset.url;
const g4 = g4Asset.url;
const g5 = g5Asset.url;
const g6 = g6Asset.url;

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Geovana & Sérgio · Casamento 2026" },
      { name: "description", content: "Uma história escrita pelo destino. 28 de Junho de 2026." },
      { property: "og:title", content: "Geovana & Sérgio · Casamento 2026" },
      { property: "og:description", content: "Uma história escrita pelo destino. 28 de Junho de 2026." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: () => (
    <ToastProvider>
      <SmoothScroll>
        <Landing />
      </SmoothScroll>
    </ToastProvider>
  ),
});

const CHAPTERS = [
  { n: "01", tag: "Primeiro Capítulo", title: "Primeiro Encontro", year: "2019", text: "Naquele dia, o universo conspirou para que dois caminhos se cruzassem. Um olhar que durou apenas um instante — mas que mudaria tudo para sempre.", img: chapter1 },
  { n: "02", tag: "Segundo Capítulo", title: "Primeira Viagem", year: "2020", text: "Descobrir o mundo juntos revelou que o melhor destino nunca é um lugar — é a pessoa ao seu lado.", img: chapter2 },
  { n: "03", tag: "Terceiro Capítulo", title: "Momentos Especiais", year: "2021 — 2023", text: "Cada risada compartilhada, cada silêncio confortável, cada momento ordinário transformado em memória preciosa e eterna.", img: chapter3 },
  { n: "04", tag: "Quarto Capítulo", title: "Pedido de Casamento", year: "2024", text: "\"Você quer casar comigo?\" — e o tempo parou. O coração respondeu antes mesmo das palavras. Sim. Para sempre. Sim.", img: chapter4 },
];

const GALLERY = [
  { src: g1, word: "Amor", h: "h-[420px]" },
  { src: g2, word: "Cumplicidade", h: "h-[320px]" },
  { src: g3, word: "Alegria", h: "h-[380px]" },
  { src: g4, word: "Eternidade", h: "h-[340px]" },
  { src: g5, word: "Para Sempre", h: "h-[440px]" },
  { src: g6, word: "Aventura", h: "h-[300px]" },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function Landing() {
  const { push: pushToast } = useToast();
  // Mercado Pago card return handler
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("mp") !== "1") return;
    const status = url.searchParams.get("status");
    const giftId = url.searchParams.get("gift") || "";
    const guest = url.searchParams.get("guest") || "Convidado";
    const msg = url.searchParams.get("msg") || "";
    ["mp", "status", "gift", "guest", "msg", "payment_id", "preference_id", "external_reference", "collection_id", "collection_status", "merchant_order_id", "processing_mode", "merchant_account_id", "payment_type", "site_id"].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + "#gifts");
    if (status === "approved" && giftId) {
      const exists = store.getPurchases().some((p) => p.giftId === giftId);
      if (!exists) store.addPurchase({ giftId, guestName: guest, message: msg });
      pushToast("Pagamento aprovado · Obrigado pelo presente!", "success");
      // Confirma no servidor e grava no banco para aparecer no /admin
      lookupMercadoPagoByGift({ data: { giftId, guestName: guest, message: msg } }).catch(() => {});
    } else if (status === "pending") {
      pushToast("Pagamento pendente · Confirmaremos em instantes", "success");
    } else if (status === "failure") {
      pushToast("Pagamento não concluído · Tente novamente", "error");
    }
  }, [pushToast]);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((parent) => {
        const items = parent.querySelectorAll<HTMLElement>("[data-stagger-item]");
        if (!items.length) return;
        gsap.fromTo(
          items,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            stagger: 0.12,
            scrollTrigger: { trigger: parent, start: "top 75%" },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((el) => {
        const side = (el as HTMLElement).dataset.side === "right" ? "right" : "left";
        const img = el.querySelector<HTMLElement>("[data-chapter-img]");
        const numeral = el.querySelector<HTMLElement>("[data-chapter-numeral]");
        if (img) {
          const from = side === "left" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
          gsap.fromTo(
            img,
            { clipPath: from, scale: 1.15 },
            {
              clipPath: "inset(0 0 0 0)",
              scale: 1,
              duration: 1.6,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 75%" },
            },
          );
          gsap.to(img, {
            yPercent: -6,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
        if (numeral) {
          gsap.fromTo(
            numeral,
            { opacity: 0, x: side === "left" ? -60 : 60 },
            {
              opacity: 1,
              x: 0,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.to(el, {
          y: -60,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-rule-grow]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            ease: "power2.out",
            duration: 1.4,
            scrollTrigger: { trigger: el, start: "top 90%" },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>("[data-pin-fade]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0.4, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "center 40%",
              scrub: true,
            },
          },
        );
      });
    });
    const refresh = () => ScrollTrigger.refresh();
    const imgs = Array.from(document.querySelectorAll("img"));
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", refresh, { once: true });
    });
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return (
    <>
      <Loader />
      <ScrollProgress />

      <div className="bg-background text-foreground">
        <Hero />
        <Quote />
        <LoveStory />
        <Gallery />
        <Proposal />
        <CountdownTimer date="2026-06-28T12:00:00-03:00" />
        <InfoCards />
        <Gifts />
        <RSVP />
        <Closing onScrollToRsvp={() => scrollToId("rsvp")} />
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
      <img src={heroImg} alt="Geovana e Sérgio" className="absolute inset-0 w-full h-full object-cover" />
      {/* overlay bem mais leve só para garantir contraste dos textos */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />
      <ParticleCanvas />
      <div className="relative z-10 text-center px-5 sm:px-6 max-w-4xl" style={{ textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}>
        <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.4em] sm:tracking-[0.5em] uppercase text-gold mb-6 sm:mb-10 animate-fade-up">— Casamento · 2026 —</p>
        <h1 className="font-serif font-light text-champagne leading-[0.95]">
          <AnimatedText as="span" text="Geovana Stefany" split="chars" stagger={0.03} duration={1.1} className="block text-[2.5rem] sm:text-5xl md:text-7xl lg:text-8xl" />
          <span className="block font-serif italic text-gradient-gold text-3xl sm:text-4xl md:text-5xl lg:text-6xl my-3 sm:my-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>&amp;</span>
          <AnimatedText as="span" text="Sérgio Vasconcelos" split="chars" stagger={0.03} duration={1.1} delay={0.25} className="block text-[2.5rem] sm:text-5xl md:text-7xl lg:text-8xl" />
        </h1>
        <div className="gold-rule w-20 sm:w-24 mx-auto my-7 sm:my-10" data-rule-grow />
        <AnimatedText as="p" text="Uma história escrita pelo destino." split="words" stagger={0.08} delay={0.5} className="font-serif italic text-champagne text-base sm:text-lg md:text-2xl" />
      </div>
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: "1s" }}>
        <span className="text-[9px] tracking-[0.5em] uppercase text-gold/70">Scroll</span>
        <div className="w-px h-10 sm:h-12 bg-gradient-to-b from-gold/80 to-transparent overflow-hidden">
          <div className="w-px h-4 bg-gold animate-[scrollcue_2s_ease-in-out_infinite]" />
        </div>
      </div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(200%)}}`}</style>
    </section>
  );
}

function Quote() {
  return (
    <section className="py-20 sm:py-28 md:py-40 lg:py-48 px-5 sm:px-6">
      <div className="max-w-3xl mx-auto text-center" data-pin-fade>
        <div className="gold-rule w-28 sm:w-40 mx-auto mb-8 sm:mb-12" data-rule-grow />
        <blockquote className="font-serif text-2xl sm:text-3xl md:text-5xl text-champagne leading-tight font-light">
          <AnimatedText as="span" text="Algumas histórias começam de forma simples…" split="words" stagger={0.06} duration={1.1} className="block" />
          <AnimatedText as="span" text="mas acabam se tornando eternas." split="words" stagger={0.07} duration={1.2} delay={0.3} className="block italic text-gradient-gold mt-3 sm:mt-4" />
        </blockquote>
        <div className="gold-rule w-28 sm:w-40 mx-auto mt-8 sm:mt-12" data-rule-grow />
      </div>
    </section>
  );
}

function LoveStory() {
  return (
    <div className="overflow-hidden">
      {CHAPTERS.map((c, i) => {
        const photoRight = i % 2 === 1;
        return (
          <section
            key={c.n}
            data-chapter
            data-side={photoRight ? "right" : "left"}
            className="relative grid md:grid-cols-2 md:min-h-screen"
          >
            {/* Photo half */}
            <div
              className={`relative overflow-hidden h-[50vh] sm:h-[60vh] md:h-screen ${photoRight ? "md:order-2" : ""}`}
            >
              <img
                data-chapter-img
                src={c.img}
                alt={c.title}
                className="absolute inset-0 w-full h-full object-cover will-change-transform"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i === 0 ? "high" : "auto"}
              />
            </div>

            {/* Text half */}
            <div
              data-stagger
              className={`relative flex items-center bg-background px-6 sm:px-8 md:px-16 lg:px-20 py-16 sm:py-20 md:py-0 ${photoRight ? "md:order-1" : ""}`}
            >
              <span
                data-chapter-numeral
                className={`pointer-events-none select-none absolute font-serif font-light text-[10rem] sm:text-[14rem] md:text-[22rem] lg:text-[26rem] leading-none text-gold/[0.05] bottom-0 ${photoRight ? "left-2 sm:left-4" : "right-2 sm:right-4"}`}
              >
                {c.n}
              </span>
              <div className="relative max-w-md">
                <AnimatedText as="p" text={c.tag.toUpperCase()} split="words" stagger={0.04} className="text-[10px] tracking-[0.4em] sm:tracking-[0.45em] uppercase text-gold/80 mb-4 sm:mb-6" />
                <AnimatedText as="h3" text={c.title} split="chars" stagger={0.025} duration={1} className="font-serif text-[2.25rem] sm:text-5xl md:text-6xl lg:text-7xl text-champagne mb-4 sm:mb-6 leading-[1.05] font-light" />
                <AnimatedText as="p" text={c.year} split="chars" stagger={0.04} className="text-[10px] sm:text-[11px] tracking-[0.35em] sm:tracking-[0.4em] text-gold/80 mb-6 sm:mb-8" />
                <AnimatedText as="p" text={c.text} split="words" stagger={0.025} duration={0.9} className="text-champagne/70 leading-relaxed text-sm sm:text-base md:text-lg font-light mb-6 sm:mb-8" />
                <div className="gold-rule w-16" data-rule-grow />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Gallery() {
  return (
    <section className="py-24 md:py-32 px-6 bg-cream text-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold-soft mb-3" data-reveal>— Galeria —</p>
          <AnimatedText as="h2" text="Memórias Eternizadas" split="chars" stagger={0.03} className="font-serif text-5xl md:text-6xl text-ink" />
        </div>
        <div className="columns-2 md:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
          {GALLERY.map((g) => (
            <div key={g.word} className={`group relative overflow-hidden rounded-sm break-inside-avoid border border-gold/10 ${g.h}`} data-reveal>
              <img src={g.src} alt={g.word} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.4s] group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-95 transition-opacity duration-500" />
              <div className="absolute inset-0 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                <span className="font-serif italic text-3xl md:text-4xl text-gradient-gold">{g.word}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Proposal() {
  return (
    <section className="relative py-40 md:py-56 px-6 overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.08),transparent_60%)]">
      <ParticleCanvas />
      <div className="relative max-w-3xl mx-auto text-center" data-pin-fade>
        <div className="relative w-32 h-32 mx-auto mb-12">
          <div className="absolute inset-0 rounded-full border border-gold/40 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-3 rounded-full border border-gold/60 animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute inset-6 rounded-full border border-gold/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rotate-45 bg-gradient-to-br from-[#f5e8c9] to-[#8a6f3d] shadow-[0_0_30px_rgba(201,169,110,0.8)]" />
          </div>
        </div>
        <p className="font-serif text-3xl md:text-5xl text-champagne font-light leading-tight">
          <AnimatedText as="em" text="E naquele instante…" split="words" stagger={0.08} duration={1.2} className="text-gradient-gold not-italic" />
          <AnimatedText as="span" text="duas vidas se tornaram uma só." split="words" stagger={0.08} delay={0.4} duration={1.2} className="block mt-4" />
        </p>
      </div>
    </section>
  );
}

function InfoCards() {
  const cards = [
    { label: "Data", value: "28 de Junho", sub: "2026 · Sábado", icon: <CalIcon /> },
    { label: "Horário", value: "12h00", sub: "Cerimônia ao meio-dia", icon: <ClockIcon /> },
    { label: "Local", value: "Av. Marginal do CSU, 1455", sub: "", icon: <PinIcon />, cta: { label: "Ver no Mapa →", href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Av. Marginal do CSU, 1455") } },
    { label: "Dress Code", value: "Esporte Fino", sub: "Tons claros e elegantes", icon: <EnvIcon /> },
  ];
  return (
    <section className="py-24 md:py-32 px-6 bg-cream text-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold-soft mb-3" data-reveal>— Detalhes —</p>
          <AnimatedText as="h2" text="Nosso Grande Dia" split="chars" stagger={0.03} className="font-serif text-5xl md:text-6xl text-ink" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c) => (
            <div key={c.label} className="bg-white/70 border border-gold/20 rounded-md p-8 hover:border-gold/50 hover:bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]" data-reveal>
              <div className="text-gold-soft mb-5">{c.icon}</div>
              <p className="text-[10px] tracking-[0.35em] uppercase text-gold-soft mb-2">{c.label}</p>
              <h3 className="font-serif text-3xl text-ink mb-1">{c.value}</h3>
              <p className="text-ink/55 text-sm">{c.sub}</p>
              {c.cta && (
                <a href={c.cta.href} target="_blank" rel="noopener noreferrer" className="inline-block mt-5 px-5 py-2 rounded-full bg-ink text-cream text-xs tracking-[0.18em] uppercase hover:bg-ink/85 transition">{c.cta.label}</a>
              )}
            </div>
          ))}
          <div className="md:col-span-2 lg:col-span-4 relative bg-white/80 border border-gold/25 rounded-md p-10 md:p-14 overflow-hidden" data-reveal>
            <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <div className="text-gold-soft mb-5"><GiftIcon /></div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-gold-soft mb-2">Lista de Presentes</p>
                <h3 className="font-serif text-3xl md:text-4xl text-ink mb-3">Nosso Ninho de Amor</h3>
                <p className="text-ink/65 italic max-w-md">"Contribua para realizarmos nossos sonhos juntos."</p>
              </div>
              <button type="button" onClick={() => scrollToId("gifts")} className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gold text-ink font-medium tracking-[0.18em] uppercase text-xs whitespace-nowrap hover:bg-gold-soft transition">
                Ver Lista de Presentes →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RSVP() {
  const { push } = useToast();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { push("Informe seu nome", "error"); return; }
    const list = JSON.parse(localStorage.getItem("wg_rsvp") || "[]");
    list.push({ id: crypto.randomUUID(), name: name.trim(), message: message.trim(), at: Date.now() });
    localStorage.setItem("wg_rsvp", JSON.stringify(list));
    setDone(true);
  };

  return (
    <section id="rsvp" className="py-28 md:py-40 px-6">
      <div className="max-w-2xl mx-auto" data-reveal>
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold/80 mb-3" data-reveal>— RSVP —</p>
          <AnimatedText as="h2" text="Confirme sua Presença" split="chars" stagger={0.03} className="font-serif text-5xl md:text-6xl text-champagne" />
          <AnimatedText as="p" text="Sua presença é o maior presente que poderíamos receber." split="words" stagger={0.04} delay={0.3} className="text-champagne/60 mt-5 italic" />
        </div>
        {done ? (
          <div className="text-center bg-card/60 border border-gold/30 rounded-md p-12">
            <div className="text-5xl text-gradient-gold mb-4">✦</div>
            <h3 className="font-serif text-3xl text-champagne mb-2">Presença confirmada!</h3>
            <p className="text-champagne/60 italic">Mal podemos esperar para celebrar com você.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-card/40 backdrop-blur border border-gold/15 rounded-md p-8 md:p-10 space-y-6">
            <Field label="Nome Completo">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Como você gostaria de ser chamado" />
            </Field>
            <Field label="Mensagem Especial">
              <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputCls} resize-none`} placeholder="Deixe uma mensagem para o casal (opcional)" />
            </Field>
            <button type="submit" className="shimmer w-full py-4 rounded bg-gradient-to-r from-[#8a6f3d] via-[#c9a96e] to-[#8a6f3d] text-ink font-medium tracking-[0.2em] uppercase text-xs">
              Confirmar Presença
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

function Closing({ onScrollToRsvp }: { onScrollToRsvp: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <img src={closingImg} alt="Cerimônia" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
      <ParticleCanvas />
      <div className="relative z-10 text-center px-6 max-w-3xl py-20">
        <div className="text-4xl text-gradient-gold mb-8" data-reveal>✦</div>
        <AnimatedText as="p" text="Mal podemos esperar para viver esse momento com você." split="words" stagger={0.05} duration={1.1} className="font-serif text-3xl md:text-5xl text-champagne font-light leading-tight italic" />
        <div className="gold-rule w-24 mx-auto my-10" data-rule-grow />
        <AnimatedText as="p" text="Geovana & Sérgio" split="chars" stagger={0.05} className="font-serif text-2xl md:text-3xl text-gradient-gold mb-10" />
        <button onClick={onScrollToRsvp} className="btn-gold px-8 py-4 rounded">Nos vemos no altar ↓</button>
        <div className="mt-20 border-t border-gold/15 pt-10">
          <p className="text-champagne/60 text-sm">Com todo o nosso amor,</p>
          <p className="font-serif italic text-xl text-champagne mt-2">Geovana Stefany &amp; Sérgio Vasconcelos</p>
          <p className="text-[10px] tracking-[0.5em] uppercase text-gold/80 mt-4">15 · 11 · 2026</p>
        </div>
      </div>
    </section>
  );
}

const inputCls = "w-full bg-input/60 border border-border rounded px-4 py-3 text-sm text-champagne placeholder:text-champagne/40 focus:border-gold/60 focus:outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.3em] uppercase text-champagne/60 block mb-2">{label}</span>
      {children}
    </label>
  );
}

/* ICONS */
function CalIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>; }
function ClockIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>; }
function PinIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>; }
function EnvIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 7 9-7"/></svg>; }
function GiftIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M8 8a2.5 2.5 0 1 1 4-2 2.5 2.5 0 1 1 4 2"/></svg>; }

function Gifts() {
  ensureDefaultPassword();
  const [gifts, setGifts] = useState<Gift[]>(() => store.getGifts());
  const [purchases, setPurchases] = useState<Purchase[]>(() => store.getPurchases());
  const [activeCat, setActiveCat] = useState("Todos");
  const [selected, setSelected] = useState<Gift | null>(null);

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

  return (
    <section id="gifts" className="relative py-24 md:py-32 px-6 bg-cream text-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold-soft mb-3" data-reveal>— Lista de Presentes —</p>
          <AnimatedText as="h2" text="Nosso Ninho de Amor" split="chars" stagger={0.03} className="font-serif text-5xl md:text-6xl text-ink" />
          <div className="gold-rule w-24 mx-auto my-8" data-rule-grow />
          <AnimatedText as="p" text="Seu presente é uma forma de fazer parte da nossa história. Cada gesto de amor transforma o nosso começo." split="words" stagger={0.02} className="max-w-xl mx-auto text-ink/70 leading-relaxed text-sm md:text-base font-light" />
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-5 py-2 text-xs tracking-[0.18em] uppercase rounded-full border transition-all ${activeCat === c ? "bg-gold text-ink border-gold" : "border-gold/40 text-ink/70 hover:border-gold hover:text-gold-soft"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((gift) => {
            const purchase = purchasedMap.get(gift.id);
            const taken = !!purchase;
            return (
              <article
                key={gift.id}
                data-reveal
                className={`group relative rounded-lg border overflow-hidden flex flex-col transition-all duration-500 bg-white ${taken ? "opacity-60 grayscale border-border/40" : "border-gold/25 hover:border-gold/70 hover:shadow-[0_30px_80px_-30px_rgba(201,169,110,0.45)] hover:-translate-y-1"}`}
              >
                <div className="relative h-48 overflow-hidden flex items-center justify-center bg-cream-muted">
                  {gift.imageUrl ? (
                    <img src={gift.imageUrl} alt={gift.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                  ) : (
                    <div className="text-6xl drop-shadow-[0_8px_24px_rgba(201,169,110,0.4)] transition-transform duration-700 group-hover:scale-110" style={{ color: gift.accent }}>{gift.icon}</div>
                  )}
                  <span className="absolute top-3 left-3 text-[0.6rem] tracking-[0.3em] uppercase bg-white/85 backdrop-blur px-2.5 py-1 rounded text-gold-soft">{gift.category}</span>
                  {taken && <span className="absolute top-3 right-3 text-[0.6rem] tracking-[0.2em] uppercase text-gold-soft bg-white/85 px-2.5 py-1 rounded">✦ Presenteado</span>}
                </div>
                <div className="p-6 flex-1 flex flex-col bg-white">
                  <h3 className="font-serif text-2xl text-ink mb-2">{gift.title}</h3>
                  <p className="text-ink/60 text-xs leading-relaxed mb-4 line-clamp-2">{gift.description}</p>
                  {taken && <p className="text-[10px] tracking-wider uppercase text-gold-soft italic mb-3">Presenteado por {purchase!.guestName}</p>}
                  <div className="mt-auto pt-4 border-t border-gold/20 flex items-end justify-between">
                    <div>
                      <div className="text-[9px] tracking-[0.3em] uppercase text-ink/45">Valor sugerido</div>
                      <div className="text-gradient-gold font-serif text-xl">{formatBRL(gift.priceCents)}</div>
                    </div>
                    <button
                      disabled={taken}
                      onClick={() => setSelected(gift)}
                      className="px-4 py-2 rounded border border-gold text-gold-soft hover:bg-gold hover:text-ink transition-all text-[0.72rem] tracking-[0.12em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {taken ? "Presenteado ✦" : "Presentear"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {selected && <PurchaseModal gift={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
