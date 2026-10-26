# MDC HUB V5

Roblox script hub arayüzü. React 19, TypeScript, Vite ve Tailwind CSS 4 ile geliştirildi.

## Canlı script kütüphanesi

`scripts/sync-scripts.mjs`, ScriptBlox API'sinden kategorilere ayrılmış scriptleri
sunucu tarafında çeker ve `public/data/scripts.json` dosyasına yazar. Site bu dosyayı
statik olarak yükler; tarayıcıda CORS veya API anahtarı gerekmez.

- **Kaynak:** ScriptBlox (`/api/script/fetch`, `/api/script/trending`, `/api/script/:slug`)
- **Kategoriler:** Trending, Yeni, Popüler, Keyless, Universal, Doğrulanmış, Patched
- **Yenileme:** GitHub Actions her 6 saatte bir çalışır; ayrıca manuel tetiklenebilir.
- **Yedek:** Senkron başarısız olursa son JSON kullanılır; o da yoksa yerel küratör
  seçkisi gösterilir.

### Rscripts (opsiyonel)

Rscripts API'si anahtar istediği için varsayılan olarak kapalıdır. İstersen
`RSCRIPTS_API_KEY` adında bir GitHub Actions secret'ı ekle; sync betiği Rscripts
sonuçlarını da aynı kategorilere ekler. Anahtar tarayıcıya gönderilmez.

## Yerel geliştirme

```bash
npm ci
npm run dev
```

Vite `dev.html` girişini kullanır; `http://localhost:3000/` otomatik olarak
`/dev.html` adresine yönlendirilir.

```bash
npm run sync:scripts   # ScriptBlox verisini public/data/scripts.json'a çeker
npm run build          # typecheck + dist/ üretir
npm run build:pages    # /MDC-HUB-V5/ base'i ile build alır, kök dosyalara yayınlar
```

## GitHub Pages

`index.html`, `assets/`, `favicon.svg`, `.nojekyll` ve `data/` dosyaları
`npm run build:pages` tarafından üretilir. **Kök `index.html` ve `assets/` dosyalarını
elle düzenleme;** kaynak `dev.html` ve `src/` altındadır.

`.github/workflows/deploy-pages.yml` her `main` push'unda ve 6 saatlik zamanlamada:

1. ScriptBlox verisini yeniler (hata olursa mevcut veriyle devam eder),
2. build alıp kökteki yayın dosyalarını commit eder,
3. GitHub Pages artifact'ını yükler ve deploy eder.

Böylece GitHub Pages ister **Deploy from a branch (main / root)** ister
**GitHub Actions** kaynağında olsun site çalışır. İlk çalıştırmada oluşan generated
commit `[skip ci]` içerir; döngü oluşturmaz.

Not: Üçüncü taraf scriptler MDC HUB tarafından çalıştırılmaz veya güvenlik açısından
onaylanmaz. Arayüz kaynağı ve kodu gösterir; kodu çalıştırmadan önce incele.
