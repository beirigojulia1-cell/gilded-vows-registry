import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Always return 200 to acknowledge receipt — process in background
  const ok200 = (msg: Record<string, unknown>) =>
    new Response(JSON.stringify({ ok: true, ...msg }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return ok200({ ignored: true, reason: "invalid json" });
  }

  // Extract payment ID from body (MP sends two formats)
  const paymentId =
    body?.data?.id?.toString() ||
    (body?.topic === "payment" ? body?.id?.toString() : null);

  if (!paymentId) {
    console.log("[MP Webhook] Sem paymentId, ignorando.");
    return ok200({ ignored: true });
  }

  const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!mpToken) {
    console.error("[MP Webhook] MERCADO_PAGO_ACCESS_TOKEN não configurado");
    return ok200({ ignored: true, reason: "no token" });
  }

  // Query MP for payment details
  let payment: any = null;
  try {
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `Bearer ${mpToken}` } }
    );
    payment = await mpRes.json();

    // If MP returns error (e.g. test ID 123456 doesn't exist), just acknowledge
    if (!mpRes.ok) {
      console.warn(`[MP Webhook] MP returned ${mpRes.status} for payment ${paymentId}:`, payment?.message);
      return ok200({ ignored: true, reason: "payment_not_found" });
    }
  } catch (e) {
    console.error("[MP Webhook] Falha ao consultar MP:", e);
    return ok200({ ignored: true, reason: "mp_fetch_error" });
  }

  console.log(`[MP Webhook] Payment ${paymentId} status: ${payment.status}`);

  // Only process approved payments
  if (payment.status !== "approved") {
    return ok200({ status: payment.status });
  }

  // Extract gift/guest data
  const giftId: string | null =
    payment?.metadata?.gift_id ||
    payment?.external_reference ||
    null;

  const guestName: string =
    (payment?.metadata?.guest_name ||
    payment?.payer?.first_name ||
    "Convidado").toString().trim().slice(0, 120);

  const message: string =
    (payment?.metadata?.guest_message || "").toString().trim().slice(0, 1000);

  if (!giftId) {
    console.warn("[MP Webhook] Pagamento aprovado sem gift_id:", paymentId);
    return ok200({ warning: "no_gift_id" });
  }

  // Save to Supabase (idempotent)
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("gift_id", giftId)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase.from("purchases").insert({
        gift_id: giftId,
        guest_name: guestName,
        message: message || null,
      });
      if (insertError) {
        console.error("[MP Webhook] Erro ao inserir purchase:", insertError);
      } else {
        console.log(`[MP Webhook] ✅ Purchase salva: gift=${giftId}, guest=${guestName}`);
      }
    } else {
      console.log(`[MP Webhook] Purchase já existe para gift ${giftId}`);
    }
  } catch (e) {
    console.error("[MP Webhook] Erro Supabase:", e);
  }

  return ok200({ giftId, guestName });
});
