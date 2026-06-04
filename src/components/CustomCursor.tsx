import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);

    const over = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const interactive = el.closest("a, button, [role=button], input, textarea, select");
      if (ring.current) {
        ring.current.classList.toggle("cursor-active", !!interactive);
      }
    };

    document.documentElement.classList.add("has-custom-cursor");
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, []);

  return (
    <>
      <div
        ref={dot}
        className="hidden md:block fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 rounded-full bg-gold pointer-events-none z-[300] shadow-[0_0_10px_rgba(201,169,110,0.8)]"
        style={{ willChange: "transform" }}
      />
      <div
        ref={ring}
        className="hidden md:block fixed top-0 left-0 w-9 h-9 -ml-[18px] -mt-[18px] rounded-full border border-gold/70 pointer-events-none z-[300] transition-[transform,width,height,border-color] duration-150"
        style={{ willChange: "transform" }}
      />
    </>
  );
}
