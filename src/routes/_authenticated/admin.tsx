import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ToastProvider, useToast } from "@/components/Toast";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, type Gift, type Purchase, type Settings } from "@/lib/wedding-types";
import { giftsQuery, purchasesQuery, settingsQuery, isAdminQuery } from "@/lib/wedding-queries";
import {
  clearPurchases,
  createGift,
  deleteGift,
  deleteRsvp,
  listRsvps,
  markAllPurchasesRead,
  updateGift,
  updateSettings,
  uploadGiftImage,
  uploadSiteImage,
} from "@/lib/wedding.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "G & S · Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ToastProvider>
      <AdminApp />
    </ToastProvider>
  ),
});

type Section = "dashboard" | "gifts" | "messages" | "rsvp" | "settings";
type GiftCategory = Gift["category"];

function AdminApp() {
  const navigate = useNavigate();
  const { data: adminData, isLoading, error: adminError } = useQuery(isAdminQuery);
  const [section, setSection] = useState<Section>("dashboard");
  const [open, setOpen] = useState(false);

  const purchases: Purchase[] =
    useQuery({
      ...purchasesQuery,
      enabled: adminData?.isAdmin === true,
    }).data?.purchases ?? [];
  const unread = purchases.filter((p: Purchase) => !p.read).length;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-champagne/60 text-sm">
        Carregando...
      </div>
    );
  }
  if (adminError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center bg-card border border-destructive/30 rounded-lg p-10">
          <h1 className="font-serif text-3xl text-destructive mb-3">Erro ao abrir o painel</h1>
          <p className="text-champagne/70 text-sm mb-6">
            Não foi possível validar seu acesso agora. Atualize a página ou entre novamente.
          </p>
          <button onClick={logout} className="btn-gold px-6 py-2.5 rounded">
            Sair
          </button>
        </div>
      </div>
    );
  }
  if (!adminData?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center bg-card border border-destructive/30 rounded-lg p-10">
          <h1 className="font-serif text-3xl text-destructive mb-3">Sem permissão</h1>
          <p className="text-champagne/70 text-sm mb-6">
            Sua conta está autenticada, mas ainda não tem o papel de admin. Peça pro responsável
            adicionar seu email à lista de administradores.
          </p>
          <button onClick={logout} className="btn-gold px-6 py-2.5 rounded">
            Sair
          </button>
        </div>
      </div>
    );
  }

  const nav: { id: Section; label: string; icon: string; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "gifts", label: "Presentes", icon: "🎁" },
    { id: "messages", label: "Mensagens", icon: "💌", badge: unread },
    { id: "rsvp", label: "Confirmações", icon: "✔️" },
    { id: "settings", label: "Configurações", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen flex bg-background admin-light">
      <aside
        className={`fixed md:static z-40 inset-y-0 left-0 w-64 bg-card border-r border-border/60 transform transition-transform ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-6 border-b border-border/60">
          <div className="font-serif text-2xl text-gradient-gold">G &amp; S Admin</div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-champagne/50 mt-1">
            Painel de Casamento
          </p>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setSection(n.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm transition-all ${section === n.id ? "bg-gold/10 text-gold border-l-2 border-gold" : "text-champagne/70 hover:bg-muted/40"}`}
            >
              <span>{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
              {!!n.badge && (
                <span className="text-[10px] bg-gold text-ink rounded-full px-2">{n.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-border/60 space-y-2">
          <Link to="/" className="block text-xs text-champagne/60 hover:text-gold">
            ← Ver lista de presentes
          </Link>
          <button onClick={logout} className="block text-xs text-champagne/60 hover:text-gold">
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/60">
          <button onClick={() => setOpen(!open)} className="text-gold">
            ☰
          </button>
          <span className="font-serif text-gold">G &amp; S Admin</span>
          <span />
        </header>
        <main className="p-6 md:p-10 max-w-6xl">
          {section === "dashboard" && <Dashboard />}
          {section === "gifts" && <GiftsAdmin />}
          {section === "messages" && <Messages />}
          {section === "rsvp" && <Confirmations />}
          {section === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-card border border-gold/15 rounded-lg p-6">
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-[10px] tracking-[0.3em] uppercase text-champagne/50 mb-2">{label}</div>
      <div className="font-serif text-3xl text-gradient-gold">{value}</div>
    </div>
  );
}

function Dashboard() {
  const gifts: Gift[] = useQuery(giftsQuery).data?.gifts ?? [];
  const purchasesQueryResult = useQuery(purchasesQuery);
  const purchases: Purchase[] = purchasesQueryResult.data?.purchases ?? [];
  const total = gifts.length;
  const taken = new Set(purchases.map((p: Purchase) => p.giftId)).size;
  const available = total - taken;
  const raised = purchases.reduce((acc: number, p: Purchase) => {
    const g = gifts.find((x: Gift) => x.id === p.giftId);
    return acc + (g?.priceCents ?? 0);
  }, 0);

  return (
    <div>
      <h2 className="font-serif text-4xl text-champagne mb-2">Dashboard</h2>
      <p className="text-champagne/50 text-sm mb-8">Visão geral da lista de presentes</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total de Presentes" value={String(total)} icon="🎁" />
        <StatCard label="Presenteados" value={String(taken)} icon="✅" />
        <StatCard label="Disponíveis" value={String(available)} icon="💛" />
        <StatCard label="Valor Arrecadado" value={formatBRL(raised)} icon="💰" />
      </div>
      <div className="bg-card border border-gold/15 rounded-lg p-6">
        <h3 className="font-serif text-xl text-champagne mb-4">Atividade recente</h3>
        {purchases.length === 0 ? (
          <p className="text-champagne/40 text-sm italic">Nenhuma atividade ainda.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {purchases.slice(0, 8).map((p: Purchase) => {
              const g = gifts.find((x: Gift) => x.id === p.giftId);
              return (
                <li key={p.id} className="py-3 flex justify-between text-sm">
                  <span className="text-champagne">
                    <b className="text-gold">{p.guestName}</b> presenteou <i>{g?.title ?? "—"}</i>
                  </span>
                  <span className="text-champagne/40 text-xs">
                    {new Date(p.createdAt).toLocaleString("pt-BR")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function GiftsAdmin() {
  const { push } = useToast();
  const qc = useQueryClient();
  const gifts: Gift[] = useQuery(giftsQuery).data?.gifts ?? [];
  const purchasesQueryResult = useQuery(purchasesQuery);
  const purchases: Purchase[] = purchasesQueryResult.data?.purchases ?? [];
  const purchasedIds = new Set(purchases.map((p: Purchase) => p.giftId));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<GiftCategory | "Todas">("Todas");
  const [status, setStatus] = useState<"all" | "available" | "purchased">("all");
  const [editing, setEditing] = useState<Gift | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Gift | null>(null);

  const cats: Array<GiftCategory | "Todas"> = [
    "Todas",
    ...Array.from(new Set(gifts.map((g: Gift) => g.category))),
  ];
  const filtered = gifts.filter((g: Gift) => {
    if (q && !g.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "Todas" && g.category !== cat) return false;
    const isTaken = purchasedIds.has(g.id);
    if (status === "available" && isTaken) return false;
    if (status === "purchased" && !isTaken) return false;
    return true;
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteGift({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gifts"] });
      qc.invalidateQueries({ queryKey: ["purchased-ids"] });
      push("Presente removido", "success");
      setConfirmDel(null);
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  return (
    <div>
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-4xl text-champagne">Presentes</h2>
          <p className="text-champagne/50 text-sm">Gerencie sua lista</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-gold px-6 py-3 rounded"
        >
          + Adicionar Presente
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar..."
          className="flex-1 min-w-[200px] bg-input/60 border border-border rounded px-4 py-2 text-sm text-champagne focus:border-gold/60 focus:outline-none"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="bg-input/60 border border-border rounded px-3 py-2 text-sm text-champagne"
        >
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | "available" | "purchased")}
          className="bg-input/60 border border-border rounded px-3 py-2 text-sm text-champagne"
        >
          <option value="all">Todos</option>
          <option value="available">Disponíveis</option>
          <option value="purchased">Presenteados</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((g) => {
          const taken = purchasedIds.has(g.id);
          return (
            <div key={g.id} className="bg-card border border-gold/15 rounded-lg overflow-hidden">
              <div
                className="h-32 flex items-center justify-center text-5xl"
                style={{ background: g.gradient ?? undefined }}
              >
                {g.imageUrl ? (
                  <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  g.icon
                )}
              </div>
              <div className="p-4">
                <div className="text-[10px] tracking-[0.25em] uppercase text-gold/70 mb-1">
                  {g.category}
                </div>
                <h3 className="font-serif text-lg text-champagne">{g.title}</h3>
                <div className="text-gradient-gold font-serif text-lg mb-3">
                  {formatBRL(g.priceCents)}
                </div>
                {taken && <div className="text-[10px] text-emerald-400 mb-2">✓ Presenteado</div>}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(g);
                      setShowForm(true);
                    }}
                    className="flex-1 text-xs px-3 py-2 rounded border border-gold/30 text-champagne hover:bg-gold/10"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmDel(g)}
                    className="flex-1 text-xs px-3 py-2 rounded border border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && <GiftForm gift={editing} onClose={() => setShowForm(false)} />}
      {confirmDel && (
        <ConfirmDialog
          title="Excluir presente?"
          message={`Tem certeza que deseja excluir "${confirmDel.title}"?`}
          onConfirm={() => delMut.mutate(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

function GiftForm({ gift, onClose }: { gift: Gift | null; onClose: () => void }) {
  const { push } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState(gift?.title ?? "");
  const [category, setCategory] = useState(gift?.category ?? "Lar");
  const [price, setPrice] = useState(gift ? String(gift.priceCents / 100) : "");
  const [icon, setIcon] = useState(gift?.icon ?? "🎁");
  const [description, setDescription] = useState(gift?.description ?? "");
  const [imageUrl, setImageUrl] = useState(gift?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const saveMut = useMutation({
    mutationFn: async () => {
      const cents = Math.round(parseFloat(price.replace(",", ".")) * 100);
      if (isNaN(cents) || cents <= 0) throw new Error("Valor inválido");
      const payload = {
        title: title.trim(),
        category: category.trim(),
        priceCents: cents,
        icon: icon?.trim() || "🎁",
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        gradient: gift?.gradient ?? null,
        accent: gift?.accent ?? null,
        sortOrder: gift?.sortOrder ?? 100,
      };
      if (gift) {
        await updateGift({ data: { id: gift.id, ...payload } });
      } else {
        await createGift({ data: payload });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gifts"] });
      push(gift ? "Presente atualizado" : "Presente adicionado", "success");
      onClose();
    },
    onError: (e: Error) => {
      let msg = e.message;
      try {
        const parsed = JSON.parse(e.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          msg = parsed[0].message;
        }
      } catch {}
      push(msg, "error");
    },
  });

  const handleFile = (file: File) => {
    if (!/image\/(png|jpeg|jpg|webp)/.test(file.type)) {
      push("Formato inválido (use PNG, JPG ou WEBP)", "error");
      return;
    }
    if (file.size > 5_000_000) {
      push("Imagem muito grande (máx 5MB)", "error");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dataUrl = ev.target?.result as string;
        // dataUrl = "data:image/png;base64,XXXXXX"
        const base64 = dataUrl.split(",")[1];
        const res = await uploadGiftImage({
          data: { fileName: file.name, contentType: file.type, base64 },
        });
        setImageUrl(res.url);
        push("Imagem enviada com sucesso!", "success");
      } catch (e: any) {
        push(e?.message ?? "Erro no upload da imagem", "error");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      push("Erro ao ler o arquivo", "error");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim() || !price) {
      push("Preencha os campos obrigatórios", "error");
      return;
    }
    saveMut.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        onPaste={(e) => {
          const items = e.clipboardData?.items;
          if (!items) return;
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                e.preventDefault();
                handleFile(file);
              }
              break;
            }
          }
        }}
        className="bg-card border border-gold/30 rounded-lg p-8 w-full max-w-lg max-h-[92vh] overflow-y-auto"
      >
        <h3 className="font-serif text-2xl text-champagne mb-6">
          {gift ? "Editar Presente" : "Novo Presente"}
        </h3>
        <div className="space-y-4">
          <Field label="Nome do presente *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria *">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Valor (R$) *">
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Imagem">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              className={`border-2 border-dashed rounded p-4 text-center text-xs text-champagne/60 ${dragOver ? "border-gold bg-gold/5" : "border-border"}`}
            >
              {imageUrl ? (
                <div>
                  <img src={imageUrl} alt="" className="max-h-32 mx-auto rounded mb-2" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-destructive text-xs"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <>
                  {uploading ? "Enviando..." : "Arraste, cole (Ctrl+V) ou selecione uma imagem (PNG/JPG/WEBP, máx 5MB)"}
                  <label className="block mt-2 cursor-pointer text-gold">
                    selecionar arquivo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                </>
              )}
            </div>
          </Field>
        </div>
        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded border border-border text-champagne/70 text-xs uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saveMut.isPending || uploading}
            className="flex-1 btn-gold py-3 rounded disabled:opacity-50"
          >
            {saveMut.isPending ? "..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full bg-input/60 border border-border rounded px-3 py-2 text-sm text-champagne focus:border-gold/60 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.25em] uppercase text-champagne/60 block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Messages() {
  const { push } = useToast();
  const qc = useQueryClient();
  const gifts: Gift[] = useQuery(giftsQuery).data?.gifts ?? [];
  const purchasesQueryResult = useQuery(purchasesQuery);
  const purchases: Purchase[] = purchasesQueryResult.data?.purchases ?? [];
  const [confirmClear, setConfirmClear] = useState(false);

  const markRead = useMutation({
    mutationFn: () => markAllPurchasesRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });

  const clearMut = useMutation({
    mutationFn: () => clearPurchases(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["purchased-ids"] });
      push("Mensagens limpas", "success");
      setConfirmClear(false);
    },
  });

  if (purchases.some((p: Purchase) => !p.read) && !markRead.isPending) {
    setTimeout(() => markRead.mutate(), 800);
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-4xl text-champagne">Mensagens</h2>
          <p className="text-champagne/50 text-sm">Recados dos convidados</p>
        </div>
        {purchases.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="px-5 py-2 rounded border border-destructive/40 text-destructive text-xs uppercase tracking-wider hover:bg-destructive/10"
          >
            Limpar tudo
          </button>
        )}
      </div>
      {purchases.length === 0 ? (
        <p className="text-champagne/40 italic text-center py-20">Nenhuma mensagem ainda.</p>
      ) : (
        <div className="space-y-4">
          {purchases.map((p: Purchase) => {
            const g = gifts.find((x: Gift) => x.id === p.giftId);
            return (
              <div key={p.id} className="bg-card border border-gold/15 rounded-lg p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-serif text-lg text-gold">{p.guestName}</div>
                    <div className="text-xs text-champagne/60 italic">
                      presenteou: {g?.title ?? "—"}
                    </div>
                  </div>
                  <div className="text-[10px] text-champagne/40">
                    {new Date(p.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
                {p.message && (
                  <p className="text-champagne/80 text-sm mt-3 border-l-2 border-gold/40 pl-4 italic">
                    "{p.message}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
      {confirmClear && (
        <ConfirmDialog
          title="Limpar mensagens?"
          message="Esta ação não pode ser desfeita."
          onConfirm={() => clearMut.mutate()}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

function Confirmations() {
  const { push } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["rsvps"],
    queryFn: () => listRsvps(),
  });

  const rsvps = data?.rsvps ?? [];

  const delMut = useMutation({
    mutationFn: (id: string) => deleteRsvp({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rsvps"] });
      push("Confirmação removida", "success");
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  return (
    <div>
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-4xl text-champagne">Confirmações</h2>
          <p className="text-champagne/50 text-sm">
            {rsvps.length} convidado{rsvps.length !== 1 ? "s" : ""} confirmado{rsvps.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {isLoading && (
        <p className="text-champagne/40 italic text-center py-20">Carregando...</p>
      )}

      {!isLoading && rsvps.length === 0 && (
        <div className="text-center py-24 bg-card border border-gold/15 rounded-lg">
          <div className="text-5xl mb-4 opacity-30">✉️</div>
          <p className="text-champagne/40 italic">Nenhuma confirmação ainda.</p>
          <p className="text-champagne/30 text-xs mt-2">As confirmações aparecerão aqui quando os convidados responderem.</p>
        </div>
      )}

      {rsvps.length > 0 && (
        <div className="space-y-4">
          {rsvps.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-gold/15 rounded-lg p-6 flex gap-4 items-start"
            >
              {/* Avatar */}
              <div className="shrink-0 w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold font-serif text-lg select-none">
                {r.name.charAt(0).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div>
                    <div className="font-serif text-lg text-gold leading-tight">{r.name}</div>
                    <div className="text-[10px] tracking-[0.2em] uppercase text-champagne/40 mt-0.5">
                      ✦ Presença confirmada · {new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <button
                    onClick={() => delMut.mutate(r.id)}
                    disabled={delMut.isPending}
                    className="text-[10px] text-destructive/70 hover:text-destructive uppercase tracking-wider shrink-0 disabled:opacity-40"
                  >
                    Remover
                  </button>
                </div>
                {r.message && (
                  <p className="text-champagne/75 text-sm mt-3 border-l-2 border-gold/40 pl-4 italic leading-relaxed">
                    "{r.message}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsPanel() {
  const { push } = useToast();
  const qc = useQueryClient();
  const { data: settingsData, isLoading } = useQuery(settingsQuery);
  const settings = settingsData?.settings;

  // Always initialize with a stable default so useState and hooks are consistent
  const [coupleNames, setCoupleNames] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixName, setPixName] = useState("");
  const [pixCity, setPixCity] = useState("");
  const [content, setContent] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"evento" | "textos" | "imagens" | "pix">("evento");
  const [synced, setSynced] = useState(false);
  const [imgUploading, setImgUploading] = useState<string | null>(null);

  // Sync from DB once on load — safe: never causes hook order issues
  useEffect(() => {
    if (settings && !synced) {
      setCoupleNames(settings.coupleNames);
      setWeddingDate(settings.weddingDate?.slice(0, 16) ?? "");
      setPixKey(settings.pixKey ?? "");
      setPixName(settings.pixName ?? "");
      setPixCity(settings.pixCity ?? "");
      setContent({ ...settings.content });
      setSynced(true);
    }
  }, [settings, synced]);

  // Always defined — never after a conditional return
  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings({
        data: {
          coupleNames,
          weddingDate,
          pixKey,
          pixName,
          pixCity,
          content,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      push("Alterações salvas com sucesso!", "success");
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  const setC = (key: string, val: string) => setContent((prev) => ({ ...prev, [key]: val }));
  const c = (key: string, fallback: string) => content[key] ?? fallback;

  const handleImageFile = async (file: File, key: string) => {
    if (!/image\/(png|jpeg|jpg|webp)/.test(file.type)) {
      push("Formato inválido (use PNG, JPG ou WEBP)", "error");
      return;
    }
    if (file.size > 10_000_000) {
      push("Imagem muito grande (máx 10MB)", "error");
      return;
    }
    setImgUploading(key);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        const res = await uploadSiteImage({
          data: { fileName: file.name, contentType: file.type, base64 },
        });
        setC(key, res.url);
        push("Imagem enviada!", "success");
      } catch (e: any) {
        push(e?.message ?? "Erro no upload", "error");
      } finally {
        setImgUploading(null);
      }
    };
    reader.onerror = () => { push("Erro ao ler arquivo", "error"); setImgUploading(null); };
    reader.readAsDataURL(file);
  };

  const ImageUpload = ({ label, fieldKey }: { label: string; fieldKey: string }) => {
    const url = c(fieldKey, "");
    const loading = imgUploading === fieldKey;
    return (
      <div className="space-y-2">
        <span className="text-[10px] tracking-[0.25em] uppercase text-champagne/60 block">{label}</span>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f, fieldKey); }}
          onPaste={(e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.startsWith("image/")) {
                const f = items[i].getAsFile();
                if (f) { e.preventDefault(); handleImageFile(f, fieldKey); break; }
              }
            }
          }}
          className="border-2 border-dashed border-border rounded p-4 text-center text-xs text-champagne/50 focus-within:border-gold/40"
        >
          {url ? (
            <div>
              <img src={url} alt="" className="max-h-28 mx-auto rounded mb-2 object-cover" />
              <button type="button" onClick={() => setC(fieldKey, "")} className="text-destructive text-xs hover:underline">
                Remover
              </button>
            </div>
          ) : (
            <>
              <p className="mb-2">{loading ? "Enviando…" : "Arraste, cole (Ctrl+V) ou selecione"}</p>
              <label className="cursor-pointer text-gold hover:underline">
                selecionar arquivo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f, fieldKey); }}
                />
              </label>
            </>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-champagne/50 text-sm">Carregando configurações…</div>
      </div>
    );
  }

  const tabs = [
    { id: "evento" as const, label: "📅 Evento" },
    { id: "textos" as const, label: "✏️ Textos" },
    { id: "imagens" as const, label: "🖼️ Imagens" },
    { id: "pix" as const, label: "💳 Pagamento" },
  ];

  return (
    <div>
      <h2 className="font-serif text-4xl text-champagne mb-1">Configurações</h2>
      <p className="text-champagne/50 text-sm mb-8">Personalize todo o conteúdo do seu site</p>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap mb-8 border-b border-border/60 pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded text-sm transition-all ${tab === t.id ? "bg-gold/15 text-gold border border-gold/30" : "text-champagne/60 hover:text-champagne hover:bg-white/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── EVENTO ── */}
      {tab === "evento" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Nomes do Casal">
            <Field label="Nome 1 (hero do site)">
              <input value={c("name1", "Geovana Stefany")} onChange={(e) => setC("name1", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nome 2 (hero do site)">
              <input value={c("name2", "Sérgio Vasconcelos")} onChange={(e) => setC("name2", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Legenda superior do hero (ex: Casamento · 2026)">
              <input value={c("heroSubtitle", "Casamento · 2026")} onChange={(e) => setC("heroSubtitle", e.target.value)} className={inputCls} />
            </Field>
          </Card>

          <Card title="Data & Local">
            <Field label="Data/Hora da cerimônia">
              <input
                type="datetime-local"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Data por extenso (ex: 28 de Junho)">
              <input value={c("ceremonyDateLabel", "28 de Junho")} onChange={(e) => setC("ceremonyDateLabel", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Ano/dia (ex: 2026 · Sábado)">
              <input value={c("ceremonyYearLabel", "2026 · Sábado")} onChange={(e) => setC("ceremonyYearLabel", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Horário (ex: 12h00)">
              <input value={c("ceremonyTimeLabel", "12h00")} onChange={(e) => setC("ceremonyTimeLabel", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Subtexto do horário">
              <input value={c("ceremonyTimeSub", "Cerimônia ao meio-dia")} onChange={(e) => setC("ceremonyTimeSub", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Endereço / Local">
              <input value={c("locationName", "Av. Marginal do CSU, 1455")} onChange={(e) => setC("locationName", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nota sobre bebida">
              <input value={c("drinkNote", "Cerveja, Refrigerante, Suco")} onChange={(e) => setC("drinkNote", e.target.value)} className={inputCls} />
            </Field>
          </Card>
        </div>
      )}

      {/* ── TEXTOS ── */}
      {tab === "textos" && (
        <div className="space-y-4">
          <Card title="Frase do Hero">
            <Field label="Frase principal (abaixo dos nomes)">
              <input value={c("heroTag", "Uma história escrita pelo destino.")} onChange={(e) => setC("heroTag", e.target.value)} className={inputCls} />
            </Field>
          </Card>

          <Card title="Citação (seção entre Hero e História)">
            <Field label="Primeira linha da citação">
              <input value={c("quoteMain", "Algumas histórias começam de forma simples…")} onChange={(e) => setC("quoteMain", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Segunda linha (itálica + dourada)">
              <input value={c("quoteItalic", "mas acabam se tornando eternas.")} onChange={(e) => setC("quoteItalic", e.target.value)} className={inputCls} />
            </Field>
          </Card>

          <Card title="Seção de Confirmação (RSVP)">
            <Field label="Subtexto abaixo do título">
              <input value={c("rsvpSubtitle", "Sua presença é o maior presente que poderíamos receber.")} onChange={(e) => setC("rsvpSubtitle", e.target.value)} className={inputCls} />
            </Field>
          </Card>

          <Card title="Frase de Encerramento">
            <Field label="Frase da última seção do site">
              <textarea
                rows={3}
                value={c("closingPhrase", "Mal podemos esperar para viver esse momento com você.")}
                onChange={(e) => setC("closingPhrase", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </Card>
        </div>
      )}

      {/* ── IMAGENS ── */}
      {tab === "imagens" && (
        <div className="grid md:grid-cols-2 gap-4"
          onPaste={(e) => {
            // Forward paste to active image field handled inside ImageUpload
          }}
        >
          <Card title="Imagem do Hero (fundo principal)">
            <p className="text-champagne/40 text-xs mb-3">Substitui a foto de fundo da seção principal. Recomendado: landscape, mín. 1400px.</p>
            <ImageUpload label="Foto do Hero" fieldKey="heroImageUrl" />
          </Card>
          <Card title="Imagem de Encerramento">
            <p className="text-champagne/40 text-xs mb-3">Substitui a foto de fundo da última seção do site.</p>
            <ImageUpload label="Foto de Encerramento" fieldKey="closingImageUrl" />
          </Card>
        </div>
      )}

      {/* ── PAGAMENTO ── */}
      {tab === "pix" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Dados PIX (Fallback Manual)">
            <p className="text-champagne/40 text-xs leading-relaxed mb-3">
              Estes dados são exibidos caso o Mercado Pago não esteja configurado. Os pagamentos online são processados via <strong className="text-gold">Mercado Pago</strong>.
            </p>
            <Field label="Chave PIX">
              <input value={pixKey} onChange={(e) => setPixKey(e.target.value)} className={inputCls} placeholder="email, CPF ou chave aleatória" />
            </Field>
            <Field label="Nome do favorecido">
              <input value={pixName} onChange={(e) => setPixName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Cidade">
              <input value={pixCity} onChange={(e) => setPixCity(e.target.value)} className={inputCls} />
            </Field>
          </Card>
          <Card title="Mercado Pago">
            <p className="text-champagne/60 text-sm leading-relaxed">
              Token configurado via variável de ambiente <code className="text-gold/70">MERCADO_PAGO_ACCESS_TOKEN</code>.
            </p>
            <p className="text-champagne/40 text-xs mt-3">Para alterar o token, edite o arquivo <code>.env</code> e faça um novo deploy.</p>
          </Card>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-border/40 flex items-center gap-4">
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending || !synced}
          className="btn-gold px-8 py-3 rounded disabled:opacity-50 min-w-[180px]"
        >
          {saveMut.isPending ? "Salvando…" : "Salvar todas as alterações"}
        </button>
        {saveMut.isSuccess && (
          <span className="text-emerald-400 text-sm">✓ Salvo com sucesso</span>
        )}
      </div>
    </div>
  );
}


function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-lg p-6 space-y-3 border-gold/15">
      <h3 className="font-serif text-xl text-champagne">{title}</h3>
      {children}
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-destructive/30 rounded-lg p-8 max-w-sm w-full text-center"
      >
        <h3 className="font-serif text-2xl text-champagne mb-3">{title}</h3>
        <p className="text-champagne/60 text-sm mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded border border-border text-champagne/70 text-xs uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded bg-destructive text-destructive-foreground text-xs uppercase tracking-wider"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
