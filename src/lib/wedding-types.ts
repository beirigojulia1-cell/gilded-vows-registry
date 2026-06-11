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
  // Chapter 1
  chapter1Tag: string;
  chapter1Title: string;
  chapter1Year: string;
  chapter1Text: string;
  chapter1ImageUrl: string;
  chapter1FocusY: string;
  // Chapter 2
  chapter2Tag: string;
  chapter2Title: string;
  chapter2Year: string;
  chapter2Text: string;
  chapter2ImageUrl: string;
  chapter2FocusY: string;
  // Chapter 3
  chapter3Tag: string;
  chapter3Title: string;
  chapter3Year: string;
  chapter3Text: string;
  chapter3ImageUrl: string;
  chapter3FocusY: string;
  // Chapter 4
  chapter4Tag: string;
  chapter4Title: string;
  chapter4Year: string;
  chapter4Text: string;
  chapter4ImageUrl: string;
  chapter4FocusY: string;
};

export const SITE_CONTENT_DEFAULTS: SiteContent = {
  name1: "Geovana Stefany",
  name2: "Sérgio Vasconcelos",
  heroSubtitle: "Casamento · 2026",
  heroTag: "Uma história escrita pelo destino.",
  quoteMain: `Em 2016, eu ia buscar a irmã da minha amiga na escola e sempre via ele indo buscar o irmão. Comentava com ela que achava ele bonitinho, mas nunca imaginei que nossa história começaria de verdade depois de um tempo.\n\nDois anos depois, uma amiga que era amiga dele também nos apresentou e, desde então, viramos melhores amigos. Conversávamos todos os dias e, mesmo morando perto um do outro, nossa amizade era mais virtual (até a gente começar a estudar junto).\n\nEm 2022 ficamos mais próximos e nossos amigos Júlia e Alexandre resolveram dar uma ajudinha e acabaram sendo nossos cupidos. Foi aí que tudo mudou. Desde o nosso primeiro beijo, nunca mais nos desgrudamos.\n\nDepois de um ano de namoro veio o pedido de noivado… e hoje estamos vivendo a realização do nosso tão esperado “sim”.`,
  quoteItalic: "",
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
  // Chapter 1
  chapter1Tag: "Primeiro Capítulo",
  chapter1Title: "Primeiro Encontro",
  chapter1Year: "2019",
  chapter1Text: "Naquele dia, o universo conspirou para que dois caminhos se cruzassem. Um olhar que durou apenas um instante — mas que mudaria tudo para sempre.",
  chapter1ImageUrl: "",
  chapter1FocusY: "15",
  // Chapter 2
  chapter2Tag: "Segundo Capítulo",
  chapter2Title: "Primeira Viagem",
  chapter2Year: "2020",
  chapter2Text: "Descobrir o mundo juntos revelou que o melhor destino nunca é um lugar — é a pessoa ao seu lado.",
  chapter2ImageUrl: "",
  chapter2FocusY: "15",
  // Chapter 3
  chapter3Tag: "Terceiro Capítulo",
  chapter3Title: "Momentos Especiais",
  chapter3Year: "2021 — 2023",
  chapter3Text: "Cada risada compartilhada, cada silêncio confortável, cada momento ordinário transformado em memória preciosa e eterna.",
  chapter3ImageUrl: "",
  chapter3FocusY: "15",
  // Chapter 4
  chapter4Tag: "Quarto Capítulo",
  chapter4Title: "Pedido de Casamento",
  chapter4Year: "2024",
  chapter4Text: "\"Você quer casar comigo?\" — e o tempo parou. O coração respondeu antes mesmo das palavras. Sim. Para sempre. Sim.",
  chapter4ImageUrl: "",
  chapter4FocusY: "15",
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
