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

const K = {
  gifts: "wg_gifts_v2",
  purchases: "wg_purchases_v2",
  settings: "wg_settings_v2",
  pass: "wg_admin_pass",
  lockout: "wg_lockout",
  attempts: "wg_attempts",
  session: "wg_admin_session",
};

const GRADIENTS = [
  "linear-gradient(135deg, #2a1f14 0%, #0d0b08 100%)",
  "linear-gradient(135deg, #1f1a2a 0%, #0d0b08 100%)",
  "linear-gradient(135deg, #2a1a1a 0%, #0d0b08 100%)",
  "linear-gradient(135deg, #1a2a24 0%, #0d0b08 100%)",
  "linear-gradient(135deg, #2a241a 0%, #0d0b08 100%)",
  "linear-gradient(135deg, #1a1f2a 0%, #0d0b08 100%)",
  "linear-gradient(135deg, #2a1a26 0%, #0d0b08 100%)",
  "linear-gradient(135deg, #1f2a1a 0%, #0d0b08 100%)",
];

const DEFAULT_GIFTS: Gift[] = [
  { id:"g01", title:"Lua de Mel", description:"Contribua para a viagem mais especial da nossa vida. Cada detalhe desse sonho foi planejado com amor.", priceCents:50000, category:"Viagem", icon:"✈", gradient:"linear-gradient(135deg,#0d0b08,#1a1008,#0d0b08)", accent:"#c9a96e" },
  { id:"g02", title:"Passagens Aéreas", description:"Ajude-nos a voar para o destino dos nossos sonhos. A aventura começa com o primeiro voo.", priceCents:30000, category:"Viagem", icon:"🌍", gradient:"linear-gradient(135deg,#080d12,#0d1520,#080d12)", accent:"#8ab4d4" },
  { id:"g03", title:"Jantar Romântico", description:"Uma noite especial em um restaurante inesquecível, para celebrarmos nossa história de amor.", priceCents:8000, category:"Experiências", icon:"🍷", gradient:"linear-gradient(135deg,#120608,#1e0a0c,#120608)", accent:"#c4647a" },
  { id:"g04", title:"Café da Manhã Especial", description:"O começo perfeito para os nossos dias juntos — repleto de amor, carinho e bons momentos.", priceCents:3000, category:"Experiências", icon:"☕", gradient:"linear-gradient(135deg,#100d06,#1a1308,#100d06)", accent:"#d4a96e" },
  { id:"g05", title:"Decoração da Casa", description:"Ajude-nos a transformar um espaço em um verdadeiro lar. Cada peça conta nossa história.", priceCents:15000, category:"Lar", icon:"🏠", gradient:"linear-gradient(135deg,#080c0f,#0c1318,#080c0f)", accent:"#7ab4b8" },
  { id:"g06", title:"Experiência do Casal", description:"Uma vivência única que sempre sonhamos viver juntos. Uma memória que durará a vida toda.", priceCents:12000, category:"Experiências", icon:"💫", gradient:"linear-gradient(135deg,#0c0810,#150d1e,#0c0810)", accent:"#b48cd4" },
  { id:"g07", title:"Ajuda para a Nova Casa", description:"Contribua com o valor que estiver no seu coração para realizarmos nosso ninho de amor.", priceCents:10000, category:"Lar", icon:"🌸", gradient:"linear-gradient(135deg,#0f0a08,#1a1210,#0f0a08)", accent:"#d4a8a0" },
  { id:"g08", title:"Noite de Spa", description:"Uma tarde de puro relaxamento e bem-estar para dois, celebrando o início de uma nova vida.", priceCents:6000, category:"Experiências", icon:"🌿", gradient:"linear-gradient(135deg,#060c0a,#0a1612,#060c0a)", accent:"#8ad4b4" },
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
