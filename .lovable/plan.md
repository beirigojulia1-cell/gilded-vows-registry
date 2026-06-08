
## Migração para Mercado Pago (PIX + Cartão de Crédito)

Vou remover o fluxo manual da chave PIX por e-mail e integrar o Mercado Pago oferecendo duas opções de pagamento dentro do `PurchaseModal`: **PIX** (QR Code gerado pela API) e **Cartão de Crédito** (via Checkout Pro / preferência hospedada do MP).

A secret `MERCADO_PAGO_ACCESS_TOKEN` já está configurada.

---

### 1. Backend — `src/lib/wedding.functions.ts`

**Novas server functions:**

- `createMercadoPagoPixPayment({ giftId, guestName, message })`
  - Bloqueia se presente já foi comprado.
  - `POST https://api.mercadopago.com/v1/payments` com header `Authorization: Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` e `X-Idempotency-Key: uuid`.
  - Body: `transaction_amount`, `payment_method_id: "pix"`, `description`, `payer.email` (gerado), `external_reference: giftId`, `metadata: { giftId, guestName, message }`.
  - Retorna `{ paymentId, qrCodeBase64, qrCode (copia-e-cola), ticketUrl, expiresAt }`.

- `createMercadoPagoCardPreference({ giftId, guestName, message })`
  - Bloqueia se presente já foi comprado.
  - `POST https://api.mercadopago.com/checkout/preferences` com `items: [{ title, quantity:1, unit_price, currency_id:"BRL" }]`, `payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }, { id: "bank_transfer" }] }` (deixa só cartão), `external_reference: giftId`, `metadata`, `back_urls` (origem + `?gift=<id>&status=success|failure|pending`), `auto_return: "approved"`.
  - Retorna `{ preferenceId, initPoint }` — frontend redireciona para `initPoint`.

- `checkMercadoPagoPaymentStatus({ paymentId, giftId, guestName, message })`
  - `GET /v1/payments/:id`. Se `approved`, insere `purchase` (idempotente: verifica se já existe pelo `gift_id`).
  - Retorna `{ status, approved: boolean }`.

- `confirmMercadoPagoByExternalReference({ giftId, guestName, message })`
  - Para retorno de cartão via `back_url`: busca pagamentos por `external_reference` (`GET /v1/payments/search?external_reference=<giftId>`), se houver aprovado → cria purchase.

**Remover/limpar:**
- `createPurchase` deixa de ser chamado pelo front (mantenho a função, mas só usada internamente após confirmação MP — ou removo).
- Settings `pixKey/pixName/pixCity` deixam de ser usados no front.

---

### 2. Frontend — `src/components/PurchaseModal.tsx` (reescrita)

Layout em 2 abas: **PIX** | **Cartão de Crédito**.

**Aba PIX:**
1. Form com nome + mensagem opcional.
2. Botão "Gerar QR Code" → chama `createMercadoPagoPixPayment`.
3. Mostra QR (img base64) + código copia-e-cola + countdown de expiração.
4. Polling a cada 4s em `checkMercadoPagoPaymentStatus` até `approved` → tela de sucesso.
5. Remove uso da lib `qrcode` (QR vem pronto do MP).

**Aba Cartão:**
1. Form com nome + mensagem opcional.
2. Botão "Pagar com cartão" → chama `createMercadoPagoCardPreference` → `window.location.href = initPoint` (Checkout Pro hospedado, suporta parcelamento, salva o usuário de digitar dados na nossa página).
3. Ao voltar via `back_url` (`/?gift=<id>&status=approved`), o `index.tsx` detecta no mount, chama `confirmMercadoPagoByExternalReference` e mostra toast de sucesso + abre modal de agradecimento.

---

### 3. Admin — `src/routes/_authenticated/admin.tsx`

Esconder campos `pixKey/pixName/pixCity` do formulário de settings (deixar só `coupleNames` e `weddingDate`). Não removo as colunas do banco agora (sem migration), só deixam de aparecer.

---

### 4. Detalhes técnicos

- Sem novas dependências (uso `fetch` nativo).
- `MERCADO_PAGO_ACCESS_TOKEN` lido via `process.env` dentro do `.handler()`.
- Webhook do MP fica fora de escopo — polling (PIX) + verificação no retorno (cartão) são suficientes.
- Email do payer gerado como `convidado+<uuid>@casamento.app` (MP exige email mas não valida).
- Validação Zod em todos os inputs.
- Idempotência: `purchases` checa duplicata por `gift_id` antes de inserir.

### Fora do escopo

- Não mudo schema do banco (sem coluna `mp_payment_id`).
- Não removo a lib `qrcode` do package.json (só paro de usar).
- Não implemento webhook MP.
- Não mexo no design/animações já feitas.
