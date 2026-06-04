## O que vai mudar

Substituir os 8 presentes padrão da seção "Lista de Presentes" pelos 3 itens que você enviou. Categoria única: **Lar**. A integração de pagamento PIX já existe no modal (chave PIX + QR Code) e continua funcionando — futuramente, quando você quiser pagamento automatizado (Mercado Pago / Stripe / PIX dinâmico com confirmação), abrimos outra etapa.

## Itens

1. **Jogo de Talheres Tramontina Búzios 24 peças** — Lar
2. **Fuê Profissional (25cm e 30cm)** — Lar
3. **Jogo de Pano de Prato (4 unidades)** — Lar

### Preços sugeridos (você confirma/ajusta)

| Item | Preço sugerido |
|---|---|
| Jogo de Talheres Tramontina Búzios 24pç | R$ 180,00 |
| Fuê Profissional 25/30cm | R$ 60,00 |
| Jogo de Pano de Prato (4un) | R$ 50,00 |

Se quiser outros valores, me diga antes/depois que eu ajusto.

## Passos técnicos

1. Upload das 3 imagens para o CDN via `lovable-assets` (a partir de `/mnt/user-uploads/`):
   - `jogodetalherestramontina.jpeg`
   - `fureprofissional.jpeg`
   - `Jogodepanodeprato.jpeg`
2. Editar `src/lib/store.ts` → substituir `DEFAULT_GIFTS` pelos 3 novos itens (com `imageUrl` apontando para o `.asset.json.url`, `category: "Lar"`, `priceCents`, `gradient` e `icon`).
3. Limpar `localStorage` antigo bumpando a chave `wg_gifts_v2` → `wg_gifts_v3` (senão usuários que já abriram o site continuam vendo os 8 antigos em cache). Mesma coisa para `wg_purchases_v2` → `wg_purchases_v3` para não misturar compras de IDs antigos.
4. Na seção Gifts do `src/routes/index.tsx`, os filtros de categoria já são dinâmicos — vão mostrar apenas "Lar" automaticamente. Se ficar estranho com só 1 categoria, escondo o filtro.

## Fora do escopo (para depois)

- Integração PIX automatizada com confirmação de pagamento (gateway). O fluxo atual continua: chave PIX + QR Code estático + confirmação manual de quem presenteou.
- Mais itens na lista — é só me mandar foto + nome + preço que eu adiciono.

## Arquivos afetados

- `src/assets/jogodetalheres-tramontina.jpeg.asset.json` (novo)
- `src/assets/fure-profissional.jpeg.asset.json` (novo)
- `src/assets/jogo-pano-de-prato.jpeg.asset.json` (novo)
- `src/lib/store.ts` (DEFAULT_GIFTS + bump das chaves de storage)