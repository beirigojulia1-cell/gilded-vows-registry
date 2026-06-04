import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { formatBRL, store, type Gift } from "@/lib/store";
import { useToast } from "./Toast";

export function PurchaseModal({ gift, onClose }: { gift: Gift; onClose: () => void }) {
  const { push } = useToast();
  const settings = store.getSettings();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string>("");
  const [done, setDone] = useState(false);
  const purchases = store.getPurchases();
  const alreadyPurchased = purchases.some((p) => p.giftId === gift.id);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    QRCode.toDataURL(settings.pixKey, { margin: 1, width: 200, color: { dark: "#c9a96e", light: "#0d0b08" } }).then(setQr);
  }, [settings.pixKey]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const copyPix = async () => {
    await navigator.clipboard.writeText(settings.pixKey);
    setCopied(true);
    push("Chave PIX copiada", "success");
    setTimeout(() => setCopied(false), 2200);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (!name.trim()) {
      push("Por favor, informe seu nome", "error");
      return;
    }
    store.addPurchase({ giftId: gift.id, guestName: name.trim(), message: message.trim() });
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl bg-card border border-gold/30 rounded-lg overflow-hidden grid md:grid-cols-2 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Fechar" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 text-champagne/80 hover:text-gold border border-gold/20">×</button>

        {/* LEFT */}
        <div className="relative flex items-center justify-center min-h-[260px] p-10" style={{ background: gift.gradient }}>
          {gift.imageUrl ? (
            <img src={gift.imageUrl} alt={gift.title} className="max-h-[280px] object-contain rounded" />
          ) : (
            <div className="text-[8rem] leading-none drop-shadow-[0_8px_30px_rgba(201,169,110,0.3)]">{gift.icon}</div>
          )}
          <div className="absolute bottom-4 left-6 text-xs tracking-[0.3em] uppercase text-gold/80">{gift.category}</div>
        </div>

        {/* RIGHT */}
        <div className="p-7 md:p-10">
          {done ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">✦</div>
              <h3 className="font-serif text-3xl text-gradient-gold mb-2">Obrigado pelo presente!</h3>
              <p className="text-champagne/70 text-sm">Sua contribuição faz parte da nossa história.</p>
              <button onClick={onClose} className="btn-gold px-8 py-3 rounded mt-8">Fechar</button>
            </div>
          ) : alreadyPurchased ? (
            <div className="text-center py-10">
              <h3 className="font-serif text-2xl text-champagne mb-2">Este presente já foi dado ✦</h3>
              <p className="text-champagne/60 text-sm">Mas há outros esperando por você.</p>
              <button onClick={onClose} className="btn-gold px-8 py-3 rounded mt-8">Ver outros presentes</button>
            </div>
          ) : (
            <>
              <p className="text-[0.65rem] tracking-[0.3em] uppercase text-gold/70 mb-2">{gift.category}</p>
              <h3 className="font-serif text-3xl text-champagne mb-2">{gift.title}</h3>
              {gift.description && <p className="text-champagne/60 text-sm leading-relaxed mb-4">{gift.description}</p>}
              <div className="text-gradient-gold font-serif text-2xl mb-6">{formatBRL(gift.priceCents)}</div>

              <form onSubmit={submit} className="space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-input/60 border border-border rounded px-4 py-3 text-sm text-champagne placeholder:text-champagne/40 focus:border-gold/60 focus:outline-none"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mensagem para o casal (opcional)"
                  rows={3}
                  className="w-full bg-input/60 border border-border rounded px-4 py-3 text-sm text-champagne placeholder:text-champagne/40 focus:border-gold/60 focus:outline-none resize-none"
                />
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" aria-hidden />

                {/* PIX */}
                <div className="border border-gold/15 rounded-lg p-4 space-y-4 bg-black/30">
                  <div>
                    <div className="text-[0.65rem] tracking-[0.25em] uppercase text-gold/70 mb-2">Passo 1 · Chave PIX</div>
                    <div className="flex gap-2">
                      <code className="flex-1 px-3 py-2 bg-black/40 border border-border rounded text-champagne/80 text-sm truncate">{settings.pixKey}</code>
                      <button
                        type="button"
                        onClick={copyPix}
                        className={`px-4 py-2 rounded text-xs tracking-wider uppercase border transition-all ${copied ? "bg-emerald-600/30 border-emerald-500/60 text-emerald-300" : "border-gold/50 text-gold hover:bg-gold/10"}`}
                      >
                        {copied ? "Copiado ✓" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[0.65rem] tracking-[0.25em] uppercase text-gold/70 mb-2">Passo 2 · QR Code</div>
                    <div className="flex items-center gap-4">
                      {qr && <img src={qr} alt="QR Code PIX" className="w-28 h-28 rounded border border-gold/20" />}
                      <p className="italic text-champagne/60 text-xs">Valor sugerido: {formatBRL(gift.priceCents)}<br/>(você pode ajustar o valor no app do banco)</p>
                    </div>
                  </div>
                </div>

                <button type="submit" className="shimmer w-full py-3 rounded bg-gradient-to-r from-[#8a6f3d] via-[#c9a96e] to-[#8a6f3d] text-ink font-medium tracking-[0.18em] uppercase text-xs">
                  Confirmar Presente
                </button>
              </form>
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
