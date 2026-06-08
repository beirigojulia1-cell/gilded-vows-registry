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

export type Settings = {
  coupleNames: string;
  weddingDate: string;
  pixKey: string;
  pixName: string;
  pixCity: string;
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
