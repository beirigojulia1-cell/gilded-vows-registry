import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Toast = { id: string; message: string; type?: "success" | "error" | "info" };
type Ctx = { push: (m: string, t?: Toast["type"]) => void };
const ToastCtx = createContext<Ctx>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto px-5 py-3 rounded-md border border-gold/40 bg-card/95 backdrop-blur text-champagne text-sm shadow-2xl animate-fade-up"
            style={{ borderColor: t.type === "error" ? "rgba(220,80,80,0.5)" : undefined }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
