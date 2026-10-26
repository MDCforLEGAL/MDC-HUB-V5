import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "tr" | "en";

const en = {
  "meta.title": "MDC HUB — Next-Gen Roblox Script Ecosystem",
  "meta.description":
    "MDC HUB is a live, category-based Roblox script feed powered by the ScriptBlox catalog. Inspect source, status and code, then copy in one click.",

  "nav.discover": "Discover",
  "nav.code": "Code Preview",
  "nav.community": "Community",
  "nav.login": "Log in",
  "nav.signup": "Sign up",
  "nav.share": "Share Script",
  "nav.shareShort": "Share",
  "nav.freeSignup": "Create free account",
  "nav.menuOpen": "Open menu",
  "nav.menuClose": "Close menu",
  "nav.mainMenu": "Main menu",
  "nav.mobileMenu": "Mobile menu",
  "nav.switchLanguage": "Switch language",
  "nav.switchToEnglish": "Switch to English",
  "nav.switchToTurkish": "Switch to Turkish",
  "nav.languageEnglish": "English",
  "nav.languageTurkish": "Türkçe",
  "nav.language": "Language",

  "hero.badgeLive": "Library live",
  "hero.badgeLoading": "Library loading",
  "hero.badgeCurated": "Curated selection",
  "hero.subtitle":
    "A live script feed pulled from the ScriptBlox catalog and organized into categories.",
  "hero.subtitleEmphasis": " Browse, copy, use.",
  "hero.searchPlaceholder": "Search games, scripts or features…",
  "hero.searchAria": "Search scripts",
  "hero.clearSearch": "Clear search",
  "hero.search": "Search",
  "hero.foundOne": "1 script found",
  "hero.foundMany": "{count} scripts found",
  "hero.clear": "clear",
  "hero.keyboardHint": "Press Enter to search · ⌘K to focus the search bar",
  "hero.popular": "Popular",
  "hero.statScripts": "Live scripts",
  "hero.statGames": "Supported games",
  "hero.statWorking": "Working rate",
  "hero.statSync": "Last sync",
  "hero.statSource": "Data source",
  "hero.statLocal": "Local",

  "explorer.kicker": "Script Discovery",
  "explorer.titleLead": "Category-based ",
  "explorer.titleHighlight": "live script feed",
  "explorer.description":
    "Synced automatically from the ScriptBlox catalog. Review status, source and access before running any third-party code.",
  "explorer.sourceLive": "{source} · live sync",
  "explorer.sourceLoading": "Syncing library",
  "explorer.sourceCurated": "MDC curated selection",
  "explorer.category": "Category",
  "explorer.all": "All",
  "explorer.status": "Status",
  "explorer.statusAll": "All",
  "explorer.statusWorking": "Working",
  "explorer.statusPatched": "Patched",
  "explorer.gameAll": "All",
  "explorer.scriptOne": "script",
  "explorer.scriptMany": "scripts",
  "explorer.searchSuffix": " · “{query}” search",
  "explorer.liveSuffix": " · {source}",
  "explorer.curatedSuffix": " · curated selection",
  "explorer.clear": "Clear",
  "explorer.syncLive": "Last sync · {time}",
  "explorer.syncLoading": "Loading live data",
  "explorer.syncLocal": "Local selection · offline",
  "explorer.emptyTitle": "No results found",
  "explorer.emptyDescription":
    "Try another category, game, script name or feature. The library updates automatically.",
  "explorer.reset": "Reset filters",
  "explorer.loadMore": "Load more scripts",
  "explorer.allShown": "All results shown",
  "explorer.local": "Local",

  "categories.all": "All",
  "categories.trending": "Trending",
  "categories.trendingDesc": "Most engagement in the last 48 hours",
  "categories.new": "New",
  "categories.newDesc": "Latest additions to the catalog",
  "categories.popular": "Popular",
  "categories.popularDesc": "Most viewed scripts",
  "categories.keyless": "Keyless",
  "categories.keylessDesc": "Scripts that run without a key system",
  "categories.universal": "Universal",
  "categories.universalDesc": "Scripts that work across multiple games",
  "categories.verified": "Verified",
  "categories.verifiedDesc": "Scripts verified by the source",
  "categories.patched": "Patched",
  "categories.patchedDesc": "Scripts marked patched by the source",
  "categories.curated": "Curated Selection",
  "categories.curatedDesc": "Example selection prepared by MDC",

  "sources.mdc": "MDC selection",

  "card.gameScript": "Game Script",
  "card.universal": "Universal",
  "card.working": "Working",
  "card.patched": "Patched",
  "card.verifiedDeveloper": "Verified developer",
  "card.verifiedSource": "Verified by {source}",
  "card.premium": "Premium",
  "card.copy": "Copy",
  "card.copied": "Copied",
  "card.details": "Details",
  "card.copyAria": "Copy {title} code",
  "card.detailsAria": "View {title} details",

  "modal.updated": "Updated {time}",
  "modal.generatedSummary": "{author} shared this {game} script on {source}.",
  "modal.likes": "Likes",
  "modal.rating": "Rating",
  "modal.views": "Views",
  "modal.pricing": "Pricing",
  "modal.access": "Access",
  "modal.free": "Free",
  "modal.premium": "Premium",
  "modal.keyless": "Keyless",
  "modal.key": "Key",
  "modal.openSource": "Open on {source}",
  "modal.patchedExternal":
    "{source} has marked this script as patched. Check the source before running the code.",
  "modal.patchedCurated":
    "This script is currently patched. It stopped working after a game update; the developer is working on a fix.",
  "modal.thirdPartyTitle": "Third-party source.",
  "modal.thirdPartyBody":
    "This code is published on {source}. MDC HUB does not audit, execute, or relicense it. Check the source page for its license and terms.",
  "modal.license": "License",
  "modal.licenseExternal": "Source terms",
  "modal.licenseSite": "MIT (site code)",
  "modal.copy": "One-click copy",
  "modal.copied": "Copied",
  "modal.close": "Close",
  "modal.lines": "{count} lines",
  "modal.sourceBadge": "{source} source",
  "modal.mdcVerified": "MDC Verified",
  "modal.closeAria": "Close script details",
  "modal.verifiedSource": "Verified by {source}",

  "code.kicker": "Developer Experience",
  "code.titleLead": "One line. ",
  "code.titleHighlight": "Full power.",
  "code.description":
    "MDC Engine loads modules with a single loadstring call. Versions update in the background; you focus on your game.",
  "code.featureSourceTitle": "Source-aware",
  "code.featureSourceDesc": "Every script is shown with its source.",
  "code.featureCopyTitle": "Instant copy",
  "code.featureCopyDesc": "One click to the clipboard, no setup.",
  "code.featureUpdateTitle": "Automatic updates",
  "code.featureUpdateDesc": "New versions sync continuously.",
  "code.featureKeylessTitle": "Keyless access",
  "code.featureKeylessDesc": "No hidden keys, no extra steps.",
  "code.cta": "Explore all scripts",
  "code.installTime": "Average setup · 4.2s",
  "code.lua": "Lua 5.1",
  "code.copy": "Copy",
  "code.copied": "Copied",
  "code.copyAria": "Copy code",
  "code.engine": "MDC Engine",
  "code.lines": "{count} lines",
  "code.secure": "Secure",

  "footer.kicker": "Community",
  "footer.titleLead": "Publish your own ",
  "footer.titleHighlight": "script.",
  "footer.description":
    "Share your script with the community and get discovered in categories. Create a free account for the publishing flow.",
  "footer.account": "Create free account",
  "footer.inspectCode": "Inspect the code",
  "footer.sources": "{sources} sources together",
  "footer.brandDescription":
    "Live, category-based script discovery for Roblox developers. Inspect third-party code, check its source, copy in one click.",
  "footer.status": "Live on GitHub Pages",
  "footer.platform": "Platform",
  "footer.platformDiscover": "Script Discovery",
  "footer.platformCode": "Code Preview",
  "footer.platformLive": "Live Library",
  "footer.community": "Community",
  "footer.communityDiscord": "Discord Server",
  "footer.communityGuide": "Developer Guide",
  "footer.communityContribute": "Contribute",
  "footer.legal": "Legal",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms of Use",
  "footer.disclaimer": "Disclaimer",
  "footer.copyright": "© {year} MDC HUB. Site code under the MIT License.",
  "footer.roblox": "Not affiliated with Roblox Corporation.",
  "footer.license": "MIT License",
  "footer.thirdParty": "Third-party scripts remain under their own licenses.",
  "footer.sourceTagged": "Source-tagged",
  "footer.discordAria": "Discord community",
  "footer.githubAria": "GitHub repository",
  "footer.topAria": "Back to top",

  "auth.closeAria": "Close sign-in dialog",
  "auth.validatedTitle": "Form validated",
  "auth.previewText":
    "This is a preview interface for MDC HUB. Authentication will go live once a service is connected.",
  "auth.gotIt": "Got it",
  "auth.edit": "Edit",
  "auth.signupTitle": "Join the ecosystem.",
  "auth.loginTitle": "Welcome back.",
  "auth.signupSubtitle": "Create a free account and sync your favorite scripts.",
  "auth.loginSubtitle": "Access your library, favorites and saved settings.",
  "auth.loginTab": "Log in",
  "auth.signupTab": "Sign up",
  "auth.username": "Username",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.forgot": "Forgot password",
  "auth.forgotPreview": "Password reset is disabled in this preview.",
  "auth.usernameError": "Username must be at least 3 characters.",
  "auth.emailError": "Enter a valid email address.",
  "auth.passwordMinSignup": "Password must be at least 8 characters.",
  "auth.passwordMinLogin": "Password must be at least 6 characters.",
  "auth.show": "Show password",
  "auth.hide": "Hide password",
  "auth.signupSubmit": "Create Free Account",
  "auth.loginSubmit": "Log in",
  "auth.terms": "By continuing, you agree to the Terms of Use.",
  "auth.footer": "MDC HUB · Cyber-Luxury Script Ecosystem",
  "auth.passwordPlaceholderSignup": "At least 8 characters",
  "auth.passwordPlaceholderLogin": "••••••••",

  "toast.copied": "Code copied to clipboard",
  "toast.copyFailed": "Could not copy · check browser permissions",
  "toast.dismiss": "Dismiss notification",
} as const;

