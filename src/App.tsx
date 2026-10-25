import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthModal, type AuthMode } from "./components/AuthModal";
import { CodeShowcase } from "./components/CodeShowcase";
import { Footer } from "./components/Footer";
import { GameMarquee } from "./components/GameMarquee";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ScriptExplorer } from "./components/ScriptExplorer";
import { ScriptModal } from "./components/ScriptModal";
import { Toast } from "./components/Toast";
import { scripts, type ScriptEntry } from "./data/scripts";

interface ToastState {
  id: number;
  message: string;
}

function Atmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#04060a]" />
      <div className="animate-float-slow absolute -left-40 top-[-16%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.15),transparent_66%)] blur-3xl" />
      <div className="animate-float-slow absolute right-[-14%] top-[20%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(0,102,255,0.13),transparent_68%)] blur-3xl [animation-delay:-7s]" />
      <div className="absolute bottom-[-18%] left-1/4 h-[460px] w-[680px] rounded-full bg-[radial-gradient(circle,rgba(139,0,0,0.12),transparent_72%)] blur-3xl" />
      <div className="bg-grid absolute inset-0 opacity-70" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [activeScript, setActiveScript] = useState<ScriptEntry | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  const closeScript = useCallback(() => setActiveScript(null), []);
  const closeAuth = useCallback(() => setAuthMode(null), []);

  const scrollToResults = useCallback(() => {
    document.getElementById("kesfet")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const heroResultCount = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return scripts.length;

    return scripts.filter((script) => {
      const haystack = [
        script.game,
        script.title,
        script.author,
        script.category,
        ...script.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    }).length;
  }, [query]);

  const overlayOpen = Boolean(activeScript || authMode);

  useEffect(() => {
    if (!overlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="relative min-h-screen">
      <Atmosphere />

      <Header onAuth={setAuthMode} />

      <main>
        <Hero
          query={query}
          onQueryChange={setQuery}
          onSubmitSearch={scrollToResults}
          resultCount={heroResultCount}
        />

        <GameMarquee />

        <ScriptExplorer
          query={query}
          onQueryChange={setQuery}
          onOpenScript={setActiveScript}
          onNotify={notify}
        />

        <CodeShowcase onNotify={notify} />

        <Footer onOpenAuth={() => setAuthMode("signup")} />
      </main>

      {activeScript && (
        <ScriptModal script={activeScript} onClose={closeScript} onNotify={notify} />
      )}

      {authMode && (
        <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={closeAuth} />
      )}

      {toast && <Toast key={toast.id} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
