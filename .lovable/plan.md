## Refazer a seção "Nossa História" (LoveStory)

Substituir a grade atual com card de imagem aspect-[4/5] por **4 seções full-bleed de altura tela cheia (100vh)**, cada uma dividida 50/50 entre foto e texto, alternando lados conforme as imagens de referência:

| Capítulo | Foto | Texto |
|---|---|---|
| 01 · Primeiro Encontro | esquerda | direita |
| 02 · Primeira Viagem | direita | esquerda |
| 03 · Momentos Especiais | esquerda | direita |
| 04 · Pedido de Casamento | direita | esquerda |

Cada seção:
- `min-h-screen grid md:grid-cols-2` sem padding lateral; foto `w-full h-full object-cover` ocupando a metade inteira até a borda.
- Lado do texto: fundo `bg-background` (#0d0b08), conteúdo centralizado verticalmente com padding generoso (px-12 md:px-20), mantendo a tipografia atual (eyebrow gold tracking, título serif grande, ano em itálico, régua, parágrafo champagne).
- Numeral gigante (01–04) marca d'água em `text-gold/[0.05]` atrás do texto, posicionado no canto inferior do lado da foto (como o "3" tênue visível na imagem 3).
- Mobile: empilhado (foto em cima ocupando 60vh, texto abaixo).

## Animações ao scroll (GSAP ScrollTrigger)

Estender o efeito reveal existente com animações encadeadas e direcionais por capítulo:

1. **Foto** — entra com `clipPath` (inset 100% no lado oposto → 0) + leve scale 1.1→1, duration 1.4s, ease "power3.out", scrub-free, dispara em `top 75%`.
2. **Eyebrow / título / ano / régua / texto** — stagger sequencial (`y: 30, opacity: 0` → 0), delay 0.15 entre elementos, começa quando a seção atinge `top 70%`.
3. **Parallax na imagem** — `yPercent: -8` com scrub durante a seção visível (sutil, não distrai).
4. **Numeral gigante** — fade-in lento + drift horizontal pequeno conforme scrub.
5. **Outras seções já existentes** (Quote, Gallery, Proposal, InfoCards, RSVP, Closing) — adicionar reveal em stagger nos filhos (`data-reveal-stagger`) para que título → régua → corpo apareçam em cascata em vez de bloco único; manter o parallax nas imagens da galeria.

Direção das animações respeita o lado da foto (foto da esquerda revela com clipPath da direita para esquerda; foto da direita o inverso), reforçando o ritmo alternado.

## Arquivos afetados

- `src/routes/index.tsx` — reescrever o componente `LoveStory` e estender o `useEffect` do GSAP com os novos triggers (clipPath, stagger, parallax direcional). Adicionar marcadores `data-reveal-stagger` nas seções complementares.

Sem mudanças em estilos globais, store, rotas ou assets.
