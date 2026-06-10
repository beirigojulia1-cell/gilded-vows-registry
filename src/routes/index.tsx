import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { formatBRL } from "@/lib/store";
import { giftsQuery, purchasedIdsQuery } from "@/lib/wedding-queries";
import type { Gift } from "@/lib/wedding-types";
import { useToast } from "@/components/Toast";
import { lookupMercadoPagoByGift } from "@/lib/wedding.functions";
import heroImg from "@/assets/sorriso-gi-local.jpeg";
import closingImg from "@/assets/closing.jpg";
import chapter1 from "@/assets/primeiroencontro.jpeg";
import chapter2 from "@/assets/primeiraviajem.jpg";
import chapter3 from "@/assets/momentosespeciais.jpeg";
import chapter4 from "@/assets/pedidodecasamento.jpeg";
import g1Asset from "@/assets/sorriso-gi.jpeg.asset.json";
import g2 from "@/assets/sentados-banco.jpeg";
import g3Asset from "@/assets/maos-gi.jpeg.asset.json";
import g4 from "@/assets/sergio-segurando-gi.jpeg";
import g5 from "@/assets/sergio-segurando-gi-sorrindo.jpeg";
import g6 from "@/assets/se-olhando.jpeg";
import g7 from "@/assets/gi-olhando-sergio.jpeg";

// chapter1 variable imported directly
// chapter2 variable imported directly
// chapter3 variable imported directly
// chapter4 variable imported directly
const g1 = g1Asset.url;
const g3 = g3Asset.url;

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Geovana & Sérgio · Casamento 2026" },
      { name: "description", content: "Uma história escrita pelo destino. 28 de Junho de 2026." },
      { property: "og:title", content: "Geovana & Sérgio · Casamento 2026" },
      {
        property: "og:description",
        content: "Uma história escrita pelo destino. 28 de Junho de 2026.",
      },
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
  {
    n: "01",
    tag: "Primeiro Capítulo",
    title: "Primeiro Encontro",
    year: "2019",
    text: "Naquele dia, o universo conspirou para que dois caminhos se cruzassem. Um olhar que durou apenas um instante — mas que mudaria tudo para sempre.",
    img: chapter1,
  },
  {
    n: "02",
    tag: "Segundo Capítulo",
    title: "Primeira Viagem",
    year: "2020",
    text: "Descobrir o mundo juntos revelou que o melhor destino nunca é um lugar — é a pessoa ao seu lado.",
    img: chapter2,
  },
  {
    n: "03",
    tag: "Terceiro Capítulo",
    title: "Momentos Especiais",
    year: "2021 — 2023",
    text: "Cada risada compartilhada, cada silêncio confortável, cada momento ordinário transformado em memória preciosa e eterna.",
    img: chapter3,
  },
  {
    n: "04",
    tag: "Quarto Capítulo",
    title: "Pedido de Casamento",
    year: "2024",
    text: '"Você quer casar comigo?" — e o tempo parou. O coração respondeu antes mesmo das palavras. Sim. Para sempre. Sim.',
    img: chapter4,
  },
];

