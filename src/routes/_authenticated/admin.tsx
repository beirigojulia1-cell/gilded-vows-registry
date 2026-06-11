import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  reorderGifts,
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
  const rawGifts: Gift[] = useQuery(giftsQuery).data?.gifts ?? [];
  const purchasesQueryResult = useQuery(purchasesQuery);
  const purchases: Purchase[] = purchasesQueryResult.data?.purchases ?? [];
  const purchasedIds = new Set(purchases.map((p: Purchase) => p.giftId));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<GiftCategory | "Todas">("Todas");
  const [status, setStatus] = useState<"all" | "available" | "purchased">("all");
  const [editing, setEditing] = useState<Gift | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Gift | null>(null);
  // Local ordered list for drag-and-drop (only used when no filter is active)
  const [localOrder, setLocalOrder] = useState<Gift[]>([]);
  const [reordering, setReordering] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  // Sync localOrder when gifts load or change
  useEffect(() => {
    setLocalOrder([...rawGifts]);
  }, [rawGifts]);

  const isFiltering = q !== "" || cat !== "Todas" || status !== "all";
  const gifts = isFiltering ? rawGifts : localOrder;

  const cats: Array<GiftCategory | "Todas"> = [
    "Todas",
    ...Array.from(new Set(rawGifts.map((g: Gift) => g.category))),
  ];
  const filtered = isFiltering
    ? rawGifts.filter((g: Gift) => {
        if (q && !g.title.toLowerCase().includes(q.toLowerCase())) return false;
        if (cat !== "Todas" && g.category !== cat) return false;
        const isTaken = purchasedIds.has(g.id);
        if (status === "available" && isTaken) return false;
        if (status === "purchased" && !isTaken) return false;
        return true;
      })
    : localOrder;

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

  const reorderMut = useMutation({
    mutationFn: (order: { id: string; sortOrder: number }[]) =>
      reorderGifts({ data: { order } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gifts"] });
      push("Ordem salva!", "success");
      setReordering(false);
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  function moveGift(fromIdx: number, toIdx: number) {
    const next = [...localOrder];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setLocalOrder(next);
    setReordering(true);
  }

  function saveOrder() {
    const order = localOrder.map((g, i) => ({ id: g.id, sortOrder: i + 1 }));
    reorderMut.mutate(order);
  }

  function handleDragStart(idx: number) {
    dragItem.current = idx;
    setDragIdx(idx);
  }
  function handleDragEnter(idx: number) {
    dragOver.current = idx;
    setDropIdx(idx);
  }
  function handleDragEnd() {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      moveGift(dragItem.current, dragOver.current);
    }
    dragItem.current = null;
    dragOver.current = null;
    setDragIdx(null);
    setDropIdx(null);
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-4xl text-champagne">Presentes</h2>
          <p className="text-champagne/50 text-sm">Gerencie sua lista</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {reordering && (
            <button
              onClick={saveOrder}
              disabled={reorderMut.isPending}
              className="btn-gold px-5 py-3 rounded text-sm"
            >
              {reorderMut.isPending ? "Salvando…" : "💾 Salvar Ordem"}
            </button>
          )}
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

      {!isFiltering && (
        <p className="text-champagne/40 text-xs mb-4 flex items-center gap-2">
          <span>⠿</span> Arraste os cards para reordenar ou use os botões ↑↓
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((g, idx) => {
          const taken = purchasedIds.has(g.id);
          const isDragging = dragIdx === idx;
          const isDropTarget = dropIdx === idx && dragIdx !== idx;
          return (
            <div
              key={g.id}
              draggable={!isFiltering}
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={handleDragEnd}
              className={`bg-card border rounded-lg overflow-hidden transition-all duration-200
                ${isDragging ? "opacity-40 scale-95 border-gold/50" : ""}
                ${isDropTarget ? "border-gold ring-2 ring-gold/40" : "border-gold/15"}
                ${!isFiltering ? "cursor-grab active:cursor-grabbing" : ""}
              `}
            >
              <div
                className="h-32 flex items-center justify-center text-5xl relative group"
                style={{ background: g.gradient ?? undefined }}
              >
                {g.imageUrl ? (
                  <img src={g.imageUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  g.icon
                )}
                {!isFiltering && (
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                    <button
                      onClick={() => idx > 0 && moveGift(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Mover para cima"
                      className="w-7 h-7 rounded bg-black/60 border border-gold/30 text-gold text-sm hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => idx < filtered.length - 1 && moveGift(idx, idx + 1)}
                      disabled={idx === filtered.length - 1}
                      title="Mover para baixo"
                      className="w-7 h-7 rounded bg-black/60 border border-gold/30 text-gold text-sm hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                  </div>
                )}
                {!isFiltering && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] bg-black/60 text-champagne/60 px-2 py-1 rounded tracking-wider">#{idx + 1}</span>
                  </div>
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

  const [coupleNames, setCoupleNames] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [content, setContent] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"evento" | "textos" | "imagens">("evento");
  const [synced, setSynced] = useState(false);
  const [imgUploading, setImgUploading] = useState<string | null>(null);

  useEffect(() => {
    if (settings && !synced) {
      setCoupleNames(settings.coupleNames);
      setWeddingDate(settings.weddingDate?.slice(0, 16) ?? "");
      setContent({ ...settings.content });
      setSynced(true);
    }
  }, [settings, synced]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings({
        data: { coupleNames, weddingDate, pixKey: "", pixName: "", pixCity: "", content },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      push("Alterações salvas com sucesso!", "success");
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  const setC = (key: string, val: string) => setContent((prev) => ({ ...prev, [key]: val }));
  const c = (key: string, fallback = "") => content[key] ?? fallback;

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
        const res = await uploadSiteImage({ data: { fileName: file.name, contentType: file.type, base64 } });
        setC(key, res.url);
        push("Imagem enviada com sucesso!", "success");
      } catch (e: any) {
        push(e?.message ?? "Erro no upload", "error");
      } finally {
        setImgUploading(null);
      }
    };
    reader.onerror = () => { push("Erro ao ler arquivo", "error"); setImgUploading(null); };
    reader.readAsDataURL(file);
  };

  // Reusable image upload widget
  const ImageUpload = ({ label, fieldKey, hint, aspect = "landscape" }: {
    label: string; fieldKey: string; hint?: string; aspect?: "landscape" | "portrait" | "square";
  }) => {
    const url = c(fieldKey);
    const loading = imgUploading === fieldKey;
    const aspectClass = aspect === "portrait" ? "aspect-[3/4]" : aspect === "square" ? "aspect-square" : "aspect-video";
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-[0.2em] uppercase text-champagne/60 font-medium">{label}</span>
          {url && (
            <button type="button" onClick={() => setC(fieldKey, "")}
              className="text-[10px] text-destructive/70 hover:text-destructive transition-colors">
              ✕ Remover
            </button>
          )}
        </div>
        {hint && <p className="text-champagne/30 text-[11px]">{hint}</p>}

        {/* Preview */}
        {url && (
          <div className={`relative w-full ${aspectClass} rounded overflow-hidden border border-gold/20 bg-black/30`}>
            <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}

        {/* Drop zone */}
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
          className={`border-2 border-dashed rounded-lg p-4 text-center text-xs text-champagne/40 transition-colors cursor-pointer focus-within:border-gold/40
            ${loading ? "border-gold/40 bg-gold/5" : "border-border/50 hover:border-gold/30 hover:bg-white/[0.02]"}`}
        >
          {loading ? (
            <span className="text-gold">Enviando… aguarde</span>
          ) : (
            <>
              <p className="mb-1">Arraste a foto aqui, ou cole com <kbd className="bg-white/10 px-1 rounded">Ctrl+V</kbd></p>
              <label className="cursor-pointer text-gold/80 hover:text-gold underline-offset-2 hover:underline">
                selecionar arquivo
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f, fieldKey); }} />
              </label>
            </>
          )}
        </div>
      </div>
    );
  };

  // Focus slider with live preview
  const FocusSlider = ({ chapterNum, imgKey, focusKey }: { chapterNum: number; imgKey: string; focusKey: string }) => {
    const imgUrl = c(imgKey);
    const focusVal = parseInt(c(focusKey, "15"), 10);
    return (
      <div className="space-y-2 mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.2em] uppercase text-champagne/50">Enquadramento vertical</span>
          <span className="text-gold text-xs font-mono">{focusVal}%</span>
        </div>
        {imgUrl && (
          <div className="relative w-full h-24 rounded overflow-hidden border border-gold/10 bg-black/20">
            <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-all duration-150"
              style={{ objectPosition: `center ${focusVal}%` }} />
            <div className="absolute left-0 right-0 h-px bg-gold/50 pointer-events-none"
              style={{ top: `${focusVal}%` }} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-champagne/30 text-[10px]">Topo</span>
          <input type="range" min={0} max={100} value={focusVal}
            onChange={(e) => setC(focusKey, e.target.value)}
            className="flex-1 accent-gold cursor-pointer" />
          <span className="text-champagne/30 text-[10px]">Base</span>
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
  ];

  const CHAPTER_DEFAULTS = [
    { n: 1, tag: "Primeiro Capítulo", title: "Primeiro Encontro", year: "2019", text: "Naquele dia, o universo conspirou para que dois caminhos se cruzassem. Um olhar que durou apenas um instante — mas que mudaria tudo para sempre." },
    { n: 2, tag: "Segundo Capítulo",  title: "Primeira Viagem",   year: "2020", text: "Descobrir o mundo juntos revelou que o melhor destino nunca é um lugar — é a pessoa ao seu lado." },
    { n: 3, tag: "Terceiro Capítulo", title: "Momentos Especiais", year: "2021 — 2023", text: "Cada risada compartilhada, cada silêncio confortável, cada momento ordinário transformado em memória preciosa e eterna." },
    { n: 4, tag: "Quarto Capítulo",  title: "Pedido de Casamento", year: "2024", text: "\"Você quer casar comigo?\" — e o tempo parou. O coração respondeu antes mesmo das palavras. Sim. Para sempre. Sim." },
  ];

  return (
    <div>
      <h2 className="font-serif text-4xl text-champagne mb-1">Configurações</h2>
      <p className="text-champagne/50 text-sm mb-8">Personalize todo o conteúdo do seu site</p>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap mb-8 border-b border-border/60 pb-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded text-sm transition-all ${tab === t.id ? "bg-gold/15 text-gold border border-gold/30" : "text-champagne/60 hover:text-champagne hover:bg-white/5"}`}>
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
            <Field label="Legenda superior do hero">
              <input value={c("heroSubtitle", "Casamento · 2026")} onChange={(e) => setC("heroSubtitle", e.target.value)} className={inputCls} />
            </Field>
          </Card>

          <Card title="Data & Local">
            <Field label="Data/Hora da cerimônia">
              <input type="datetime-local" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} className={inputCls} />
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
            <Field label="Texto da citação/história principal">
              <textarea rows={8} value={c("quoteMain", SITE_CONTENT_DEFAULTS.quoteMain)} onChange={(e) => setC("quoteMain", e.target.value)} className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Segunda linha (itálica + dourada)">
              <input value={c("quoteItalic", "mas acabam se tornando eternas.")} onChange={(e) => setC("quoteItalic", e.target.value)} className={inputCls} />
            </Field>
          </Card>

          <Card title="Capítulos da História do Casal">
            <p className="text-champagne/40 text-xs mb-4">Edite o título, tag, ano e texto de cada capítulo da história.</p>
            <div className="space-y-6">
              {CHAPTER_DEFAULTS.map((ch) => (
                <div key={ch.n} className="border border-border/40 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif text-gold/60 text-lg">{String(ch.n).padStart(2, "0")}</span>
                    <span className="text-champagne/60 text-sm font-medium">{c(`chapter${ch.n}Title`, ch.title)}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Etiqueta do capítulo">
                      <input value={c(`chapter${ch.n}Tag`, ch.tag)} onChange={(e) => setC(`chapter${ch.n}Tag`, e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Título">
                      <input value={c(`chapter${ch.n}Title`, ch.title)} onChange={(e) => setC(`chapter${ch.n}Title`, e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Ano / Período">
                      <input value={c(`chapter${ch.n}Year`, ch.year)} onChange={(e) => setC(`chapter${ch.n}Year`, e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Texto do capítulo">
                    <textarea rows={3} value={c(`chapter${ch.n}Text`, ch.text)}
                      onChange={(e) => setC(`chapter${ch.n}Text`, e.target.value)}
                      className={`${inputCls} resize-none`} />
                  </Field>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Seção de Confirmação (RSVP)">
            <Field label="Subtexto abaixo do título">
              <input value={c("rsvpSubtitle", "Sua presença é o maior presente que poderíamos receber.")} onChange={(e) => setC("rsvpSubtitle", e.target.value)} className={inputCls} />
            </Field>
          </Card>

          <Card title="Frase de Encerramento">
            <Field label="Frase da última seção do site">
              <textarea rows={3} value={c("closingPhrase", "Mal podemos esperar para viver esse momento com você.")}
                onChange={(e) => setC("closingPhrase", e.target.value)} className={`${inputCls} resize-none`} />
            </Field>
          </Card>
        </div>
      )}

      {/* ── IMAGENS ── */}
      {tab === "imagens" && (
        <div className="space-y-6">
          {/* Principal images */}
          <Card title="Imagens Principais do Site">
            <div className="grid md:grid-cols-2 gap-6">
              <ImageUpload label="Foto do Hero (fundo principal)"
                fieldKey="heroImageUrl"
                hint="Aparece como fundo da primeira seção. Recomendado: landscape, mín. 1400px."
                aspect="landscape" />
              <ImageUpload label="Foto de Encerramento"
                fieldKey="closingImageUrl"
                hint="Aparece como fundo da última seção do site."
                aspect="landscape" />
            </div>
          </Card>

          {/* Chapter images */}
          <Card title="Fotos dos Capítulos da História">
            <p className="text-champagne/40 text-xs mb-6 leading-relaxed">
              Faça upload das fotos de cada capítulo. Use o controle de enquadramento para ajustar qual parte da foto aparece em destaque.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {CHAPTER_DEFAULTS.map((ch) => (
                <div key={ch.n} className="space-y-1">
                  <div className="text-[11px] tracking-[0.25em] uppercase text-gold/70 mb-3 font-medium">
                    Capítulo {ch.n} — {c(`chapter${ch.n}Title`, ch.title)}
                  </div>
                  <ImageUpload
                    label={`Foto do capítulo ${ch.n}`}
                    fieldKey={`chapter${ch.n}ImageUrl`}
                    hint="Recomendado: retrato (3:4), mín. 800px altura."
                    aspect="portrait"
                  />
                  <FocusSlider
                    chapterNum={ch.n}
                    imgKey={`chapter${ch.n}ImageUrl`}
                    focusKey={`chapter${ch.n}FocusY`}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-border/40 flex items-center gap-4">
        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !synced}
          className="btn-gold px-8 py-3 rounded disabled:opacity-50 min-w-[180px]">
          {saveMut.isPending ? "Salvando…" : "Salvar todas as alterações"}
        </button>
        {saveMut.isSuccess && <span className="text-emerald-400 text-sm">✓ Salvo com sucesso</span>}
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
