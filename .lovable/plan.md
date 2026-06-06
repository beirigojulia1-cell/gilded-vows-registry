## O que vai mudar

Duas frentes:

### 1. Clarear a hero
Reduzir bastante o overlay escuro que cobre a foto `sentados-banco.jpeg`, mantendo legibilidade dos textos com sombra/glow sutil.

- Trocar o overlay atual (gradiente preto pesado) por um overlay bem mais leve — apenas o suficiente para garantir contraste nos textos.
- Adicionar `text-shadow` discreto nos títulos (nome do casal, data, contagem regressiva) para legibilidade sem precisar escurecer a foto.
- Manter a vinheta inferior bem sutil só para a transição com a próxima seção.

**Arquivo:** `src/routes/index.tsx` (seção Hero, classes do overlay).

### 2. Integração Mercado Pago — Checkout Pro

Fluxo: usuário clica "Presentear" no card → modal mostra opção "Pagar com Mercado Pago" → backend cria uma `preference` no MP → redireciona para o checkout do MP (PIX, cartão, boleto) → MP devolve para uma página de sucesso/falha no nosso site → webhook do MP confirma o pagamento e marca o presente como comprado automaticamente.

#### Etapa A — Você criar a aplicação no Mercado Pago (eu te guio)

1. Acessar https://www.mercadopago.com.br/developers/panel/app
2. Clicar em **"Criar aplicação"**
3. Preencher:
   - **Nome:** Casamento Geovana & Sérgio (ou o que preferir)
   - **Modelo de integração:** "Pagamentos online"
   - **Produto:** "Checkout Pro"
   - **Pergunta sobre CRM:** Não
4. Dentro da aplicação criada, ir em **"Credenciais de produção"** e copiar:
   - **Access Token de Produção** (começa com `APP_USR-...`)
5. Em **"Webhooks"**, configurar:
   - URL: `https://project--49a1a88a-23ea-47f0-baf7-04f5de917c0e.lovable.app/api/public/mercadopago/webhook`
   - Eventos: marcar **"Pagamentos"**

> Enquanto você não tiver, posso configurar primeiro com o **Access Token de TESTE** (`TEST-...`) que aparece na aba "Credenciais de teste" — funciona com cartões de teste do MP, sem dinheiro real. Depois é só trocar o secret pelo de produção.

#### Etapa B — Implementação no projeto

**Secret necessário:** `MERCADOPAGO_ACCESS_TOKEN` (eu peço via a ferramenta de secrets depois que a etapa A estiver pronta).

**Novos arquivos:**
- `src/lib/mercadopago.functions.ts` — server function `createMpPreference({ giftId, guestName, message })` que:
  1. Lê o presente em `DEFAULT_GIFTS` pelo id, valida valor.
  2. Chama `POST https://api.mercadopago.com/checkout/preferences` com o Access Token.
  3. Define `back_urls` apontando para `/presente/sucesso`, `/presente/falha`, `/presente/pendente` e `auto_return: "approved"`.
  4. Coloca `external_reference` = id único da intenção (UUID), e `metadata` com `giftId`, `guestName`, `message`.
  5. Retorna `{ init_point }` (URL de redirecionamento).
- `src/routes/api/public/mercadopago/webhook.ts` — server route `POST` que:
  1. Lê `?type=payment&data.id=...`.
  2. Faz `GET https://api.mercadopago.com/v1/payments/{id}` para obter status real.
  3. Se `status === "approved"`, registra a compra (ver "armazenamento" abaixo).
  4. Retorna `200 OK` rápido para o MP não re-tentar.
- `src/routes/presente.sucesso.tsx`, `src/routes/presente.falha.tsx`, `src/routes/presente.pendente.tsx` — páginas simples de retorno (mensagem + botão "voltar para lista").

**Arquivos editados:**
- `src/components/PurchaseModal.tsx` — substituir o atual fluxo de "PIX estático + confirmação manual" por um botão "Pagar com Mercado Pago" que chama `createMpPreference` e faz `window.location.href = init_point`. Mantém os campos nome + mensagem.

#### Armazenamento das compras confirmadas

**Problema:** hoje as compras estão em `localStorage` (cada navegador tem a sua). Isso não funciona para um webhook server-side — o servidor precisa gravar em algum lugar persistente compartilhado, senão o presente nunca aparece como "já dado" para outros visitantes.

**Solução proposta:** ativar **Lovable Cloud** (banco compartilhado) e criar uma tabela `purchases` (id, gift_id, guest_name, message, mp_payment_id, status, created_at) com RLS pública de leitura e escrita apenas via service role no webhook. A lista de presentes na home passa a ler dessa tabela.

> Se você não quiser ativar Cloud agora, alternativa: deixo o webhook só logando, e a confirmação continua manual via admin — mas aí perdemos a automação. **Recomendo fortemente ativar Cloud** para esse fluxo fazer sentido.

## Fora do escopo (para depois)

- Painel admin mostrando lista de pagamentos com status do MP.
- Notificação por e-mail quando alguém presenteia.
- Split de pagamento / múltiplos itens no mesmo checkout.

## Ordem de execução

1. Clarear hero (rápido, independente).
2. Confirmar ativação do Lovable Cloud + criar tabela `purchases`.
3. Você criar aplicação no MP e me passar Access Token (via secret).
4. Implementar server function, webhook, páginas de retorno e modal novo.
5. Testar com credenciais de teste, depois trocar para produção.

## Confirme antes de eu construir

- [ ] OK clarear a hero como descrito?
- [ ] OK ativar **Lovable Cloud** para armazenar compras confirmadas?
- [ ] Quer que eu comece já com **Access Token de TESTE** enquanto você cria a aplicação no MP, ou prefere esperar ter a credencial de produção?
