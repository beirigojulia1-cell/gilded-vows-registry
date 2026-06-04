## Objetivo

Transformar o site em uma única página rolável (sem rota separada de presentes), tocar a música "Ed Sheeran – Photograph" automaticamente, oferecer fallback de play quando o autoplay for bloqueado, otimizar performance e corrigir bugs.

## 1. Música de fundo (autoplay + fallback)

- Upload do `Ed Sheeran - Photograph.mp3` via `lovable-assets` → `src/assets/photograph.mp3.asset.json` (CDN, não fica no bundle).
- Novo componente `src/components/MusicPlayer.tsx`:
  - `<audio>` oculto, `loop`, `preload="auto"`, volume inicial 0.35 (fade-in suave até 0.6 em 2s via Web Audio quando começar a tocar).
  - Tenta `audio.play()` no mount. Se a Promise rejeitar (Safari/iOS/Chrome com autoplay bloqueado), exibe um botão flutuante discreto no canto **inferior esquerdo** (gold, 44×44, ícone Play da `lucide-react`), com `aria-label="Tocar música"` e tooltip "Tocar música".
  - Quando estiver tocando, o ícone troca para um par de notas musicais com leve animação pulse; clique pausa/retoma. Ícone visível mas minimalista (não cobre conteúdo, `z-40`).
  - Persistência da preferência (play/pause) em `localStorage` para não reiniciar a cada navegação interna.
  - Reage ao primeiro `pointerdown`/`keydown` do usuário tentando dar play novamente caso o autoplay tenha falhado (gesto do usuário desbloqueia em todos os navegadores).
- Montado uma única vez no `__root.tsx` para não recriar o `<audio>` entre renders.

## 2. Página única (remover rota `/gifts`)

- Apagar `src/routes/gifts.tsx` (e referências em `routeTree.gen.ts` são regeneradas).
- Criar nova seção `Gifts` em `src/routes/index.tsx`, inserida **antes do `RSVP`** e **depois do `InfoCards`** com:
  - Cabeçalho com `eyebrow`, título "Lista de Presentes / Nosso Ninho de Amor" e parágrafo.
  - Filtros por categoria (chips) reaproveitando lógica atual.
  - Grid responsivo dos cards (mesmo visual do `gifts.tsx`).
  - `PurchaseModal` reaproveitado (já existe).
- No `InfoCards`, trocar o `<Link to="/gifts">` por um botão que faz `scrollIntoView` na seção `#gifts` (smooth via Lenis já presente).
- Manter a rota `/admin` intacta (continua acessível diretamente).

## 3. Otimizações de performance

- **Imagens**: gerar versões `.webp` via `lovable-assets` para hero, chapters, gallery e closing; importar como `.asset.json` para sair do bundle JS e usar CDN com cache agressivo. Adicionar `decoding="async"`, `loading="lazy"` em tudo exceto `hero` (que recebe `fetchpriority="high"` + `loading="eager"`).
- **GSAP**: refatorar para um único `useEffect` com `gsap.context`, usar `matchMedia` para desabilitar ScrollTrigger em `prefers-reduced-motion` e em telas `< 768px` (mantém só fades simples), reduzindo trabalho em mobile.
- **Particles**: limitar `ParticleCanvas` a 1 instância visível por vez via `IntersectionObserver` (pausa quando fora da viewport); reduzir densidade em mobile.
- **Cursor customizado**: desabilitar em touch devices (`matchMedia('(pointer: coarse)')`).
- **Lenis SmoothScroll**: desativar em `prefers-reduced-motion`.
- **Code-split**: `PurchaseModal` e `CountdownTimer` via `React.lazy` + `Suspense` para enxugar o bundle inicial.
- **Fonts**: garantir `font-display: swap` no `@import` do Google Fonts.

## 4. Bugs identificados a corrigir

- `RSVP({ ref })` em `src/routes/index.tsx` usa `ref` como prop comum → não funciona como ref real. Substituir por `forwardRef` (ou expor via `useImperativeHandle`/passar `id="rsvp"` e fazer scroll por seletor). Solução escolhida: dar `id="rsvp"` à seção e remover a prop `ref` totalmente; o botão do `Closing` faz `document.getElementById('rsvp')?.scrollIntoView`.
- `Loader` desaparece após 700ms mas fica sempre no DOM. Adicionar `display: none` após `done` para liberar GPU.
- `CustomCursor` provoca jank em alguns devices — esconder em mobile (ver acima).
- `Link to="/gifts"` deixaria de existir → removido junto com a refatoração.
- `PurchaseModal` define `document.body.style.overflow = "hidden"` mas o Lenis controla scroll; trocar para `lenis.stop()`/`lenis.start()` quando disponível, caindo no overflow hidden como fallback.
- `useStoreSubscribe` retorna `void | (() => void)`; o `useEffect` em `gifts` chama `return cleanup` mesmo quando `undefined` (SSR). Garantir retorno sempre função (no-op no SSR).
- Imports não utilizados (`useRef` em `Landing` após mudar RSVP) removidos para não falhar no lint strict.

## 5. SEO / meta

- Atualizar `head()` do `index` para refletir página única (descrição inclui "Lista de presentes e RSVP").
- Remover `head()` da rota `/gifts` (deletada).

## Arquivos afetados

- `src/assets/photograph.mp3.asset.json` (novo, via CLI)
- `src/components/MusicPlayer.tsx` (novo)
- `src/routes/__root.tsx` (montar `MusicPlayer`)
- `src/routes/index.tsx` (seção Gifts inline, fix RSVP ref, lazy imports, scroll para gifts)
- `src/routes/gifts.tsx` (apagado)
- `src/components/PurchaseModal.tsx` (integração com Lenis)
- `src/components/CustomCursor.tsx` (skip em touch)
- `src/components/SmoothScroll.tsx` (respeitar reduced-motion)
- `src/components/ParticleHero.tsx` (IntersectionObserver + densidade mobile)
- `src/lib/store.ts` (no-op cleanup em SSR)
- Possíveis novos `.asset.json` para imagens convertidas a webp (best-effort; se a conversão falhar, manter JPGs originais).

Sem mudanças em rotas além da remoção de `/gifts`. Estilos globais inalterados exceto pequenas classes utilitárias para o botão de música.
