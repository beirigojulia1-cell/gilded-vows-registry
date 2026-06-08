## Animações de texto fluindo + scrolling

Vou turbinar o site mantendo o conteúdo e a estética atual (Lenis já tá ativo), adicionando animações de texto reveladas conforme você rola — estilo editorial/cinemático.

### O que vai mudar

**1. Novo componente `AnimatedText`** (`src/components/AnimatedText.tsx`)
- Quebra o texto em palavras (e/ou letras) e anima cada uma com `gsap` + `ScrollTrigger`.
- Variantes: `words` (palavra a palavra), `lines` (linha por linha tipo cortina), `chars` (letra a letra para títulos curtos).
- Cada palavra entra com `y: 100%`, `opacity: 0`, `filter: blur(8px)` → posição/opacidade/blur zero, com stagger suave.
- Respeita `prefers-reduced-motion`.

**2. Aplicar nos textos-chave de `src/routes/index.tsx`**
- Hero: nomes "Geovana Stefany" e "Sérgio Vasconcelos" em `chars` (letras subindo em cascata).
- Quote ("Algumas histórias começam…"): `words` com blur fluido.
- Cada capítulo da `LoveStory`: tag, título e parágrafo trocam o `data-stagger-item` por `AnimatedText` (palavras fluindo da esquerda, sincronizado com a entrada da foto).
- `Proposal` ("E naquele instante…"): `words` com stagger lento e brilho dourado.
- Galeria, InfoCards, Gifts, RSVP e Closing: títulos de seção viram `AnimatedText` (`lines`).

**3. Efeitos extras de scrolling**
- Parallax sutil já existe — vou adicionar:
  - Headings grudados (`pin`) curtos nas seções Quote e Proposal para dar pausa cinemática (≈ 60% da viewport).
  - Linha dourada (`gold-rule`) que cresce de 0 → 100% com `scrub` em cada divisória.
  - Numeral gigante dos capítulos com leve `scrub` de opacidade/translate para parecer flutuando.
- Um indicador de progresso fino (1px) dourado no topo, ligado ao scroll total.

**4. Lenis / GSAP integração**
- Conectar Lenis ao `ScrollTrigger.update` (hoje não estão sincronizados, então alguns triggers podem disparar fora de hora). Ajustar em `SmoothScroll.tsx` para emitir `lenis.on('scroll', ScrollTrigger.update)` e `gsap.ticker.add(t => lenis.raf(t*1000))`.

### Detalhes técnicos
- Sem libs novas (usa GSAP já instalado). Split manual em JS — sem precisar do plugin pago SplitText.
- Animações cliente-side dentro de `useEffect`, seguras p/ SSR.
- Mobile: reduz amplitude (y 40% em vez de 100%) e desliga blur p/ performance.

### Fora do escopo
- Não mexer em lógica de presentes/compras/admin/Mercado Pago.
- Não trocar fontes nem paleta.
- Não adicionar novas seções.