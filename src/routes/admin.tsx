import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ToastProvider, useToast } from "@/components/Toast";
import { ensureDefaultPassword, formatBRL, sha256, store, useStoreSubscribe, type Gift, type Purchase, type Settings } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "G & S · Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ToastProvider>
      <AdminRoot />
    </ToastProvider>
  ),
});

function AdminRoot() {
  ensureDefaultPassword();
  const [authed, setAuthed] = useState(false);
  useEffect(() => setAuthed(store.isLoggedIn()), []);
  return authed ? <AdminApp onLogout={() => { store.setLoggedIn(false); setAuthed(false); }} /> : <Login onSuccess={() => setAuthed(true)} />;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [lockUntil, setLockUntil] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLockUntil(store.isLockedOut()), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockUntil) return;
    const h = await sha256(pass);
    if (h === store.getPassHash()) {
      store.clearAttempts();
      store.setLoggedIn(true);
      onSuccess();
    } else {
      store.registerFailedAttempt();
      setErr("Senha incorreta");
      setLockUntil(store.isLockedOut());
    }
  };

  const remaining = lockUntil ? Math.ceil((lockUntil - Date.now()) / 1000) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.1),transparent_60%)]">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border border-gold/20 rounded-lg p-10 text-center">
        <div className="font-serif text-5xl text-gradient-gold mb-2">G &amp; S</div>
        <p className="text-[0.65rem] tracking-[0.4em] uppercase text-champagne/60 mb-8">Painel de Casamento</p>
        <input
          type="password"
          value={pass}
          onChange={(e) => { setPass(e.target.value); setErr(""); }}
          placeholder="Senha"
          className="w-full bg-input/60 border border-border rounded px-4 py-3 text-champagne text-center tracking-[0.4em] focus:border-gold/60 focus:outline-none mb-4"
          disabled={!!lockUntil}
        />
        {err && <p className="text-destructive text-xs mb-4">{err}</p>}
        {lockUntil > 0 && <p className="text-destructive text-xs mb-4">Bloqueado por {remaining}s</p>}
        <button type="submit" disabled={!!lockUntil} className="btn-gold w-full py-3 rounded disabled:opacity-50">Entrar</button>
        <Link to="/" className="block mt-6 text-[10px] tracking-widest uppercase text-champagne/40 hover:text-gold">← Lista de presentes</Link>
      </form>
    </div>
  );
}

type Section = "dashboard" | "gifts" | "messages" | "settings";

