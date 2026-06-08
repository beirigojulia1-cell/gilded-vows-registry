## Visão geral

Hoje os presentes, compras e configurações ficam só no `localStorage` do seu navegador — por isso, quando você adiciona um presente no `/admin`, ninguém mais vê. Vamos mover tudo pro Supabase pra que seja global.

---

## Parte 1 — Banco de dados (Supabase)

### Tabelas a criar (em uma migration)

- **`gifts`** — id, title, category, price_cents, icon, description, image_url, gradient, accent, sort_order, created_at, updated_at
- **`purchases`** — id, gift_id (FK→gifts), guest_name, message, read, created_at
- **`settings`** — linha única (singleton) com couple_names, wedding_date, pix_key, pix_name, pix_city
- **`user_roles`** — id, user_id (FK→auth.users), role (`admin`)
- **Função `has_role(user_id, role)`** — security definer, usada em todas as RLS policies de admin

### RLS (regras de acesso)

- **`gifts`**: leitura pública (qualquer um vê a lista); insert/update/delete só admin
- **`purchases`**: insert público (convidado registra o presente); leitura/delete só admin
- **`settings`**: leitura pública; update só admin
- **`user_roles`**: leitura própria; gerenciamento só admin

### Storage

- Bucket público `gift-images` pra novas fotos que você subir pelo `/admin`. As fotos atuais (galeria, capítulos, presentes existentes) continuam na CDN da Lovable.

### Seed inicial

A migration vai popular `gifts` com os 5 presentes atuais (Talheres, Fuê, Pano, Mop, Organizador) e `settings` com seus dados (Geovana & Sérgio, 28/06/2026, PIX).

---

## Parte 2 — Login admin

Vou habilitar o Supabase Auth (email/senha, sem confirmação de email pra ser rápido).

**Fluxo (você faz uma vez):**
1. Eu te envio um link `/auth` pra criar sua conta com seu email + a senha que você escolher.
2. Depois que você criar, eu rodo um insert na tabela `user_roles` dando role `admin` pra você. (Como ainda não tenho seu email, te peço no chat depois que migration rodar.)
3. A partir daí: vai em `/admin`, loga com email/senha, e gerencia presentes/mensagens normalmente. Tudo persiste no Supabase.

A rota `/admin` vai virar uma rota protegida (`_authenticated/admin`) — quem não estiver logado e com role admin é redirecionado.

A tela atual "senha única" (`casal2026`) sai de cena.

---

## Parte 3 — Código

### Server functions (createServerFn) — backend seguro
- `listGifts`, `getSettings`, `createPurchase` → públicas
- `createGift`, `updateGift`, `deleteGift`, `uploadGiftImage`, `listPurchases`, `markPurchaseRead`, `clearPurchases`, `updateSettings` → protegidas por `requireSupabaseAuth` + checagem `has_role('admin')`

### Frontend
- `src/lib/store.ts` deixa de usar localStorage; vira camada fina chamando server functions via TanStack Query
- `src/routes/admin.tsx` perde a tela de senha; usa Supabase Auth
- Cria `src/routes/auth.tsx` (login + cadastro)
- `src/routes/index.tsx`, `PurchaseModal`, `CountdownTimer` passam a ler de Query em vez de `store.get*` síncrono

---

## Parte 4 — Mercado Pago (Checkout Pro) — roteiro

**Por que assim:** o Access Token NUNCA vai pro frontend. Ele fica como secret no Supabase e só uma server function chama a API do Mercado Pago.

### Passo a passo (faremos depois das partes 1-3)

1. **Você cria a aplicação no Mercado Pago**
   - Vai em https://www.mercadopago.com.br/developers/panel/app → "Criar aplicação"
   - Tipo: "Pagamentos online" → "Checkout Pro"
   - Em "Credenciais" copia o **Access Token de TESTE** (começa com `TEST-...`)

2. **Eu te peço o secret pelo cofre seguro da Lovable**
   - Você cola o `TEST-...` no formulário. Ele vira a variável de ambiente `MERCADOPAGO_ACCESS_TOKEN`, acessível só no backend.

3. **Eu implemento 3 peças:**
   - Server function `createMercadoPagoPreference({ giftId, guestName, message })`: cria a "preference" via API do MP usando o token do `process.env`, devolve só o `init_point` (URL de checkout).
   - Rota pública `/api/public/mercadopago/webhook`: recebe notificações do MP, valida, e marca o `purchase` como "pago".
   - Botão **"Pagar com Mercado Pago"** no `PurchaseModal` que chama a server function e redireciona pro `init_point`. PIX manual continua disponível em paralelo.

4. **Teste em sandbox**
   - Usa um cartão de teste do MP (ex.: `5031 4332 1540 6351`, CVV 123, qualquer data futura, nome `APRO`) → confirma que o webhook chega e a compra aparece marcada como paga em `/admin`.

5. **Quando quiser ir pra produção**
   - Cria a aplicação em modo produção no MP, pega o Access Token `APP_USR-...`, e eu atualizo o secret. Zero mudança de código.

---

## Ordem de execução

1. Migration (tabelas + RLS + seed)
2. Bucket `gift-images`
3. Server functions + frontend novo
4. Você cria sua conta em `/auth`, me passa o email, eu te promovo a admin
5. Você adiciona presentes pelo `/admin` (agora globais!)
6. Mercado Pago (parte 4) num passo separado

## Fora deste plano
- Migrar imagens antigas pro Supabase (ficam na CDN)
- Personalização visual da tela `/auth` além do básico
- Notificações por email/SMS
