import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import audioAsset from "@/assets/photograph.mp3.asset.json";

const STORAGE_KEY = "wg_music_pref";

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const pref = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (pref === "paused") {
      setReady(true);
      return;
    }

    const tryPlay = async () => {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      } finally {
        setReady(true);
      }
    };
    tryPlay();

    const unlock = async () => {
      if (audio.paused && localStorage.getItem(STORAGE_KEY) !== "paused") {
        try {
          await audio.play();
          setPlaying(true);
        } catch {
          /* still blocked */
        }
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        localStorage.setItem(STORAGE_KEY, "playing");
      } catch {
        /* ignore */
      }
    } else {
      audio.pause();
      localStorage.setItem(STORAGE_KEY, "paused");
    }
  };

  return (
    <>
      <audio ref={audioRef} src={audioAsset.url} loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar música" : "Tocar música"}
        title={playing ? "Pausar música" : "Tocar música"}
        className={`fixed bottom-5 left-5 z-[150] w-11 h-11 rounded-full flex items-center justify-center border border-gold/50 bg-black/60 backdrop-blur-md text-gold hover:text-champagne hover:border-gold transition-all shadow-lg ${ready ? "opacity-100" : "opacity-0"} ${playing ? "animate-pulse-soft" : ""}`}
        style={{ animationDuration: "2.4s" }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
    </>
  );
}