const GALLERY = [
  { src: g6, word: "Amor", h: "h-[420px]" },
  { src: g7, word: "Cumplicidade", h: "h-[320px]" },
  { src: g5, word: "Alegria", h: "h-[380px]" },
  { src: g2, word: "Eternidade", h: "h-[340px]" },
  { src: g4, word: "Para Sempre", h: "h-[440px]" },
  { src: g1, word: "Aventura", h: "h-[300px]" },
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
    [
      "mp",
      "status",
      "gift",
      "guest",
      "msg",
      "payment_id",
      "preference_id",
      "external_reference",
      "collection_id",
      "collection_status",
      "merchant_order_id",
      "processing_mode",
      "merchant_account_id",
      "payment_type",
      "site_id",
    ].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + "#gifts");
    if (status === "approved" && giftId) {
      const exists = store.getPurchases().some((p) => p.giftId === giftId);
      if (!exists) store.addPurchase({ giftId, guestName: guest, message: msg });
      pushToast("Pagamento aprovado · Obrigado pelo presente!", "success");
      // Confirma no servidor e grava no banco para aparecer no /admin
      lookupMercadoPagoByGift({ data: { giftId, guestName: guest, message: msg } }).catch(() => { });
    } else if (status === "pending") {
      pushToast("Pagamento pendente · Confirmaremos em instantes", "success");
    } else if (status === "failure") {
      pushToast("Pagamento não concluído · Tente novamente", "error");
    }
  }, [pushToast]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal geral — fade-up mais longo e elegante
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          },
        );
      });

      // Stagger — itens aparecem em cascata com delay maior
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((parent) => {
        const items = parent.querySelectorAll<HTMLElement>("[data-stagger-item]");
        if (!items.length) return;
        gsap.fromTo(
          items,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1.3,
            ease: "power3.out",
            stagger: 0.2,
            scrollTrigger: { trigger: parent, start: "top 78%" },
          },
        );
      });

      // Capítulos da história de amor
      gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((el) => {
        const side = (el as HTMLElement).dataset.side === "right" ? "right" : "left";
        const numeral = el.querySelector<HTMLElement>("[data-chapter-numeral]");
        const text = el.querySelector<HTMLElement>("[data-chapter-text]");
        if (numeral) {
          gsap.fromTo(
            numeral,
            { opacity: 0, x: side === "left" ? -80 : 80 },
            {
              opacity: 1,
              x: 0,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
        if (text) {
          gsap.fromTo(
            text,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 1.4,
              ease: "power3.out",
              scrollTrigger: { trigger: text, start: "top 82%" },
            },
          );
        }
      });

      const isMobile = window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window;

      // Parallax — apenas desktop
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        if (isMobile) return;
        gsap.to(el, {
          y: -60,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      // Regras decorativas
      gsap.utils.toArray<HTMLElement>("[data-rule-grow]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            ease: "power2.out",
            duration: 1.8,
            scrollTrigger: { trigger: el, start: "top 90%" },
          },
        );
      });

      // Pin-fade com scale — apenas desktop
      gsap.utils.toArray<HTMLElement>("[data-pin-fade]").forEach((el) => {
        if (isMobile) return;
        gsap.fromTo(
          el,
          { opacity: 0.3, scale: 0.94 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "center 35%",
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

      <div className="bg-background text-foreground overflow-x-hidden">
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
      <img
        src={heroImg}
        alt="Geovana e Sérgio"
        className="absolute inset-0 w-full h-full object-cover object-[center_5%]"
      />
      {/* overlay mais escuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      <ParticleCanvas />
      <div
        className="relative z-10 text-center px-5 sm:px-6 max-w-4xl"
        style={{ textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}
      >
        <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.4em] sm:tracking-[0.5em] uppercase text-gold mb-6 sm:mb-10 animate-fade-up">
          — Casamento · 2026 —
        </p>
        <h1 className="font-script font-normal text-champagne leading-[1.1]">
          <AnimatedText
            as="span"
            text="Geovana Stefany"
            split="words"
            stagger={0.2}
            duration={1.1}
            clip={false}
            className="block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          />
          <span
            className="block font-script text-gradient-gold text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] my-1 sm:my-2 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            &amp;
          </span>
          <AnimatedText
            as="span"
            text="Sérgio Vasconcelos"
            split="words"
            stagger={0.2}
            duration={1.1}
            delay={0.25}
            clip={false}
            className="block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          />
        </h1>
        <div className="gold-rule w-20 sm:w-24 mx-auto my-7 sm:my-10" data-rule-grow />
        <AnimatedText
          as="p"
          text="Uma história escrita pelo destino."
          split="words"
          stagger={0.08}
          delay={0.5}
          clip={false}
          className="font-script text-champagne/80 text-[1.5rem] sm:text-[2rem] md:text-[2.5rem]"
        />
      </div>
      <div
        className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-fade-up"
        style={{ animationDelay: "1s" }}
      >
        <span className="text-[9px] tracking-[0.5em] uppercase text-gold/70">Scroll</span>
        <div className="w-px h-10 sm:h-12 bg-gradient-to-b from-gold/80 to-transparent overflow-hidden">
          <div className="w-px h-4 bg-gold animate-[scrollcue_2s_ease-in-out_infinite]" />
        </div>
      </div>
      {/* ── soft bottom fade into the dark background ── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-56 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
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
          <AnimatedText
            as="span"
            text="Algumas histórias começam de forma simples…"
            split="words"
            stagger={0.06}
            duration={1.1}
            className="block"
          />
          <AnimatedText
            as="span"
            text="mas acabam se tornando eternas."
            split="words"
            stagger={0.07}
            duration={1.2}
            delay={0.3}
            className="block italic text-gradient-gold mt-3 sm:mt-4"
          />
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
                src={c.img}
                alt={c.title}
                className="absolute inset-0 w-full h-full object-cover"
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
                <AnimatedText
                  as="p"
                  text={c.tag.toUpperCase()}
                  split="words"
                  stagger={0.04}
                  className="text-[10px] tracking-[0.4em] sm:tracking-[0.45em] uppercase text-gold/80 mb-4 sm:mb-6"
                />
                <AnimatedText
                  as="h3"
                  text={c.title}
                  split="words"
                  stagger={0.08}
                  duration={1}
                  className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-5xl text-champagne mb-4 sm:mb-6 leading-[1.05] font-light"
                />
                <AnimatedText
                  as="p"
                  text={c.year}
                  split="chars"
                  stagger={0.04}
                  className="text-[10px] sm:text-[11px] tracking-[0.35em] sm:tracking-[0.4em] text-gold/80 mb-6 sm:mb-8"
                />
                <AnimatedText
                  as="p"
                  text={c.text}
                  split="words"
                  stagger={0.025}
                  duration={0.9}
                  className="text-champagne/70 leading-relaxed text-sm sm:text-base md:text-lg font-light mb-6 sm:mb-8"
                />
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
    <section className="py-16 sm:py-24 md:py-32 px-5 sm:px-6 bg-cream text-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold-soft mb-3" data-reveal>
            — Galeria —
          </p>
          <AnimatedText
            as="h2"
            text="Memórias Eternizadas"
            split="chars"
            stagger={0.03}
            className="font-serif text-4xl sm:text-5xl md:text-6xl text-ink"
          />
        </div>
        <div className="columns-1 sm:columns-2 md:columns-3 gap-3 sm:gap-4 md:gap-6 space-y-3 sm:space-y-4 md:space-y-6">
          {GALLERY.map((g) => (
            <div
              key={g.word}
              className={`group relative overflow-hidden rounded-sm break-inside-avoid border border-gold/10 ${g.h}`}
              data-reveal
            >
              <img
                src={g.src}
                alt={g.word}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.4s] group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 sm:opacity-60 group-hover:opacity-95 transition-opacity duration-500" />
              <div className="absolute inset-0 flex items-end justify-center pb-6 sm:pb-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-500 sm:translate-y-4 group-hover:translate-y-0">
                <span className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-gradient-gold">
                  {g.word}
                </span>
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
    <section className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#060606]">
      {/* ── top fade: blends with cream Gallery section above ── */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[oklch(0.96_0.012_85)] to-transparent z-20 pointer-events-none" />

      {/* ── LEFT: photo strip ── */}
      <div className="relative w-full md:w-[45%] h-[55vw] min-h-[300px] md:h-auto overflow-hidden">
        <img
          src={chapter4}
          alt="Pedido de casamento"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        {/* dark overlay vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 md:hidden" />
        {/* vertical label on photo */}
        <div className="hidden md:flex absolute bottom-12 left-8 items-center gap-3">
          <span className="h-px w-10 bg-gold/60" />
          <span
            className="text-[9px] tracking-[0.5em] uppercase text-gold/70"
            style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
          >
            28 · Jun · 2026
          </span>
        </div>
      </div>

      {/* ── RIGHT: quote ── */}
      <div className="relative flex-1 flex items-center justify-center px-8 sm:px-12 md:px-16 lg:px-20 py-16 md:py-0">
        {/* subtle glow behind text */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_60%_50%,rgba(201,169,110,0.06),transparent_80%)] pointer-events-none" />
        <ParticleCanvas />

        <div className="relative max-w-lg w-full">
          {/* Giant decorative opening quote */}
          <span
            className="font-serif text-[9rem] sm:text-[12rem] leading-none text-gold/10 select-none absolute -top-10 -left-4 sm:-left-6"
            aria-hidden
          >
            "
          </span>

          {/* Caption label */}
          <p className="text-[9px] tracking-[0.55em] uppercase text-gold/60 mb-8 sm:mb-10" data-reveal>
            — Um momento eterno —
          </p>

          {/* Main quote lines */}
          <div className="relative z-10 space-y-3 sm:space-y-4 mb-8 sm:mb-12">
            <AnimatedText
              as="p"
              text="E naquele instante…"
              split="words"
              stagger={0.1}
              duration={1.3}
              clip={false}
              className="font-serif italic text-[1.8rem] sm:text-[2.4rem] md:text-[2.8rem] text-gradient-gold leading-tight font-light"
            />
            <AnimatedText
              as="p"
              text="Duas vidas se tornaram uma só."
              split="words"
              stagger={0.08}
              delay={0.3}
              duration={1.3}
              clip={false}
              className="font-serif text-[1.8rem] sm:text-[2.4rem] md:text-[2.8rem] text-champagne leading-tight font-light"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-8 sm:mb-10" data-reveal>
            <span className="h-px flex-1 bg-gradient-to-r from-gold/50 to-transparent" />
            <span className="w-1.5 h-1.5 rotate-45 bg-gold inline-block" />
            <span className="h-px w-8 bg-gold/30" />
          </div>

          {/* Closing quote credit */}
          <p className="font-serif italic text-champagne/40 text-sm tracking-wider" data-reveal>
            Geovana &amp; Sérgio · 2026
          </p>

          {/* Giant closing quote */}
          <span
            className="font-serif text-[9rem] sm:text-[12rem] leading-none text-gold/10 select-none absolute -bottom-16 -right-4 sm:-right-6"
            aria-hidden
          >
            "
          </span>
        </div>
      </div>
    </section>
  );
}

function InfoCards() {
  const cards = [
    { label: "Data", value: "28 de Junho", sub: "2026 · Sábado", icon: <CalIcon /> },
    { label: "Horário", value: "12h00", sub: "Cerimônia ao meio-dia", icon: <ClockIcon /> },
    {
      label: "Local",
      value: "Av. Marginal do CSU, 1455",
      sub: "",
      icon: <PinIcon />,
      cta: {
        label: "Ver no Mapa →",
        href:
          "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent("Av. Marginal do CSU, 1455"),
      },
    },
    {
      label: "Bebida",
      value: "Traga sua bebida",
      sub: "Cerveja, Refrigerante, Suco",
      icon: <DrinkIcon />,
    },
  ];
  return (
    <section className="py-16 sm:py-24 md:py-32 px-5 sm:px-6 bg-cream text-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold-soft mb-3" data-reveal>
            — Detalhes —
          </p>
          <AnimatedText
            as="h2"
            text="Nosso Grande Dia"
            split="chars"
            stagger={0.03}
            className="font-serif text-4xl sm:text-5xl md:text-6xl text-ink"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {cards.map((c) => (
            <div
              key={c.label}
              className="bg-white/70 border border-gold/20 rounded-md p-6 sm:p-8 hover:border-gold/50 hover:bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              data-reveal
            >
              <div className="text-gold-soft mb-4 sm:mb-5">{c.icon}</div>
              <p className="text-[10px] tracking-[0.35em] uppercase text-gold-soft mb-2">
                {c.label}
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl text-ink mb-1 break-words lining-nums">
                {c.value}
              </h3>
              {c.sub && <p className="text-ink/55 text-sm">{c.sub}</p>}
              {c.cta && (
                <a
                  href={c.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center mt-4 sm:mt-5 px-5 py-2.5 rounded-full bg-ink text-cream text-xs tracking-[0.18em] uppercase hover:bg-ink/85 transition min-h-[44px] leading-none"
                >
                  {c.cta.label}
                </a>
              )}
            </div>
          ))}
          <div
            className="sm:col-span-2 lg:col-span-4 relative bg-white/80 border border-gold/25 rounded-md p-8 sm:p-10 md:p-14 overflow-hidden"
            data-reveal
          >
            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 md:gap-8 items-start md:items-center">
              <div>
                <div className="text-gold-soft mb-4 sm:mb-5">
                  <GiftIcon />
                </div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-gold-soft mb-2">
                  Lista de Presentes
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-ink mb-3">
                  Nosso Ninho de Amor
                </h3>
                <p className="text-ink/65 italic max-w-md text-sm sm:text-base">
                  "Contribua para realizarmos nossos sonhos juntos."
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollToId("gifts")}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-gold text-ink font-medium tracking-[0.18em] uppercase text-xs whitespace-nowrap hover:bg-gold-soft transition min-h-[44px] w-full md:w-auto"
              >
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
    if (!name.trim()) {
      push("Informe seu nome", "error");
      return;
    }
    const list = JSON.parse(localStorage.getItem("wg_rsvp") || "[]");
    list.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      message: message.trim(),
      at: Date.now(),
    });
    localStorage.setItem("wg_rsvp", JSON.stringify(list));
    setDone(true);
  };

  return (
    <section id="rsvp" className="py-20 sm:py-28 md:py-40 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto" data-reveal>
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold/80 mb-3" data-reveal>
            — CONFIRMAÇÃO —
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-champagne" data-reveal>
            Confirme sua <span className="italic text-gradient-gold">Presença</span>
          </h2>
          <p className="text-champagne/60 mt-4 sm:mt-5 italic text-sm sm:text-base" data-reveal>
            Sua presença é o maior presente que poderíamos receber.
          </p>
        </div>
        {done ? (
          <div className="text-center bg-card/60 border border-gold/30 rounded-md p-8 sm:p-12">
            <div className="text-5xl text-gradient-gold mb-4">✦</div>
            <h3 className="font-serif text-2xl sm:text-3xl text-champagne mb-2">
              Presença confirmada!
            </h3>
            <p className="text-champagne/60 italic text-sm sm:text-base">
              Mal podemos esperar para celebrar com você.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="bg-card/40 backdrop-blur border border-gold/15 rounded-md p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6"
          >
            <Field label="Nome Completo">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Como você gostaria de ser chamado"
              />
            </Field>
            <Field label="Mensagem Especial">
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Deixe uma mensagem para o casal (opcional)"
              />
            </Field>
            <button
              type="submit"
              className="shimmer w-full py-4 rounded bg-gradient-to-r from-[#8a6f3d] via-[#c9a96e] to-[#8a6f3d] text-ink font-medium tracking-[0.2em] uppercase text-xs min-h-[48px]"
            >
              Confirmar Presença
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Closing({ onScrollToRsvp }: { onScrollToRsvp: () => void }) {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <img
        src={closingImg}
        alt="Cerimônia"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
      <ParticleCanvas />
      <div className="relative z-10 text-center px-5 sm:px-6 max-w-3xl py-16 sm:py-20">
        <div className="text-4xl text-gradient-gold mb-6 sm:mb-8" data-reveal>
          ✦
        </div>
        <AnimatedText
          as="p"
          text="Mal podemos esperar para viver esse momento com você."
          split="words"
          stagger={0.05}
          duration={1.1}
          className="font-serif text-2xl sm:text-3xl md:text-5xl text-champagne font-light leading-tight italic"
        />
        <div className="gold-rule w-20 sm:w-24 mx-auto my-8 sm:my-10" data-rule-grow />
        <AnimatedText
          as="p"
          text="Geovana & Sérgio"
          split="chars"
          stagger={0.05}
          className="font-serif text-xl sm:text-2xl md:text-3xl text-gradient-gold mb-8 sm:mb-10"
        />
        <button
          onClick={onScrollToRsvp}
          className="group inline-flex items-center gap-4 sm:gap-6 px-2 py-3 border-b border-gold/40 hover:border-gold transition-colors duration-500"
        >
          <span className="font-serif italic text-lg sm:text-xl md:text-2xl text-gradient-gold tracking-wide">
            Nos vemos no altar
          </span>
          <span
            aria-hidden="true"
            className="text-gold text-xl sm:text-2xl transition-transform duration-500 group-hover:translate-y-1 animate-bounce-slow"
          >
            ↓
          </span>
        </button>
        <div className="mt-14 sm:mt-20 border-t border-gold/15 pt-8 sm:pt-10">
          <p className="text-champagne/60 text-sm">Com todo o nosso amor,</p>
          <p className="font-serif italic text-lg sm:text-xl text-champagne mt-2">
            Geovana Stefany &amp; Sérgio Vasconcelos
          </p>
          <p className="text-[10px] tracking-[0.4em] sm:tracking-[0.5em] uppercase text-gold/80 mt-4">
            15 · 11 · 2026
          </p>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  "w-full bg-input/60 border border-border rounded px-4 py-3 text-base sm:text-sm text-champagne placeholder:text-champagne/40 focus:border-gold/60 focus:outline-none min-h-[48px]";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.3em] uppercase text-champagne/60 block mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ICONS */
function CalIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function EnvIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M3 12h18M12 8v13M8 8a2.5 2.5 0 1 1 4-2 2.5 2.5 0 1 1 4 2" />
    </svg>
  );
}
function DrinkIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M6 3h12l-1 5a5 5 0 0 1-10 0L6 3z" />
      <path d="M12 13v6M9 21h6" />
    </svg>
  );
}

function Gifts() {
  const { data: giftsData, isLoading: giftsLoading } = useQuery(giftsQuery);
  const { data: purchasedData } = useQuery(purchasedIdsQuery);
  const gifts: Gift[] = giftsData?.gifts ?? [];
  const purchasedIds = new Set(purchasedData?.giftIds ?? []);
  const [activeCat, setActiveCat] = useState("Todos");
  const [selected, setSelected] = useState<Gift | null>(null);

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(gifts.map((g) => g.category)))],
    [gifts],
  );
  const filtered = useMemo(
    () => (activeCat === "Todos" ? gifts : gifts.filter((g) => g.category === activeCat)),
    [gifts, activeCat],
  );

  return (
    <section id="gifts" className="relative py-16 sm:py-24 md:py-32 px-5 sm:px-6 bg-cream text-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold-soft mb-3" data-reveal>
            — Lista de Presentes —
          </p>
          <AnimatedText
            as="h2"
            text="Nosso Ninho de Amor"
            split="chars"
            stagger={0.03}
            className="font-serif text-4xl sm:text-5xl md:text-6xl text-ink"
          />
          <div className="gold-rule w-20 sm:w-24 mx-auto my-6 sm:my-8" data-rule-grow />
          <AnimatedText
            as="p"
            text="Seu presente é uma forma de fazer parte da nossa história. Cada gesto de amor transforma o nosso começo."
            split="words"
            stagger={0.02}
            className="max-w-xl mx-auto text-ink/70 leading-relaxed text-sm md:text-base font-light"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8 sm:mb-10">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-4 sm:px-5 py-2 text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.18em] uppercase rounded-full border transition-all min-h-[40px] ${activeCat === c ? "bg-gold text-ink border-gold" : "border-gold/40 text-ink/70 hover:border-gold hover:text-gold-soft"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {giftsLoading && (
            <p className="col-span-full text-center text-ink/50 italic py-10">Carregando presentes...</p>
          )}
          {filtered.map((gift) => {
            const taken = purchasedIds.has(gift.id);
            return (
              <article
                key={gift.id}
                data-reveal
                className={`group relative rounded-lg border overflow-hidden flex flex-col transition-all duration-500 bg-white ${taken ? "opacity-60 grayscale border-border/40" : "border-gold/25 hover:border-gold/70 hover:shadow-[0_30px_80px_-30px_rgba(201,169,110,0.45)] hover:-translate-y-1"}`}
              >
                <div className="relative h-52 sm:h-48 overflow-hidden flex items-center justify-center bg-cream-muted">
                  {gift.imageUrl ? (
                    <img
                      src={gift.imageUrl}
                      alt={gift.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="text-6xl drop-shadow-[0_8px_24px_rgba(201,169,110,0.4)] transition-transform duration-700 group-hover:scale-110"
                      style={{ color: gift.accent }}
                    >
                      {gift.icon}
                    </div>
                  )}
                  <span className="absolute top-3 left-3 text-[0.6rem] tracking-[0.3em] uppercase bg-white/85 backdrop-blur px-2.5 py-1 rounded text-gold-soft">
                    {gift.category}
                  </span>
                  {taken && (
                    <span className="absolute top-3 right-3 text-[0.6rem] tracking-[0.2em] uppercase text-gold-soft bg-white/85 px-2.5 py-1 rounded">
                      ✦ Presenteado
                    </span>
                  )}
                </div>
                <div className="p-5 sm:p-6 flex-1 flex flex-col bg-white">
                  <h3 className="font-serif text-xl sm:text-2xl text-ink mb-2">{gift.title}</h3>
                  <p className="text-ink/60 text-xs leading-relaxed mb-4 line-clamp-2">
                    {gift.description}
                  </p>
                  <div className="mt-auto pt-4 border-t border-gold/20 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[9px] tracking-[0.3em] uppercase text-ink/45">
                        Valor sugerido
                      </div>
                      <div className="text-gradient-gold font-serif text-lg sm:text-xl truncate">
                        {formatBRL(gift.priceCents)}
                      </div>
                    </div>
                    <button
                      disabled={taken}
                      onClick={() => setSelected(gift)}
                      className="shrink-0 px-4 py-2.5 rounded border border-gold text-gold-soft hover:bg-gold hover:text-ink transition-all text-[0.7rem] sm:text-[0.72rem] tracking-[0.12em] uppercase disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
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
