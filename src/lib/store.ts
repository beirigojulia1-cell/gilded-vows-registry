// localStorage data layer for wedding gift app

export type Gift = {
  id: string;
  title: string;
  category: string;
  priceCents: number;
  icon: string;
  description?: string;
  imageUrl?: string;
  gradient?: string;
  accent?: string;
};

export type Purchase = {
  id: string;
  giftId: string;
  guestName: string;
  message: string;
  createdAt: number;
  read?: boolean;
};

export type Settings = {
  coupleNames: string;
  weddingDate: string;
  pixKey: string;
  pixName: string;
  pixCity: string;
};

import talheresAsset from "@/assets/talheres-tramontina.jpeg.asset.json";
import fureAsset from "@/assets/fure-profissional.jpeg.asset.json";
import panoAsset from "@/assets/pano-de-prato.jpeg.asset.json";

const K = {
  gifts: "wg_gifts_v3",
  purchases: "wg_purchases_v3",
  settings: "wg_settings_v2",
  pass: "wg_admin_pass",
  lockout: "wg_lockout",
  attempts: "wg_attempts",
  session: "wg_admin_session",
};

const DEFAULT_GIFTS: Gift[] = [
  {
    id: "g01",
    title: "Jogo de Talheres Tramontina Búzios",
    description: "24 peças em aço inox para compor a nossa mesa em todos os jantares a dois.",
    priceCents: 18000,
    category: "Lar",
    icon: "🍴",
    imageUrl: talheresAsset.url,
    gradient: "linear-gradient(135deg,#0d0b08,#1a1308,#0d0b08)",
    accent: "#c9a96e",
  },
  {
    id: "g02",
    title: "Fuê Profissional 25 e 30cm",
    description: "Par de fuês profissionais para as receitas que vamos preparar juntos no nosso novo lar.",
    priceCents: 6000,
    category: "Lar",
    icon: "🥄",
    imageUrl: fureAsset.url,
    gradient: "linear-gradient(135deg,#080c0f,#0c1318,#080c0f)",
    accent: "#8ab4d4",
  },
  {
    id: "g03",
    title: "Jogo de Pano de Prato (4 un.)",
    description: "Conjunto com 4 panos de prato de algodão para o dia a dia da nossa cozinha.",
    priceCents: 5000,
    category: "Lar",
    icon: "🧺",
    imageUrl: panoAsset.url,
    gradient: "linear-gradient(135deg,#0f0a08,#1a1210,#0f0a08)",
    accent: "#d4a8a0",
  },
];

const DEFAULT_SETTINGS: Settings = {
  coupleNames: "Geovana & Sérgio",
  weddingDate: "2026-11-15T17:00:00-03:00",
  pixKey: "geovana@email.com",
  pixName: "Geovana Stefany",
  pixCity: "São Paulo",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("wg:update", { detail: { key } }));
}

export const store = {
  getGifts: (): Gift[] => read(K.gifts, DEFAULT_GIFTS),
  setGifts: (g: Gift[]) => write(K.gifts, g),
  resetGifts: () => write(K.gifts, DEFAULT_GIFTS),

  getPurchases: (): Purchase[] => read(K.purchases, []),
  setPurchases: (p: Purchase[]) => write(K.purchases, p),
  addPurchase: (p: Omit<Purchase, "id" | "createdAt">) => {
    const arr = store.getPurchases();
    arr.unshift({ ...p, id: crypto.randomUUID(), createdAt: Date.now(), read: false });
    write(K.purchases, arr);
  },

  getSettings: (): Settings => ({ ...DEFAULT_SETTINGS, ...read(K.settings, {} as Partial<Settings>) }),
  setSettings: (s: Settings) => write(K.settings, s),

  getPassHash: (): string | null => (typeof window !== "undefined" ? localStorage.getItem(K.pass) : null),
  setPassHash: (h: string) => localStorage.setItem(K.pass, h),

  isLockedOut: (): number => {
    if (typeof window === "undefined") return 0;
    const until = Number(sessionStorage.getItem(K.lockout) || 0);
    return until > Date.now() ? until : 0;
  },
  registerFailedAttempt: () => {
    const n = Number(sessionStorage.getItem(K.attempts) || 0) + 1;
    sessionStorage.setItem(K.attempts, String(n));
    if (n >= 5) {
      sessionStorage.setItem(K.lockout, String(Date.now() + 5 * 60 * 1000));
      sessionStorage.setItem(K.attempts, "0");
    }
  },
  clearAttempts: () => {
    sessionStorage.removeItem(K.attempts);
    sessionStorage.removeItem(K.lockout);
  },
  isLoggedIn: (): boolean => (typeof window !== "undefined" ? sessionStorage.getItem(K.session) === "1" : false),
  setLoggedIn: (v: boolean) => (v ? sessionStorage.setItem(K.session, "1") : sessionStorage.removeItem(K.session)),
};

export async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function ensureDefaultPassword() {
  if (typeof window === "undefined") return;
  if (!store.getPassHash()) {
    sha256("casal2026").then((h) => store.setPassHash(h));
  }
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function useStoreSubscribe(callback: () => void) {
  if (typeof window === "undefined") return;
  const handler = () => callback();
  window.addEventListener("wg:update", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("wg:update", handler);
    window.removeEventListener("storage", handler);
  };
}
