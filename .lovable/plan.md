## Objetivo

Refazer a home do casamento pensando primeiro na experiência do convidado: informações essenciais aparecem rápido e em ordem útil, as fotos carregam sem delay e ficam encostadas uma na outra, e os bugs visuais (cursor, loader, gifts, partículas) somem.

## 1. Nova ordem da home (foco no convidado)

Hoje a ordem é Hero → Quote → História → Galeria → Frase → Countdown → Info → Presentes → RSVP → Closing. O convidado precisa rolar muito até chegar nos dados práticos.

Nova ordem:

```text
1. Hero (nomes + data + 2 CTAs: "Confirmar Presença" e "Ver Detalhes")
2. Detalhes do evento (data, horário, local, dress code) — logo no início
3. Countdown
4. Nossa História (4 capítulos, foto + texto encostando)
5. Galeria
6. Lista de Presentes
7. RSVP (confirmação de presença)
8. Closing
```

Hero ganha 2 botões dourados — o principal ("Confirmar Presença") rola direto pro RSVP, o secundário ("Ver Local e Horário") rola pros Detalhes. Sem mexer em rotas, store, admin nem schema.

## 2. Fotos encostando edge-to-edge (capítulos da história)

- Remover qualquer `border`, `rounded`, `gap`, `padding` entre a foto e o bloco de texto.
- Grid do capítulo vira `grid md:grid-cols-2 gap-0` com a foto ocupando 100% da metade (sem `h-[60vh]` em mobile que cria respiro — usar `aspect-[4/5]` em mobile e `h-screen` em desktop).
- `<img>` com `block w-full h-full object-cover m-0`.
- Remover o overlay degradê preto que ainda restar sobre a foto.
- Em mobile, foto do capítulo N encosta direto no texto do capítulo N, que encosta direto na foto do capítulo N+1 (sem `py-20` extra).

## 3. Fotos sem delay (causa do "aparecem depois")

Causa real: imagens grandes (300–650KB) com `loading="lazy"` e clip-path animado por cima — o GSAP roda antes da imagem decodificar, dando a sensação de "aparecer atrasada".

Ações:

- Preload da 1ª foto da história no `head()` do route `/` (`<link rel="preload" as="image" fetchpriority="high">`).
- `Hero` + capítulo 1: `loading="eager"` `decoding="async"` `fetchpriority="high"`.
- Capítulos 2–4 e galeria: `loading="lazy"` `decoding="async"`.
- Servir tamanhos menores via query do CDN do Lovable: `?w=1280&q=75` nos capítulos/hero, `?w=800&q=75` na galeria. `srcSet` 768w/1280w/1920w + `sizes` corretos.
- `background-color: var(--ink)` no container da foto para evitar flash branco.
- Mover `src/assets/hero.jpg` e `src/assets/closing.jpg` para `lovable-assets` (sair do bundle JS, ganhar cache CDN). Apagar os binários do repo.
- Animação clip-path dos capítulos só dispara depois do `img.onload` (ou usar uma animação mais leve: fade + scale curtinho de 0.6s).

## 4. Loader mais rápido e honesto

Hoje o loader faz contagem fake e segura ~1.5s mesmo com tudo pronto. Vai:

- Sumir assim que `document.readyState === 'complete'` E a 1ª foto do hero tiver carregado.
- Cap máximo de 1.2s pra não esperar todas as imagens da página.
- Barra reflete progresso real (resources carregados), não random.

## 5. Cursor bugado

`CustomCursor` está montado no `__root.tsx`? Verificar — pelo print da preview ele não aparece, mas o componente existe. Vai:

- Garantir que `CustomCursor` é montado no `__root.tsx` e respeita `(pointer: coarse)` (já respeita).
- Esconder cursor nativo (`html { cursor: none }`) só em desktop via `@media (pointer: fine)`.
- Adicionar `pointer-events-none` + `will-change: transform` (já tem) e remover o `mix-blend-difference` que some sobre fundo dourado/preto.
- `scale-150` no hover de links/botões com `transition-transform` mais curta (150ms).

## 6. Bugs adicionais detectados

- `Gifts`: `useStoreSubscribe(...)` chamado dentro de `useEffect` (regra de hooks). A função retorna o `unsubscribe`, mas chamar um hook dentro de `useEffect` quebra HMR e pode duplicar listeners. Substituir por chamada direta `store.subscribe(...)` (não-hook) ou usar `useSyncExternalStore`.
- `ParticleCanvas` montado 3x (Hero + Proposal + Closing) → 3 canvases. Manter só no Hero, remover do Proposal e Closing (Closing já está sobre foto escura).
- `gsap.context` sem `ScrollTrigger.refresh()` após `window.load` → triggers calculam offsets antes da foto ter altura final. Adicionar `ScrollTrigger.refresh()` no `load`.
- `SmoothScroll` (Lenis) não respeita `prefers-reduced-motion`. Adicionar guarda.
- Remover a seção `Quote` ou movê-la para dentro da história (uma frase isolada entre Hero e Detalhes atrasa a entrega da informação ao convidado).
- `Proposal` vira parte do último capítulo (capítulo 4 já é o pedido), evita repetição.

## 7. Arquivos afetados

- `src/routes/index.tsx` — reordenar seções, refazer `LoveStory` (edge-to-edge), Hero com CTAs, remover Quote/Proposal, fix `Gifts.useStoreSubscribe`, srcSet/sizes/fetchpriority/preload.
- `src/components/Loader.tsx` — reagir a `readyState` + cap de 1.2s.
- `src/components/ParticleHero.tsx` — sem mudanças (só remover usos extras).
- `src/components/SmoothScroll.tsx` — respeitar `prefers-reduced-motion`.
- `src/components/CustomCursor.tsx` — `mix-blend-difference` removido, montagem garantida no `__root.tsx`.
- `src/routes/__root.tsx` — montar `CustomCursor`.
- `src/lib/store.ts` — exportar `store.subscribe` não-hook.
- `src/styles.css` — `html { cursor: none }` em desktop.
- `src/assets/hero.jpg` e `src/assets/closing.jpg` — virar `.asset.json` e remover binários.

Sem mudanças em rotas, admin, autenticação, schema ou dados.
