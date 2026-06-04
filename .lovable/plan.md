## Objetivo

Tirar o degradê preto sobre as fotos, fazer as fotos dos capítulos encostarem uma na outra (sem espaço/borda no meio) e resolver a lentidão/atraso do carregamento das imagens.

## 1. Remover degradês das fotos

- `src/routes/index.tsx` → `LoveStory`: remover o `<div>` com `bg-gradient-to-r/l from-background/80 …` que cria a faixa preta sobre a foto de cada capítulo. A foto fica limpa, encostando no bloco de texto.
- `Gallery`: remover (ou reduzir a `opacity-0`) o `bg-gradient-to-t from-black/90 …` que escurece as fotos da galeria por padrão; manter só o hover (palavra dourada) com fundo discreto via `bg-black/40` apenas no estado `group-hover`.
- `Hero` e `Closing`: manter um leve overlay para legibilidade do texto branco (não foi pedido para remover), mas trocar `from-black/40 via-black/60 to-black/95` por algo mais suave (`from-black/30 via-black/40 to-black/80`) para a foto aparecer melhor.

## 2. Fotos dos capítulos encostando uma na outra

Hoje cada capítulo é uma `section` separada em `min-h-screen` com `grid md:grid-cols-2`. As fotos já encostam no texto ao lado, mas verticalmente entre capítulos não há gap (já está colado). O que falta:

- Garantir `gap-0` no grid e remover qualquer `border`/`rounded` nas imagens.
- Remover o overlay degradê citado acima — essa era a única "borda" visual entre foto e texto.
- Em mobile (`grid-cols-1`), encostar foto do capítulo atual na foto/seção do próximo: remover `py-20` do bloco de texto que cria respiro e usar `py-12` apenas; manter altura da foto em `h-[60vh]` sem margem.
- Adicionar `block` nas `<img>` (evita gap inline) e `m-0`.

## 3. Otimizar carregamento das imagens (causa do atraso)

Causa do bug "fotos aparecem depois da página carregar":
- Todas as fotos de capítulo estão com `loading="lazy"`, então só baixam quando entram na viewport, com a animação GSAP de `clip-path` rodando em cima delas → parecem "aparecer atrasadas".
- Imagens originais são JPEGs grandes (300–650KB cada) servidos em tamanho cheio mesmo em telas pequenas.
- O `hero.jpg` ainda está no bundle local (`src/assets/hero.jpg`, 137KB) bloqueando.

Ações:

- **Preload da primeira foto da história**: adicionar `<link rel="preload" as="image" href={chapter1}>` no `head()` do route `/` para começar o download cedo, junto com `fetchpriority="high"` na primeira `<img>` de capítulo.
- **Primeira foto eager**: `loading="eager"` e `decoding="async"` para o `Hero` e para o capítulo 1; demais capítulos continuam `loading="lazy"` mas com `decoding="async"` e `fetchpriority="low"`.
- **Hero local → CDN**: subir `src/assets/hero.jpg` e `src/assets/closing.jpg` para `lovable-assets` (.asset.json) para sair do bundle JS e ganhar cache CDN agressivo.
- **Servir tamanho menor**: usar a query string de redimensionamento do CDN do Lovable (`?w=1280&q=75`) para fotos de capítulo/galeria — reduz 600KB → ~120KB em telas comuns. `srcSet` com 768w/1280w/1920w + `sizes="(max-width: 768px) 100vw, 50vw"` nos capítulos, `sizes="(max-width: 768px) 50vw, 33vw"` na galeria.
- **Placeholder enquanto carrega**: usar `background-color: var(--ink)` no `<div>` que contém a `<img>` para evitar "flash" branco quando a foto ainda não chegou.
- **Reduzir o tempo de loader**: o `Loader` segura a tela por ~1.5s mesmo quando tudo já está pronto. Trocar a barra fake por um listener que avança ao `document.readyState === 'complete'` (com cap de 1.2s para não esperar todas as imagens).

## 4. Bugs adicionais detectados

- `gifts` chama `useStoreSubscribe(...)` dentro de `useEffect` e usa o retorno como cleanup — `useStoreSubscribe` é um hook, não pode ser chamado dentro de `useEffect`. Substituir por `store.subscribe(cb)` (API do store, retorna `unsubscribe`) ou usar `useSyncExternalStore`. Sintoma: erro silencioso no console e cards de presentes podem não atualizar após compra.
- `ParticleCanvas` é montado 2x simultaneamente (Hero + Proposal + Closing) → 3 canvases ativos. Adicionar prop `density` baixa nos secundários e desativar completamente o do `Closing` (já está sobre foto escura, contribui pouco e custa CPU).
- `gsap.context` sem `ScrollTrigger.refresh()` após carregamento das imagens — os triggers calculam offsets antes das fotos terem altura final, causando início de animação no lugar errado. Adicionar `ScrollTrigger.refresh()` em `window.addEventListener('load', …)`.
- `SmoothScroll` (Lenis) não respeita `prefers-reduced-motion`. Adicionar guarda para pular Lenis nesse caso.

## Arquivos afetados

- `src/routes/index.tsx` — remoção dos overlays, ajustes nos capítulos, preload no `head()`, srcSet + sizes + fetchpriority nas imagens, fix do `useStoreSubscribe` em `Gifts`.
- `src/components/Loader.tsx` — encurtar duração e reagir ao `readyState`.
- `src/components/ParticleHero.tsx` — aceitar `density` prop, reduzir nos usos secundários.
- `src/components/SmoothScroll.tsx` — respeitar `prefers-reduced-motion`.
- `src/assets/hero.jpg` e `src/assets/closing.jpg` — mover para `lovable-assets` e apagar os binários do repo.

Sem mudanças em rotas, store, autenticação ou estrutura de dados.