export type MessageKey = keyof typeof en;

const tr: Record<MessageKey, string> = {
  "meta.title": "MDC HUB — Next-Gen Roblox Script Ecosystem",
  "meta.description":
    "MDC HUB, ScriptBlox kataloğundan beslenen kategorilere ayrılmış canlı Roblox script akışı. Kaynağı, durumu ve kodu incele; tek tıkla kopyala.",

  "nav.discover": "Keşfet",
  "nav.code": "Kod Önizleme",
  "nav.community": "Topluluk",
  "nav.login": "Giriş Yap",
  "nav.signup": "Üye Ol",
  "nav.share": "Script Paylaş",
  "nav.shareShort": "Paylaş",
  "nav.freeSignup": "Ücretsiz Üye Ol",
  "nav.menuOpen": "Menüyü aç",
  "nav.menuClose": "Menüyü kapat",
  "nav.mainMenu": "Ana menü",
  "nav.mobileMenu": "Mobil menü",
  "nav.switchLanguage": "Dili değiştir",
  "nav.switchToEnglish": "İngilizceye geç",
  "nav.switchToTurkish": "Türkçeye geç",
  "nav.languageEnglish": "English",
  "nav.languageTurkish": "Türkçe",
  "nav.language": "Dil",

  "hero.badgeLive": "Kütüphane canlı",
  "hero.badgeLoading": "Kütüphane yükleniyor",
  "hero.badgeCurated": "Küratör seçkisi",
  "hero.subtitle":
    "ScriptBlox kataloğundan otomatik çekilen, kategori kategori keşfedebileceğin canlı script akışı.",
  "hero.subtitleEmphasis": " İncele, kopyala, kullan.",
  "hero.searchPlaceholder": "Oyun, script veya özellik ara…",
  "hero.searchAria": "Script ara",
  "hero.clearSearch": "Aramayı temizle",
  "hero.search": "Ara",
  "hero.foundOne": "1 script bulundu",
  "hero.foundMany": "{count} script bulundu",
  "hero.clear": "temizle",
  "hero.keyboardHint": "Enter ile ara · ⌘K ile arama çubuğuna atla",
  "hero.popular": "Popüler",
  "hero.statScripts": "Canlı script",
  "hero.statGames": "Desteklenen oyun",
  "hero.statWorking": "Çalışma oranı",
  "hero.statSync": "Son senkron",
  "hero.statSource": "Veri kaynağı",
  "hero.statLocal": "Yerel",

  "explorer.kicker": "Script Keşfi",
  "explorer.titleLead": "Kategorilere ayrılmış ",
  "explorer.titleHighlight": "canlı script akışı",
  "explorer.description":
    "ScriptBlox kataloğundan otomatik senkronize edilir. Durum, kaynak ve erişim bilgisini gör; üçüncü taraf kodları çalıştırmadan önce incele.",
  "explorer.sourceLive": "{source} · canlı senkron",
  "explorer.sourceLoading": "Kütüphane senkronize ediliyor",
  "explorer.sourceCurated": "MDC küratör seçkisi",
  "explorer.category": "Kategori",
  "explorer.all": "Tümü",
  "explorer.status": "Durum",
  "explorer.statusAll": "Tümü",
  "explorer.statusWorking": "Çalışıyor",
  "explorer.statusPatched": "Patched",
  "explorer.gameAll": "Tümü",
  "explorer.scriptOne": "script",
  "explorer.scriptMany": "script",
  "explorer.searchSuffix": " · “{query}” araması",
  "explorer.liveSuffix": " · {source}",
  "explorer.curatedSuffix": " · küratör seçkisi",
  "explorer.clear": "Temizle",
  "explorer.syncLive": "Son senkron · {time}",
  "explorer.syncLoading": "Canlı veri yükleniyor",
  "explorer.syncLocal": "Yerel seçki · çevrimdışı",
  "explorer.emptyTitle": "Sonuç bulunamadı",
  "explorer.emptyDescription":
    "Farklı bir kategori, oyun, script adı veya özellik dene. Kütüphane otomatik olarak güncelleniyor.",
  "explorer.reset": "Filtreleri sıfırla",
  "explorer.loadMore": "Daha fazla script yükle",
  "explorer.allShown": "Tüm sonuçlar gösteriliyor",
  "explorer.local": "Yerel",

  "categories.all": "Tümü",
  "categories.trending": "Trending",
  "categories.trendingDesc": "Son 48 saatte en çok etkileşim alan scriptler",
  "categories.new": "Yeni",
  "categories.newDesc": "Kataloğa en son eklenen scriptler",
  "categories.popular": "Popüler",
  "categories.popularDesc": "En çok görüntülenen scriptler",
  "categories.keyless": "Keyless",
  "categories.keylessDesc": "Key sistemi olmadan çalışan scriptler",
  "categories.universal": "Universal",
  "categories.universalDesc": "Birden fazla oyunda çalışan scriptler",
  "categories.verified": "Doğrulanmış",
  "categories.verifiedDesc": "Kaynak tarafından doğrulanmış scriptler",
  "categories.patched": "Patched",
  "categories.patchedDesc": "Kaynakta patched olarak işaretlenen scriptler",
  "categories.curated": "Küratör Seçkisi",
  "categories.curatedDesc": "MDC tarafından hazırlanan örnek seçki",

  "sources.mdc": "MDC seçkisi",

  "card.gameScript": "Oyun Scripti",
  "card.universal": "Universal",
  "card.working": "Çalışıyor",
  "card.patched": "Patched",
  "card.verifiedDeveloper": "Doğrulanmış geliştirici",
  "card.verifiedSource": "{source} tarafından doğrulanmış",
  "card.premium": "Premium",
  "card.copy": "Kopyala",
  "card.copied": "Kopyalandı",
  "card.details": "Detaylar",
  "card.copyAria": "{title} kodunu tek tıkla kopyala",
  "card.detailsAria": "{title} detaylarını gör",

  "modal.updated": "{time} güncellendi",
  "modal.generatedSummary": "{author} tarafından {source} üzerinde {game} için paylaşılan script.",
  "modal.likes": "Beğeni",
  "modal.rating": "Puan",
  "modal.views": "Görüntülenme",
  "modal.pricing": "Ücret",
  "modal.access": "Erişim",
  "modal.free": "Ücretsiz",
  "modal.premium": "Premium",
  "modal.keyless": "Keyless",
  "modal.key": "Key",
  "modal.openSource": "{source} sayfasında aç",
  "modal.patchedExternal":
    "{source} bu scripti patched olarak işaretlemiş. Kodu çalıştırmadan önce kaynağı kontrol et.",
  "modal.patchedCurated":
    "Oyun güncellemesi sonrası devre dışı kaldı; geliştirici düzeltme üzerinde çalışıyor.",
  "modal.thirdPartyTitle": "Üçüncü taraf kaynak.",
  "modal.thirdPartyBody":
    "Bu kod {source} üzerinde yayınlanmıştır. MDC HUB tarafından denetlenmez, çalıştırılmaz veya yeniden lisanslanmaz. Lisans ve kullanım koşulları için kaynak sayfasına bak.",
  "modal.license": "Lisans",
  "modal.licenseExternal": "Kaynak koşulları",
  "modal.licenseSite": "MIT (site kodu)",
  "modal.copy": "Tek Tıkla Kopyala",
  "modal.copied": "Kopyalandı",
  "modal.close": "Kapat",
  "modal.lines": "{count} satır",
  "modal.sourceBadge": "{source} kaynağı",
  "modal.mdcVerified": "MDC Verified",
  "modal.closeAria": "Detay penceresini kapat",
  "modal.verifiedSource": "{source} tarafından doğrulanmış",

  "code.kicker": "Geliştirici Deneyimi",
  "code.titleLead": "Tek satır. ",
  "code.titleHighlight": "Tüm güç.",
  "code.description":
    "MDC Engine, modülleri tek bir loadstring çağrısıyla yükler. Sürümler arka planda güncellenir; sen sadece oyununa odaklanırsın.",
  "code.featureSourceTitle": "Kaynak etiketli",
  "code.featureSourceDesc": "Her script kaynağıyla gösterilir.",
  "code.featureCopyTitle": "Anında kopyala",
  "code.featureCopyDesc": "Tek tıkla panoda, kurulum yok.",
  "code.featureUpdateTitle": "Otomatik güncelleme",
  "code.featureUpdateDesc": "Yeni sürümler canlı senkronize.",
  "code.featureKeylessTitle": "Keyless erişim",
  "code.featureKeylessDesc": "Gizli anahtar, gereksiz adım yok.",
  "code.cta": "Tüm scriptleri keşfet",
  "code.installTime": "Ortalama kurulum · 4.2 sn",
  "code.lua": "Lua 5.1",
  "code.copy": "Kopyala",
  "code.copied": "Kopyalandı",
  "code.copyAria": "Kodu kopyala",
  "code.engine": "MDC Engine",
  "code.lines": "{count} satır",
  "code.secure": "Secure",

  "footer.kicker": "Topluluk",
  "footer.titleLead": "Kendi scriptini ",
  "footer.titleHighlight": "yayınla.",
  "footer.description":
    "Scriptini toplulukla paylaş, kategorilerde keşfedil. Yayın akışı için ücretsiz hesap oluştur.",
  "footer.account": "Ücretsiz hesap oluştur",
  "footer.inspectCode": "Kodu incele",
  "footer.sources": "{sources} kaynakları bir arada",
  "footer.brandDescription":
    "Roblox geliştiricileri için kategorilere ayrılmış, canlı script keşfi. Üçüncü taraf kodları incele, kaynağını gör, tek tıkla kopyala.",
  "footer.status": "GitHub Pages üzerinde yayında",
  "footer.platform": "Platform",
  "footer.platformDiscover": "Script Keşfi",
  "footer.platformCode": "Kod Önizleme",
  "footer.platformLive": "Canlı Kütüphane",
  "footer.community": "Topluluk",
  "footer.communityDiscord": "Discord Sunucusu",
  "footer.communityGuide": "Geliştirici Rehberi",
  "footer.communityContribute": "Katkıda Bulun",
  "footer.legal": "Kurumsal",
  "footer.privacy": "Gizlilik",
  "footer.terms": "Kullanım Koşulları",
  "footer.disclaimer": "Sorumluluk Reddi",
  "footer.copyright": "© {year} MDC HUB. Site kodu MIT lisanslıdır.",
  "footer.roblox": "Roblox Corporation ile bağlantılı değildir.",
  "footer.license": "MIT Lisansı",
  "footer.thirdParty": "Üçüncü taraf scriptler kendi lisanslarına tabidir.",
  "footer.sourceTagged": "Kaynak etiketli",
  "footer.discordAria": "Discord topluluğu",
  "footer.githubAria": "GitHub deposu",
  "footer.topAria": "Sayfa başına dön",

  "auth.closeAria": "Giriş penceresini kapat",
  "auth.validatedTitle": "Form doğrulandı",
  "auth.previewText":
    "Bu, MDC HUB'ın ön izleme arayüzüdür. Kimlik doğrulama servisi bağlandığında bu akış canlıya alınacak.",
  "auth.gotIt": "Anladım",
  "auth.edit": "Düzenle",
  "auth.signupTitle": "Ekosisteme katıl.",
  "auth.loginTitle": "Tekrar hoş geldin.",
  "auth.signupSubtitle": "Ücretsiz hesap oluştur, favori scriptlerini senkronize et.",
  "auth.loginSubtitle": "Kütüphanene, favorilerine ve kayıtlı ayarlarına eriş.",
  "auth.loginTab": "Giriş Yap",
  "auth.signupTab": "Üye Ol",
  "auth.username": "Kullanıcı adı",
  "auth.email": "E-posta",
  "auth.password": "Şifre",
  "auth.forgot": "Şifremi unuttum",
  "auth.forgotPreview": "Şifre sıfırlama bu ön izlemede devre dışı.",
  "auth.usernameError": "Kullanıcı adı en az 3 karakter olmalı.",
  "auth.emailError": "Geçerli bir e-posta adresi gir.",
  "auth.passwordMinSignup": "Şifre en az 8 karakter olmalı.",
  "auth.passwordMinLogin": "Şifre en az 6 karakter olmalı.",
  "auth.show": "Şifreyi göster",
  "auth.hide": "Şifreyi gizle",
  "auth.signupSubmit": "Ücretsiz Hesap Oluştur",
  "auth.loginSubmit": "Giriş Yap",
  "auth.terms": "Devam ederek Kullanım Koşulları'nı kabul etmiş olursun.",
  "auth.footer": "MDC HUB · Cyber-Luxury Script Ecosystem",
  "auth.passwordPlaceholderSignup": "En az 8 karakter",
  "auth.passwordPlaceholderLogin": "••••••••",

  "toast.copied": "Kod panoya kopyalandı",
  "toast.copyFailed": "Kopyalanamadı · tarayıcı iznini kontrol et",
  "toast.dismiss": "Bildirimi kapat",
};

const messages: Record<Locale, Record<MessageKey, string>> = { en, tr };
const STORAGE_KEY = "mdc-locale";

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "tr" || stored === "en" ? stored : null;
  } catch {
    return null;
  }
}

export function detectLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) return stored;

  const languages =
    typeof navigator !== "undefined" && navigator.languages.length > 0
      ? navigator.languages
      : typeof navigator !== "undefined"
        ? [navigator.language]
        : [];

  return languages.some((language) => language.toLowerCase().startsWith("tr"))
    ? "tr"
    : "en";
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private browsing; detection still works.
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const template = messages[locale][key] ?? messages.en[key] ?? key;
      if (!vars) return template;

      return template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = vars[name];
        return value === undefined ? match : String(value);
      });
    },
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t("meta.title");

    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", t("meta.description"));

    const ogDescription = document.querySelector('meta[property="og:description"]');
    ogDescription?.setAttribute("content", t("meta.description"));
  }, [locale, t]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
