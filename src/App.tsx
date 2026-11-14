import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import { AuthModal, type AuthMode } from "./components/AuthModal";
import { CodeShowcase } from "./components/CodeShowcase";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ScriptExplorer } from "./components/ScriptExplorer";
import { PublishScriptModal } from "./components/PublishScriptModal";
import { ScriptModal } from "./components/ScriptModal";
import { Toast } from "./components/Toast";
import type { ScriptEntry } from "./data/scripts";
import { usePresence } from "./hooks/usePresence";
import { useScriptLibrary } from "./hooks/useScriptLibrary";
import { useAccountPage, useProfileUsername, useSourcePage } from "./hooks/useSourcePage";
import { AccountPage } from "./components/AccountPage";
import { PublicProfilePage } from "./components/PublicProfilePage";
import { LayoutPrompt } from "./components/LayoutPrompt";
import { IntroSplash } from "./components/IntroSplash";
import { DiscordFloat } from "./components/DiscordFloat";
import { PerformanceGuard } from "./components/PerformanceGuard";
import { useI18n } from "./i18n";
import { applyLayoutMode, type LayoutMode } from "./lib/layout";

interface ToastState {
  id: number;
  message: string;
}

export default function App() {
  const library = useScriptLibrary();
  const presence = usePresence();
  const sourcePage = useSourcePage();
  const accountPage = useAccountPage();
  const profileUsername = useProfileUsername();
  const { user, status, error: authError } = useAuth();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [activeScript, setActiveScript] = useState<ScriptEntry | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode | null>(null);
  const [introVisible, setIntroVisible] = useState(true);

  const notify = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  const chooseLayout = useCallback((mode: LayoutMode) => {
    applyLayoutMode(mode);
    setLayoutMode(mode);
  }, []);

  const closeScript = useCallback(() => setActiveScript(null), []);
  const closeAuth = useCallback(() => setAuthMode(null), []);
  const closePublish = useCallback(() => setPublishOpen(false), []);
  const finishIntro = useCallback(() => setIntroVisible(false), []);

  const seenUser = useRef<{ ready: boolean; id: string | null }>({ ready: false, id: null });

  useEffect(() => {
    if (status === "loading") return;

    const id = user?.id ?? null;
    if (!seenUser.current.ready) {
      seenUser.current = { ready: true, id };
      return;
    }
    if (seenUser.current.id === id) return;

    if (id && user) notify(t("toast.welcome", { name: user.displayName }));
    else if (!id) notify(t("toast.signedOut"));

    seenUser.current.id = id;
  }, [status, user, notify, t]);

  useEffect(() => {
    if (authError === "callback") setAuthMode("login");
  }, [authError]);

  const scrollToResults = useCallback(() => {
    document.getElementById("kesfet")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const heroResultCount = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return library.scripts.length;

    return library.scripts.filter((script) => {
      const haystack = [
        script.game,
        script.title,
        script.author,
        script.category,
        script.sourceLabel ?? "",
        ...script.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    }).length;
  }, [library.scripts, query]);

  const workingRate = useMemo(() => {
    if (library.scripts.length === 0) return 0;
    const working = library.scripts.filter((script) => script.status === "working").length;
    return Math.round((working / library.scripts.length) * 1000) / 10;
  }, [library.scripts]);

  const popularSearches = useMemo(() => {
    const gameTerms = library.games.slice(0, 3);
    return Array.from(new Set([...gameTerms, "Auto Farm", "ESP"])).slice(0, 5);
  }, [library.games]);

  // Each section keeps its own feed: official MDC scripts never mix with
  // community uploads.
  const pageScripts = useMemo(() => {
    if (sourcePage === "all") return library.scripts;
    return library.scripts.filter((script) => script.source === sourcePage);
  }, [library.scripts, sourcePage]);

  const pageCategories = useMemo(() => {
    if (sourcePage === "all") return library.categories;
    return library.categories
      .map((category) => ({
        ...category,
        count: pageScripts.filter((script) =>
          (script.categoryIds ?? []).includes(category.id),
        ).length,
      }))
      .filter((category) => category.count > 0);
  }, [library.categories, pageScripts, sourcePage]);

  const firstPage = useRef(true);
  useEffect(() => {
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [sourcePage]);

  const overlayOpen = Boolean(activeScript || authMode || publishOpen);

  useEffect(() => {
    if (!overlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlayOpen]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [accountPage, profileUsername]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="site-shell relative min-h-screen">
      <Header onAuth={setAuthMode} onPublish={() => setPublishOpen(true)} />

      <main>
        {accountPage ? (
          <AccountPage onAuth={() => setAuthMode("login")} onNotify={notify} />
        ) : profileUsername ? (
          <PublicProfilePage username={profileUsername} onNotify={notify} />
        ) : (
          <>
        {sourcePage === "all" && (
          <>
            <Hero
              query={query}
              onQueryChange={setQuery}
              onSubmitSearch={scrollToResults}
              resultCount={heroResultCount}
              scriptCount={library.scripts.length}
              workingRate={workingRate}
              lastSync={library.generatedAt}
              libraryState={library.state}
              presence={presence.stats}
              presenceState={presence.state}
              popularSearches={popularSearches}
            />
          </>
        )}

        <ScriptExplorer
          page={sourcePage}
          scripts={pageScripts}
          categories={pageCategories}
          sources={library.sources}
          libraryState={library.state}
          lastSync={library.generatedAt}
          query={query}
          onQueryChange={setQuery}
          onOpenScript={setActiveScript}
          onNotify={notify}
          onPublish={() => setPublishOpen(true)}
        />

        {sourcePage === "all" && <CodeShowcase onNotify={notify} />}
          </>
        )}

        <Footer onOpenAuth={() => setAuthMode("signup")} />
      </main>

      {activeScript && (
        <ScriptModal script={activeScript} onClose={closeScript} onNotify={notify} />
      )}

      {authMode && (
        <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={closeAuth} />
      )}

      {publishOpen && (
        <PublishScriptModal
          onClose={closePublish}
          onNotify={notify}
          onPublished={() => {
            setPublishOpen(false);
            library.reload();
            notify(t("publish.success"));
          }}
        />
      )}

      {toast && <Toast key={toast.id} message={toast.message} onClose={() => setToast(null)} />}

      <DiscordFloat />
      <PerformanceGuard onNotify={notify} />

      {layoutMode === null && <LayoutPrompt onChoose={chooseLayout} />}

      {introVisible && <IntroSplash onDone={finishIntro} />}
    </div>
  );
}
