## Objetivo
Deixar a seção **Lista de Presentes** (Gifts) no tema branco/claro, consistente com as seções Gallery e InfoCards.

## Mudanças

### src/routes/index.tsx — Seção Gifts()
- Substituir `bg-background` por `bg-cream`.
- Substituir `text-champagne` nos títulos/textos por `text-ink`.
- Substituir `text-champagne/70`, `text-champagne/55`, `text-champagne/40` por variações de `text-ink` com opacidade correspondente.
- Ajustar bordas dos cards: `border-gold/15` → manter dourado pois funciona em ambos os temas, mas verificar contraste.
- Ajustar overlay do card (`bg-black/45 backdrop-blur-sm` na info) para um fundo claro que mantenha legibilidade, provavelmente `bg-white/70` com `text-ink`.
- Botões e filtros: manter estilo dourado, ajustar classes de hover/contraste se necessário.

## Fora do escopo
- PurchaseModal (manterá tema escuro por enquanto, já que é um modal separado).
- Outras seções do site.