## Problema

Hoje o nome do convidado é capturado no `PurchaseModal` (campo obrigatório "Seu nome" + mensagem opcional), mas quando o pagamento é aprovado o registro é gravado **apenas no `localStorage` do navegador do convidado** (`store.addPurchase`). Resultado: no `/admin` vocês só veem os presentes comprados no próprio navegador de vocês — nunca os de outras pessoas.

A função `createPurchase` (que grava no banco `purchases`) existe, mas deixou de ser chamada depois da migração para o Mercado Pago.

## Solução

Gravar o presente no banco **no servidor**, automaticamente, assim que o Mercado Pago confirmar o pagamento — passando junto o nome do convidado e a mensagem. Assim o `/admin` (que já lê via `listPurchases`) passa a mostrar quem enviou cada presente, vindo de qualquer dispositivo.

### Backend (`src/lib/wedding.functions.ts`)

1. **`checkMercadoPagoPaymentStatus`** (usado no polling do PIX): aceitar também `giftId`, `guestName`, `message`. Quando `status === "approved"`, inserir em `purchases` (idempotente: só insere se ainda não existir uma compra com aquele `gift_id`).
2. **`lookupMercadoPagoByGift`** (usado no retorno do cartão): receber também `guestName` e `message`. Se encontrar pagamento aprovado, inserir em `purchases` (mesma idempotência).
3. Manter `createPurchase` como está (não é mais chamada pelo front).

### Frontend

1. **`src/components/PurchaseModal.tsx`**: no polling do PIX, passar `giftId`, `guestName`, `message` para `checkMercadoPagoPaymentStatus`. Continuar atualizando o `localStorage` para feedback imediato (sem mudança visual).
2. **`src/routes/index.tsx`**: no handler de retorno do Mercado Pago (cartão), chamar `lookupMercadoPagoByGift` passando `guestName` e `message` lidos da URL — para gravar no banco caso o pagamento já tenha sido aprovado.

### Admin

Nenhuma mudança — `/admin` já mostra `guestName`, `message` e o presente em "Mural de Carinho" e nas notificações.

## Garantias

- Nome continua **obrigatório** no formulário (já é hoje).
- Mensagem continua opcional.
- Idempotente: mesmo se o polling rodar várias vezes, só grava 1 vez por presente.
- Sem mudanças no schema do banco e sem novas dependências.

## Fora do escopo

- Webhook do Mercado Pago (polling/retorno são suficientes).
- Mudanças visuais no admin ou no modal.