function AdminApp({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<Section>("dashboard");
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => useStoreSubscribe(() => setTick((n) => n + 1)), []);
  const purchases = store.getPurchases();
  const unread = purchases.filter((p) => !p.read).length;

  const nav: { id: Section; label: string; icon: string; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "gifts", label: "Presentes", icon: "🎁" },
    { id: "messages", label: "Mensagens", icon: "💌", badge: unread },
    { id: "settings", label: "Configurações", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`fixed md:static z-40 inset-y-0 left-0 w-64 bg-card border-r border-border/60 transform transition-transform ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 border-b border-border/60">
          <div className="font-serif text-2xl text-gradient-gold">G &amp; S Admin</div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-champagne/50 mt-1">Painel de Casamento</p>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => { setSection(n.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm transition-all ${section === n.id ? "bg-gold/10 text-gold border-l-2 border-gold" : "text-champagne/70 hover:bg-muted/40"}`}
            >
              <span>{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
              {!!n.badge && <span className="text-[10px] bg-gold text-ink rounded-full px-2">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-border/60">
          <Link to="/" className="text-xs text-champagne/60 hover:text-gold">← Ver lista de presentes</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/60">
          <button onClick={() => setOpen(!open)} className="text-gold">☰</button>
          <span className="font-serif text-gold">G &amp; S Admin</span>
          <span />
        </header>
        <main className="p-6 md:p-10 max-w-6xl">
          {section === "dashboard" && <Dashboard />}
          {section === "gifts" && <GiftsAdmin />}
          {section === "messages" && <Messages />}
          {section === "settings" && <SettingsPanel onLogout={onLogout} />}
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
  const gifts = store.getGifts();
  const purchases = store.getPurchases();
  const total = gifts.length;
  const taken = new Set(purchases.map((p) => p.giftId)).size;
  const available = total - taken;
  const raised = purchases.reduce((acc, p) => {
    const g = gifts.find((x) => x.id === p.giftId);
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
            {purchases.slice(0, 8).map((p) => {
              const g = gifts.find((x) => x.id === p.giftId);
              return (
                <li key={p.id} className="py-3 flex justify-between text-sm">
                  <span className="text-champagne"><b className="text-gold">{p.guestName}</b> presenteou <i>{g?.title ?? "—"}</i></span>
                  <span className="text-champagne/40 text-xs">{new Date(p.createdAt).toLocaleString("pt-BR")}</span>
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
  const [gifts, setGifts] = useState<Gift[]>(() => store.getGifts());
  const purchasedIds = useMemo(() => new Set(store.getPurchases().map((p) => p.giftId)), [gifts]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [status, setStatus] = useState<"all" | "available" | "purchased">("all");
  const [editing, setEditing] = useState<Gift | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Gift | null>(null);

  useEffect(() => useStoreSubscribe(() => setGifts(store.getGifts())), []);

  const cats = ["Todas", ...Array.from(new Set(gifts.map((g) => g.category)))];
  const filtered = gifts.filter((g) => {
    if (q && !g.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "Todas" && g.category !== cat) return false;
    const isTaken = purchasedIds.has(g.id);
    if (status === "available" && isTaken) return false;
    if (status === "purchased" && !isTaken) return false;
    return true;
  });

  const remove = (g: Gift) => {
    store.setGifts(gifts.filter((x) => x.id !== g.id));
    push("Presente removido", "success");
    setConfirmDel(null);
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-4xl text-champagne">Presentes</h2>
          <p className="text-champagne/50 text-sm">Gerencie sua lista</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-gold px-6 py-3 rounded">+ Adicionar Presente</button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="flex-1 min-w-[200px] bg-input/60 border border-border rounded px-4 py-2 text-sm text-champagne focus:border-gold/60 focus:outline-none" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-input/60 border border-border rounded px-3 py-2 text-sm text-champagne">
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as "all" | "available" | "purchased")} className="bg-input/60 border border-border rounded px-3 py-2 text-sm text-champagne">
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
              <div className="h-32 flex items-center justify-center text-5xl" style={{ background: g.gradient }}>
                {g.imageUrl ? <img src={g.imageUrl} alt="" className="w-full h-full object-cover" /> : g.icon}
              </div>
              <div className="p-4">
                <div className="text-[10px] tracking-[0.25em] uppercase text-gold/70 mb-1">{g.category}</div>
                <h3 className="font-serif text-lg text-champagne">{g.title}</h3>
                <div className="text-gradient-gold font-serif text-lg mb-3">{formatBRL(g.priceCents)}</div>
                {taken && <div className="text-[10px] text-emerald-400 mb-2">✓ Presenteado</div>}
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(g); setShowForm(true); }} className="flex-1 text-xs px-3 py-2 rounded border border-gold/30 text-champagne hover:bg-gold/10">Editar</button>
                  <button onClick={() => setConfirmDel(g)} className="flex-1 text-xs px-3 py-2 rounded border border-destructive/40 text-destructive hover:bg-destructive/10">Excluir</button>
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
          onConfirm={() => remove(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

function GiftForm({ gift, onClose }: { gift: Gift | null; onClose: () => void }) {
  const { push } = useToast();
  const [title, setTitle] = useState(gift?.title ?? "");
  const [category, setCategory] = useState(gift?.category ?? "");
  const [price, setPrice] = useState(gift ? String(gift.priceCents / 100) : "");
  const [icon, setIcon] = useState(gift?.icon ?? "🎁");
  const [description, setDescription] = useState(gift?.description ?? "");
  const [imageUrl, setImageUrl] = useState(gift?.imageUrl ?? "");
  const [dragOver, setDragOver] = useState(false);

  const onFile = (file: File) => {
    if (!/image\/(png|jpeg|webp)/.test(file.type)) {
      push("Formato de imagem inválido", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim() || !price) {
      push("Preencha os campos obrigatórios", "error");
      return;
    }
    const cents = Math.round(parseFloat(price.replace(",", ".")) * 100);
    const gifts = store.getGifts();
    if (gift) {
      store.setGifts(gifts.map((g) => g.id === gift.id ? { ...gift, title, category, priceCents: cents, icon, description, imageUrl } : g));
      push("Presente atualizado", "success");
    } else {
      const grad = `linear-gradient(135deg, hsl(${Math.random() * 360} 20% 15%) 0%, #0d0b08 100%)`;
      store.setGifts([...gifts, { id: crypto.randomUUID(), title, category, priceCents: cents, icon, description, imageUrl, gradient: grad }]);
      push("Presente adicionado", "success");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-card border border-gold/30 rounded-lg p-8 w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <h3 className="font-serif text-2xl text-champagne mb-6">{gift ? "Editar Presente" : "Novo Presente"}</h3>
        <div className="space-y-4">
          <Field label="Nome do presente *"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria *"><input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} /></Field>
            <Field label="Valor (R$) *"><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Emoji / Ícone"><input value={icon} onChange={(e) => setIcon(e.target.value)} className={inputCls} /></Field>
          <Field label="Descrição"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} /></Field>
          <Field label="Imagem (opcional)">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
              className={`border-2 border-dashed rounded p-4 text-center text-xs text-champagne/60 ${dragOver ? "border-gold bg-gold/5" : "border-border"}`}
            >
              {imageUrl ? (
                <div>
                  <img src={imageUrl} alt="" className="max-h-32 mx-auto rounded mb-2" />
                  <button type="button" onClick={() => setImageUrl("")} className="text-destructive text-xs">Remover</button>
                </div>
              ) : (
                <>
                  Arraste uma imagem (PNG/JPG/WEBP) ou
                  <label className="block mt-2 cursor-pointer text-gold">
                    selecionar arquivo
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                  </label>
                </>
              )}
            </div>
            <input value={imageUrl.startsWith("data:") ? "" : imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="ou URL da imagem" className={`${inputCls} mt-2`} />
          </Field>
        </div>
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded border border-border text-champagne/70 text-xs uppercase tracking-wider">Cancelar</button>
          <button type="submit" className="flex-1 btn-gold py-3 rounded">Salvar</button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full bg-input/60 border border-border rounded px-3 py-2 text-sm text-champagne focus:border-gold/60 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.25em] uppercase text-champagne/60 block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Messages() {
  const { push } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>(() => store.getPurchases());
  const [confirmClear, setConfirmClear] = useState(false);
  const gifts = store.getGifts();
  useEffect(() => useStoreSubscribe(() => setPurchases(store.getPurchases())), []);

  useEffect(() => {
    const unread = purchases.filter((p) => !p.read);
    if (unread.length) {
      setTimeout(() => store.setPurchases(purchases.map((p) => ({ ...p, read: true }))), 800);
    }
  }, [purchases]);

  const clear = () => {
    store.setPurchases([]);
    push("Mensagens limpas", "success");
    setConfirmClear(false);
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-4xl text-champagne">Mensagens</h2>
          <p className="text-champagne/50 text-sm">Recados dos convidados</p>
        </div>
        {purchases.length > 0 && <button onClick={() => setConfirmClear(true)} className="px-5 py-2 rounded border border-destructive/40 text-destructive text-xs uppercase tracking-wider hover:bg-destructive/10">Limpar tudo</button>}
      </div>
      {purchases.length === 0 ? (
        <p className="text-champagne/40 italic text-center py-20">Nenhuma mensagem ainda.</p>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => {
            const g = gifts.find((x) => x.id === p.giftId);
            return (
              <div key={p.id} className="bg-card border border-gold/15 rounded-lg p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-serif text-lg text-gold">{p.guestName}</div>
                    <div className="text-xs text-champagne/60 italic">presenteou: {g?.title ?? "—"}</div>
                  </div>
                  <div className="text-[10px] text-champagne/40">{new Date(p.createdAt).toLocaleString("pt-BR")}</div>
                </div>
                {p.message && <p className="text-champagne/80 text-sm mt-3 border-l-2 border-gold/40 pl-4 italic">"{p.message}"</p>}
              </div>
            );
          })}
        </div>
      )}
      {confirmClear && <ConfirmDialog title="Limpar mensagens?" message="Esta ação não pode ser desfeita." onConfirm={clear} onCancel={() => setConfirmClear(false)} />}
    </div>
  );
}

function SettingsPanel({ onLogout }: { onLogout: () => void }) {
  const { push } = useToast();
  const [settings, setSettings] = useState<Settings>(() => store.getSettings());
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const savePix = () => { store.setSettings(settings); push("PIX salvo", "success"); };
  const saveInfo = () => { store.setSettings(settings); push("Informações salvas", "success"); };

  const changePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confPass) return push("Senhas não coincidem", "error");
    if (newPass.length < 6) return push("Senha muito curta", "error");
    const curHash = await sha256(curPass);
    if (curHash !== store.getPassHash()) return push("Senha atual incorreta", "error");
    store.setPassHash(await sha256(newPass));
    setCurPass(""); setNewPass(""); setConfPass("");
    push("Senha alterada", "success");
  };

  return (
    <div>
      <h2 className="font-serif text-4xl text-champagne mb-2">Configurações</h2>
      <p className="text-champagne/50 text-sm mb-8">Personalize sua lista</p>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Pagamento PIX">
          <Field label="Chave PIX"><input value={settings.pixKey} onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })} className={inputCls} /></Field>
          <Field label="Nome do destinatário"><input value={settings.pixName} onChange={(e) => setSettings({ ...settings, pixName: e.target.value })} className={inputCls} /></Field>
          <Field label="Cidade"><input value={settings.pixCity} onChange={(e) => setSettings({ ...settings, pixCity: e.target.value })} className={inputCls} /></Field>
          <button onClick={savePix} className="btn-gold w-full py-2.5 rounded mt-2">Salvar PIX</button>
        </Card>

        <Card title="Informações do Casal">
          <Field label="Nomes"><input value={settings.coupleNames} onChange={(e) => setSettings({ ...settings, coupleNames: e.target.value })} className={inputCls} /></Field>
          <Field label="Data do casamento"><input type="datetime-local" value={settings.weddingDate.slice(0, 16)} onChange={(e) => setSettings({ ...settings, weddingDate: e.target.value })} className={inputCls} /></Field>
          <button onClick={saveInfo} className="btn-gold w-full py-2.5 rounded mt-2">Salvar Informações</button>
        </Card>

        <Card title="Segurança">
          <form onSubmit={changePass} className="space-y-3">
            <Field label="Senha atual"><input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} className={inputCls} /></Field>
            <Field label="Nova senha"><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className={inputCls} /></Field>
            <Field label="Confirmar nova senha"><input type="password" value={confPass} onChange={(e) => setConfPass(e.target.value)} className={inputCls} /></Field>
            <button type="submit" className="btn-gold w-full py-2.5 rounded">Alterar Senha</button>
          </form>
        </Card>

        <Card title="Zona de Perigo" danger>
          <button onClick={() => setConfirmReset(true)} className="w-full py-2.5 rounded border border-destructive/50 text-destructive text-xs uppercase tracking-wider hover:bg-destructive/10">Restaurar lista padrão</button>
          <button onClick={onLogout} className="w-full py-2.5 rounded border border-border text-champagne/70 text-xs uppercase tracking-wider hover:bg-muted/40 mt-3">Sair</button>
        </Card>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Restaurar lista?"
          message="Todos os presentes voltarão ao padrão. Esta ação não pode ser desfeita."
          onConfirm={() => { store.resetGifts(); push("Lista restaurada", "success"); setConfirmReset(false); }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function Card({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-card border rounded-lg p-6 space-y-3 ${danger ? "border-destructive/30" : "border-gold/15"}`}>
      <h3 className={`font-serif text-xl ${danger ? "text-destructive" : "text-champagne"}`}>{title}</h3>
      {children}
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-destructive/30 rounded-lg p-8 max-w-sm w-full text-center">
        <h3 className="font-serif text-2xl text-champagne mb-3">{title}</h3>
        <p className="text-champagne/60 text-sm mb-8">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded border border-border text-champagne/70 text-xs uppercase tracking-wider">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded bg-destructive text-destructive-foreground text-xs uppercase tracking-wider">Confirmar</button>
        </div>
      </div>
    </div>
  );
}
