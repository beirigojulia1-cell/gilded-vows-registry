import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "G & S · Acesso" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!email || password.length < 6) {
      setMsg({ kind: "error", text: "Informe email e senha de pelo menos 6 caracteres." });
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        setMsg({
          kind: "info",
          text: "Conta criada! Se a confirmação de email estiver desabilitada, faça login agora. Caso contrário, confirme pelo email.",
        });
        setMode("login");
      }
    } catch (err: any) {
      setMsg({ kind: "error", text: err?.message ?? "Erro ao autenticar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.1),transparent_60%)]">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-card border border-gold/20 rounded-lg p-10"
      >
        <div className="text-center mb-6">
          <div className="font-serif text-5xl text-gradient-gold mb-2">G &amp; S</div>
          <p className="text-[0.65rem] tracking-[0.4em] uppercase text-champagne/60">
            {mode === "login" ? "Acesso ao Painel" : "Criar Conta Admin"}
          </p>
        </div>
        <label className="block mb-3">
          <span className="text-[10px] tracking-[0.25em] uppercase text-champagne/60 block mb-1.5">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-input/60 border border-border rounded px-4 py-3 text-sm text-champagne focus:border-gold/60 focus:outline-none"
            autoComplete="email"
          />
        </label>
        <label className="block mb-4">
          <span className="text-[10px] tracking-[0.25em] uppercase text-champagne/60 block mb-1.5">
            Senha
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input/60 border border-border rounded px-4 py-3 text-sm text-champagne focus:border-gold/60 focus:outline-none"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {msg && (
          <p
            className={`text-xs mb-4 ${msg.kind === "error" ? "text-destructive" : "text-emerald-400"}`}
          >
            {msg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-3 rounded disabled:opacity-50"
        >
          {loading ? "..." : mode === "login" ? "Entrar" : "Criar Conta"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMsg(null);
          }}
          className="block mt-4 mx-auto text-[11px] text-champagne/60 hover:text-gold"
        >
          {mode === "login" ? "Não tem conta? Criar conta admin" : "Já tem conta? Entrar"}
        </button>
        <Link
          to="/"
          className="block mt-6 text-center text-[10px] tracking-widest uppercase text-champagne/40 hover:text-gold"
        >
          ← Voltar ao site
        </Link>
      </form>
    </div>
  );
}
