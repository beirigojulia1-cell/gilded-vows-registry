Auditoria de responsividade mobile mantendo a identidade (dourado/champagne, serifa). Foco em `src/routes/index.tsx` — nenhuma mudança em paleta, fontes ou backend.

### Seções a revisar e padronizar

1. **Hero** — reduzir tamanho do título no mobile (texto serifa gigante hoje vaza/quebra), garantir que CTAs fiquem visíveis sem precisar rolar, espaçar bordas (`px-5` no mobile).
2. **Quote / Proposal / Closing** — diminuir tipografia mobile, ajustar `py` (hoje `py-28/40` é excessivo), garantir line-height confortável.
3. **LoveStory (Chapters)** — verificar grid 2 colunas no mobile → empilhar com imagem acima do texto e reduzir paddings.
4. **Gallery** — quebrar masonry/grid em 1 coluna no mobile com aspect-ratio fixo (evita imagens enormes consecutivas).
5. **InfoCards** — confirmar grid `1 col mobile → 2 tablet → 4 desktop`, reduzir padding interno e tamanho dos ícones no mobile.
6. **Gifts** — cards em 1 coluna no mobile, 2 em tablet, 3 em desktop; preço/título em tamanho legível sem truncar.
7. **PurchaseModal** — em telas estreitas garantir scroll, tabs PIX/Cartão com toque confortável (≥44px), QR Code centralizado e código PIX com `break-all` para não estourar.
8. **RSVP** — inputs com `text-base` (evita zoom no iOS), botão full-width já está ok.
9. **Admin** (`/admin`) — sidebar/abas viram stack vertical no mobile, tabelas com scroll horizontal.
10. **MusicPlayer / ScrollProgress / CustomCursor** — desabilitar cursor customizado em touch; player com posição segura (não cobrir CTAs).

### Padrões aplicados em todas as seções
- Padding lateral mínimo: `px-5 md:px-8`
- Padding vertical: reduzir `py-28/40` para `py-16 md:py-28 lg:py-40`
- Títulos serifa: escala fluida (`text-4xl sm:text-5xl md:text-6xl lg:text-7xl`)
- Body: `text-sm md:text-base`, line-height generoso
- Botões: altura mínima 44px (toque), `text-xs` no mobile
- Imagens: `w-full h-auto` com `aspect-ratio` quando necessário para evitar layout shift
- `overflow-x-hidden` no root para evitar scroll horizontal acidental

### Fora do escopo
- Sem mudanças de paleta/fonte
- Sem reorganização de seções (mesma ordem)
- Sem novo conteúdo
- Sem alterações em servidor/banco