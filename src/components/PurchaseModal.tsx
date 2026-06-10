import { useEffect, useRef, useState } from "react";
import { formatBRL } from "@/lib/store";
import type { Gift } from "@/lib/wedding-types";
import { useToast } from "./Toast";
import {
  createMercadoPagoPixPayment,
  createMercadoPagoCardPreference,
  checkMercadoPagoPaymentStatus,
  createPurchase,
} from "@/lib/wedding.functions";

type Tab = "pix" | "card";

export function PurchaseModal({
  gift,
  alreadyPurchased = false,
  onClose,
}: {
  gift: Gift;
  alreadyPurchased?: boolean;
  onClose: () => void;
}) {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("pix");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // PIX state
  const [pix, setPix] = useState<{
    paymentId: string;
    qrBase64: string;
    qrCode: string;
    expiresAt: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [onClose]);

  /** Persists the purchase in Supabase after payment confirmation */
  async function persistPurchase() {
    try {
      await createPurchase({
        data: {
          giftId: gift.id,
          guestName: name.trim() || "Convidado",
          message: message.trim(),
        },
      });
    } catch {
      // best-effort — MP webhook or lookup will retry
    }
  }

  async function startPix(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    if (!name.trim()) return push("Por favor, informe seu nome", "error");
    setLoading(true);
    try {
      const res = await createMercadoPagoPixPayment({
        data: {
          giftId: gift.id,
          giftTitle: gift.title,
          priceCents: gift.priceCents,
          guestName: name.trim(),
          message: message.trim(),
        },
      });
      if (!res.qrCode) throw new Error("QR Code não retornado");
      setPix({
        paymentId: res.paymentId,
        qrBase64: res.qrCodeBase64,
        qrCode: res.qrCode,
        expiresAt: res.expiresAt,
      });
      // Polling for payment confirmation
      pollRef.current = window.setInterval(async () => {
        try {
          const st = await checkMercadoPagoPaymentStatus({
            data: {
              paymentId: res.paymentId,
              giftId: gift.id,
              guestName: name.trim(),
              message: message.trim(),
            },
          });
          if (st.approved) {
            if (pollRef.current) window.clearInterval(pollRef.current);
            await persistPurchase();
            setDone(true);
          }
        } catch {}
      }, 4000);
    } catch (err: any) {
      push(err?.message || "Erro ao gerar PIX", "error");
    } finally {
      setLoading(false);
    }
  }

  async function startCard(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    if (!name.trim()) return push("Por favor, informe seu nome", "error");
    setLoading(true);
    try {
      const origin = window.location.origin;
      const res = await createMercadoPagoCardPreference({
        data: {
          giftId: gift.id,
          giftTitle: gift.title,
          priceCents: gift.priceCents,
          guestName: name.trim(),
          message: message.trim(),
          origin,
        },
      });
      if (!res.initPoint) throw new Error("Link de pagamento não retornado");
      window.location.href = res.initPoint;
    } catch (err: any) {
      push(err?.message || "Erro ao iniciar pagamento", "error");
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    push("Código PIX copiado", "success");
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-card border border-gold/30 rounded-lg overflow-hidden grid md:grid-cols-2 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/60 text-champagne hover:text-gold border border-gold/30 text-xl leading-none"
        >
          ×
        </button>

        {/* LEFT — gift image / icon */}
        <div
          className="relative flex items-center justify-center min-h-[200px] sm:min-h-[260px] p-6 sm:p-10"
          style={{ background: gift.gradient ?? "linear-gradient(135deg,#1a1512,#0d0b08)" }}
        >
          {gift.imageUrl ? (
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="max-h-[180px] sm:max-h-[280px] object-contain rounded"
            />
          ) : (
            <div className="text-[6rem] sm:text-[8rem] leading-none drop-shadow-[0_8px_30px_rgba(201,169,110,0.3)]">
              {gift.icon || "🎁"}
            </div>
          )}
          <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 text-[0.65rem] sm:text-xs tracking-[0.3em] uppercase text-gold/80">
            {gift.category}
          </div>
        </div>

        {/* RIGHT — form / states */}
        <div className="p-5 sm:p-7 md:p-10">
          {done ? (
            <div className="text-center py-8 sm:py-10">
              <div className="text-5xl mb-4">✦</div>
              <h3 className="font-serif text-2xl sm:text-3xl text-gradient-gold mb-2">
                Pagamento confirmado!
              </h3>
              <p className="text-champagne/70 text-sm">
                Obrigado por fazer parte da nossa história.
              </p>
              <button
                onClick={onClose}
                className="btn-gold px-8 py-3 rounded mt-6 sm:mt-8 min-h-[48px]"
              >
                Fechar
              </button>
            </div>
          ) : alreadyPurchased ? (
            <div className="text-center py-8 sm:py-10">
              <h3 className="font-serif text-xl sm:text-2xl text-champagne mb-2">
                Este presente já foi dado ✦
              </h3>
              <p className="text-champagne/60 text-sm">Mas há outros esperando por você.</p>
              <button
                onClick={onClose}
                className="btn-gold px-8 py-3 rounded mt-6 sm:mt-8 min-h-[48px]"
              >
                Ver outros presentes
              </button>
            </div>
          ) : (
            <>
              <p className="text-[0.65rem] tracking-[0.3em] uppercase text-gold/70 mb-2">
                {gift.category}
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl text-champagne mb-2">{gift.title}</h3>
              {gift.description && (
                <p className="text-champagne/60 text-sm leading-relaxed mb-4">{gift.description}</p>
              )}
              <div className="text-gradient-gold font-serif text-xl sm:text-2xl mb-5 sm:mb-6">
                {formatBRL(gift.priceCents)}
              </div>

              {/* Tabs */}
              <div className="flex border border-gold/25 rounded overflow-hidden mb-5">
                <button
                  type="button"
                  onClick={() => setTab("pix")}
                  className={`flex-1 py-3 text-[0.7rem] tracking-[0.2em] uppercase transition-colors min-h-[44px] ${tab === "pix" ? "bg-gold text-ink" : "text-champagne/70 hover:text-gold"}`}
                >
                  PIX
                </button>
                <button
                  type="button"
                  onClick={() => setTab("card")}
                  className={`flex-1 py-3 text-[0.7rem] tracking-[0.2em] uppercase transition-colors min-h-[44px] ${tab === "card" ? "bg-gold text-ink" : "text-champagne/70 hover:text-gold"}`}
                >
                  Cartão
                </button>
              </div>

              {/* Name + message fields (shown before PIX QR is generated) */}
              {!pix && (
                <div className="space-y-4 mb-4">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-input/60 border border-border rounded px-4 py-3 text-base sm:text-sm text-champagne placeholder:text-champagne/40 focus:border-gold/60 focus:outline-none min-h-[48px]"
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mensagem para o casal (opcional)"
                    rows={3}
                    className="w-full bg-input/60 border border-border rounded px-4 py-3 text-base sm:text-sm text-champagne placeholder:text-champagne/40 focus:border-gold/60 focus:outline-none resize-none"
                  />
                  {/* honeypot — hidden from real users */}
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="hidden"
                    aria-hidden
                  />
                </div>
              )}

              {tab === "pix" ? (
                pix ? (
                  <div className="border border-gold/20 rounded-lg p-4 sm:p-5 bg-black/30 space-y-4">
                    <p className="text-[0.65rem] tracking-[0.25em] uppercase text-gold/70 text-center">
                      Escaneie o QR Code ou copie o código
                    </p>
                    {pix.qrBase64 ? (
                      <img
                        src={`data:image/png;base64,${pix.qrBase64}`}
                        alt="QR Code PIX"
                        className="mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded bg-white p-2"
                      />
                    ) : null}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <code className="flex-1 px-3 py-2 bg-black/40 border border-border rounded text-champagne/80 text-[0.7rem] sm:text-xs break-all">
                        {pix.qrCode}
                      </code>
                      <button
                        type="button"
                        onClick={copyPix}
                        className={`px-4 py-3 rounded text-xs tracking-wider uppercase border transition-all min-h-[44px] ${copied ? "bg-emerald-600/30 border-emerald-500/60 text-emerald-300" : "border-gold/50 text-gold hover:bg-gold/10"}`}
                      >
                        {copied ? "Copiado ✓" : "Copiar"}
                      </button>
                    </div>
                    <p className="text-center text-champagne/60 text-xs italic">
                      Aguardando confirmação do pagamento…
                    </p>
                    <div className="flex justify-center">
                      <span className="w-5 h-5 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
                    </div>
                  </div>
                ) : (
                  <form onSubmit={startPix}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="shimmer w-full py-4 rounded bg-gradient-to-r from-[#8a6f3d] via-[#c9a96e] to-[#8a6f3d] text-ink font-medium tracking-[0.18em] uppercase text-xs disabled:opacity-50 min-h-[48px]"
                    >
                      {loading ? "Gerando QR Code…" : "Gerar QR Code PIX"}
                    </button>
                    <p className="text-center text-champagne/50 text-[0.65rem] mt-3">
                      Pagamento processado por Mercado Pago
                    </p>
                  </form>
                )
              ) : (
                <form onSubmit={startCard}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="shimmer w-full py-4 rounded bg-gradient-to-r from-[#8a6f3d] via-[#c9a96e] to-[#8a6f3d] text-ink font-medium tracking-[0.18em] uppercase text-xs disabled:opacity-50 min-h-[48px]"
                  >
                    {loading ? "Redirecionando…" : "Pagar com cartão"}
                  </button>
                  <p className="text-center text-champagne/50 text-[0.65rem] mt-3">
                    Checkout seguro do Mercado Pago · Parcele em até 12x
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
