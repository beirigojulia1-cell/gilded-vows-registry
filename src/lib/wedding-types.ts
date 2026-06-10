export type Gift = {
  id: string;
  title: string;
  category: string;
  priceCents: number;
  icon: string;
  description: string | null;
  imageUrl: string | null;
  gradient: string | null;
  accent: string | null;
  sortOrder: number;
};

export type Purchase = {
  id: string;
  giftId: string;
  guestName: string;
  message: string | null;
  read: boolean;
  createdAt: string;
};

/** All site-wide editable content stored in DB (with sensible defaults). */
export type SiteContent = {
  name1: string;
  name2: string;
  heroSubtitle: string;
  heroTag: string;
  quoteMain: string;
  quoteItalic: string;
  locationName: string;
  ceremonyDateLabel: string;
  ceremonyYearLabel: string;
  ceremonyTimeLabel: string;
  ceremonyTimeSub: string;
  drinkNote: string;
  rsvpSubtitle: string;
  closingPhrase: string;
  heroImageUrl: string;
  closingImageUrl: string;
};

export const SITE_CONTENT_DEFAULTS: SiteContent = {
  name1: "Geovana Stefany",
  name2: "Sérgio Vasconcelos",
  heroSubtitle: "Casamento · 2026",
  heroTag: "Uma história escrita pelo destino.",
  quoteMain: "Algumas histórias começam de forma simples…",
  quoteItalic: "mas acabam se tornando eternas.",
  locationName: "Av. Marginal do CSU, 1455",
  ceremonyDateLabel: "28 de Junho",
  ceremonyYearLabel: "2026 · Sábado",
  ceremonyTimeLabel: "12h00",
  ceremonyTimeSub: "Cerimônia ao meio-dia",
  drinkNote: "Cerveja, Refrigerante, Suco",
  rsvpSubtitle: "Sua presença é o maior presente que poderíamos receber.",
  closingPhrase: "Mal podemos esperar para viver esse momento com você.",
  heroImageUrl: "",
  closingImageUrl: "",
};

export type Settings = {
  coupleNames: string;
  weddingDate: string;
  pixKey: string;
  pixName: string;
  pixCity: string;
  content: SiteContent;
};

export type GiftInput = {
  title: string;
  category: string;
  priceCents: number;
  icon: string;
  description?: string | null;
  imageUrl?: string | null;
  gradient?: string | null;
  accent?: string | null;
  sortOrder?: number;
};

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
