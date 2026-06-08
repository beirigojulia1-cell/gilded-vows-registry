import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Gift, Purchase, Settings } from "./wedding-types";

// --- shared mappers ---
type GiftRow = {
  id: string;
  title: string;
  category: string;
  price_cents: number;
  icon: string;
  description: string | null;
  image_url: string | null;
  gradient: string | null;
  accent: string | null;
  sort_order: number;
};

type PurchaseRow = {
  id: string;
  gift_id: string;
  guest_name: string;
  message: string | null;
  read: boolean;
  created_at: string;
};

type SettingsRow = {
  couple_names: string;
  wedding_date: string;
  pix_key: string;
  pix_name: string;
  pix_city: string;
};

const giftFromRow = (r: GiftRow): Gift => ({
  id: r.id,
  title: r.title,
  category: r.category,
  priceCents: r.price_cents,
  icon: r.icon,
  description: r.description,
  imageUrl: r.image_url,
  gradient: r.gradient,
  accent: r.accent,
  sortOrder: r.sort_order,
});

const purchaseFromRow = (r: PurchaseRow): Purchase => ({
  id: r.id,
  giftId: r.gift_id,
  guestName: r.guest_name,
  message: r.message,
  read: r.read,
  createdAt: r.created_at,
});

const settingsFromRow = (r: SettingsRow): Settings => ({
  coupleNames: r.couple_names,
  weddingDate: r.wedding_date,
  pixKey: r.pix_key,
  pixName: r.pix_name,
  pixCity: r.pix_city,
});

// --- helpers ---
// Server-side anon client for public reads/writes (uses RLS).
// Avoids depending on SERVICE_ROLE_KEY which isn't injected in this environment.
async function getAdmin(): Promise<any> {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}


async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const client = ctx.supabase as any;
  const { data, error } = await client.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error("Erro ao verificar permissão");
  if (!data) throw new Error("Forbidden: requires admin role");
}

const sb = (s: any) => s as any;

// =========== PUBLIC ===========

export const listGifts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getAdmin();
  const { data, error } = await supabase
    .from("gifts")
    .select("id,title,category,price_cents,icon,description,image_url,gradient,accent,sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return { gifts: (data ?? []).map(giftFromRow) };
});

export const listPurchasedGiftIds = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getAdmin();
  const { data, error } = await supabase.from("purchases").select("gift_id");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ gift_id: string | null }>;
  const giftIds = Array.from(
    new Set(rows.map((row) => row.gift_id).filter((giftId): giftId is string => typeof giftId === "string")),
  );
  return { giftIds };
});

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getAdmin();
  const { data, error } = await supabase
    .from("settings")
    .select("couple_names,wedding_date,pix_key,pix_name,pix_city")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Settings not found");
  return { settings: settingsFromRow(data as SettingsRow) };
});

const createPurchaseSchema = z.object({
  giftId: z.string().uuid(),
  guestName: z.string().trim().min(1).max(120),
  message: z.string().trim().max(1000).optional().default(""),
});

export const createPurchase = createServerFn({ method: "POST" })
  .inputValidator((d) => createPurchaseSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = await getAdmin();

    // Block double-purchase
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("gift_id", data.giftId)
      .limit(1)
      .maybeSingle();
    if (existing) throw new Error("Este presente já foi dado");

    const { error } = await supabase.from("purchases").insert({
      gift_id: data.giftId,
      guest_name: data.guestName,
      message: data.message?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =========== ADMIN ===========

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as any;
    const { data, error } = await client.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: !!data };
  });

export const listPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const client = context.supabase as any;
    const { data, error } = await client
      .from("purchases")
      .select("id,gift_id,guest_name,message,read,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { purchases: (data ?? []).map((r: any) => purchaseFromRow(r as PurchaseRow)) };
  });

export const markAllPurchasesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const client = context.supabase as any;
    const { error } = await client
      .from("purchases")
      .update({ read: true })
      .eq("read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const client = context.supabase as any;
    const { error } = await client
      .from("purchases")
      .delete()
      .not("id", "is", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const giftInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(80),
  priceCents: z.number().int().min(0).max(100_000_000),
  icon: z.string().trim().min(1).max(8),
  description: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().trim().max(2000).optional().nullable(),
  gradient: z.string().trim().max(500).optional().nullable(),
  accent: z.string().trim().max(20).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const createGift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => giftInputSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const client = context.supabase as any;
    const { data: row, error } = await client
      .from("gifts")
      .insert({
        title: data.title,
        category: data.category,
        price_cents: data.priceCents,
        icon: data.icon,
        description: data.description ?? null,
        image_url: data.imageUrl ?? null,
        gradient: data.gradient ?? `linear-gradient(135deg, hsl(${Math.floor(Math.random() * 360)} 20% 15%) 0%, #0d0b08 100%)`,
        accent: data.accent ?? null,
        sort_order: data.sortOrder ?? 100,
      })
      .select("id,title,category,price_cents,icon,description,image_url,gradient,accent,sort_order")
      .single();
    if (error) throw new Error(error.message);
    return { gift: giftFromRow(row as GiftRow) };
  });

const updateGiftSchema = giftInputSchema.extend({ id: z.string().uuid() });

export const updateGift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateGiftSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const client = context.supabase as any;
    const { error } = await client
      .from("gifts")
      .update({
        title: data.title,
        category: data.category,
        price_cents: data.priceCents,
        icon: data.icon,
        description: data.description ?? null,
        image_url: data.imageUrl ?? null,
        gradient: data.gradient ?? null,
        accent: data.accent ?? null,
        ...(data.sortOrder !== undefined ? { sort_order: data.sortOrder } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const client = context.supabase as any;
    const { error } = await client.from("gifts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const settingsSchema = z.object({
  coupleNames: z.string().trim().min(1).max(120),
  weddingDate: z.string().min(1),
  pixKey: z.string().trim().min(1).max(200),
  pixName: z.string().trim().min(1).max(120),
  pixCity: z.string().trim().min(1).max(120),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => settingsSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const client = context.supabase as any;
    const { error } = await client
      .from("settings")
      .update({
        couple_names: data.coupleNames,
        wedding_date: data.weddingDate,
        pix_key: data.pixKey,
        pix_name: data.pixName,
        pix_city: data.pixCity,
      })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const uploadSchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  base64: z.string().min(1),
});

export const uploadGiftImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uploadSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const client = context.supabase as any;

    // base64 -> Uint8Array (works in Workers)
    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const ext = (data.fileName.split(".").pop() || "bin").toLowerCase();
    const safeName = `${crypto.randomUUID()}.${ext}`;
    const path = `${context.userId}/${safeName}`;

    const { error: upErr } = await client.storage
      .from("gift-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = client.storage.from("gift-images").getPublicUrl(path);
    return { url: pub.publicUrl };
  });

