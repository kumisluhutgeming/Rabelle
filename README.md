# Rabelle — Geographic Intelligence Platform

Rabelle adalah dashboard intelijen geografis untuk memetakan dan menganalisis infrastruktur telekomunikasi (BTS, TV, Radio) di wilayah Jawa dan Bali. Aplikasi ini dibangun untuk **Direktorat Jenderal Sumber Daya dan Perangkat Pos dan Informatika (SDPPI) Kementerian Kominfo** atau instansi sejenis yang membutuhkan visualisasi sebaran menara pemancar. Pengguna akhir adalah staf regulator/surveyor yang perlu melihat posisi tower di peta, memfilter berdasarkan operator/wilayah/jenis, mengimpor data baru dari CSV/GeoJSON, dan mensimulasikan radius jangkauan sinyal.

Aplikasi ini berjalan sebagai **full-stack Next.js web app** (App Router) dengan MySQL sebagai database, MapLibre GL + Deck.GL untuk rendering peta WebGL, dan NextAuth untuk autentikasi.

---

## Arsitektur Ringkas

```
Browser
  │
  ├─ Landing Page (/)            ← Publik, statistik tower
  ├─ /login, /register           ← Autentikasi (NextAuth + Credentials)
  │
  └─ /dashboard/*                ← Dilindungi middleware (JWT check)
       ├─ Overview (charts, stats)
       ├─ /maps                  ← Peta WebGL (MapLibre + Deck.GL)
       │    ├─ FloatingFilter     ← Filter cascading (jenis → operator, provinsi → kota)
       │    ├─ MapComponentWebGL  ← Rendering marker + coverage layer
       │    │    └─ useSignalCoverage hook  ← Okumura-Hata polygon generation
       │    └─ MapControls       ← Theme switcher, coverage toggle
       ├─ /data-tabel            ← CRUD tabel data pengukuran
       ├─ /edit-data             ← Import GeoJSON + GPS manual entry
       ├─ /add-tower/csv         ← Bulk import dari CSV (PapaParse)
       ├─ /audit                 ← Audit log viewer (immutable)
       └─ /settings              ← Preferensi peta (tema, format koordinat, satuan sinyal)

API Routes:
  /api/markers    ← GET: query marker dengan viewport bounds + filter
  /api/auth/*     ← NextAuth internal routes
  /api/kota       ← Lookup kota
  /api/operators  ← Lookup operator

Server Actions:
  src/app/actions/import.ts   ← importTowers (CSV bulk)
  src/app/actions/auth.ts     ← registerUser
  src/app/dashboard/edit-data/actions.ts  ← uploadGeojson, saveGpsTower
  src/app/dashboard/data-tabel/actions.ts ← deletePengukuran, exportCsv

Data Flow:
  MySQL ──Prisma ORM──► Server Components/Actions ──JSON──► Client Components
                                                              │
                                                              ▼
                                                    MapLibre GL (basemap tiles)
                                                    Deck.GL (coverage polygons)
```

---

## Tech Stack

| Teknologi | Versi | Peran |
|-----------|-------|-------|
| **Next.js** | 16.2.4 | Framework fullstack. App Router, Server Components, Server Actions, Middleware. |
| **React** | 19.2.4 | UI rendering. |
| **TypeScript** | ^5 | Type safety di seluruh codebase. |
| **MySQL** | — | Database utama. Skema sudah ada (`prisma/schema.prisma`), tidak ada migrasi file. |
| **Prisma** | 6.4.1 | ORM. Singleton client di `src/lib/prisma.ts` dengan BigInt JSON monkey-patch. |
| **NextAuth** | 4.x | Autentikasi. Credentials provider (username/email + bcrypt password). JWT sessions, 30 hari. |
| **MapLibre GL** | ^5.24 | Rendering peta vektor (basemap tiles dari CARTO). |
| **Deck.GL** | ^9.3 | WebGL overlay untuk coverage polygons (GeoJsonLayer) dan marker rendering. Hanya sub-packages: `@deck.gl/layers`, `@deck.gl/mapbox`, `@deck.gl/geo-layers`, `@deck.gl/react`. |
| **Turf.js** | ^7.3 | Geospatial utilities — hanya `@turf/helpers` (polygon builder), `@turf/bbox`, `@turf/voronoi` (Voronoi tessellation). |
| **Framer Motion** | ^12 | Animasi UI — sidebar, filter panel, transitions. |
| **Chart.js + react-chartjs-2** | ^4.5 / ^5.3 | Grafik statistik di dashboard overview. |
| **PapaParse** | ^5.5 | CSV parsing di browser untuk fitur import tower. |
| **Zod** | ^4.4 | Validasi input pada Server Actions (`createSafeAction` wrapper). |
| **React Hook Form** | ^7.75 | Form management di login, register, edit tower. |
| **Tailwind CSS** | v4 | Utility-first CSS. Konfigurasi via `@tailwindcss/postcss`. |
| **Playwright** | ^1.60 | E2E testing (Chromium). 6 spec files di `tests/e2e/`. |

---

## Cara Setup & Menjalankan

### Prerequisites

- **Node.js** ≥ 18.x (direkomendasikan 20.x+)
- **MySQL** 8.x yang sudah berjalan
- **npm** (bawaan Node.js)

### 1. Clone & Install

```bash
git clone https://github.com/kumisluhutgeming/Rabelle.git
cd Rabelle
npm install
```

### 2. Konfigurasi Environment

Salin `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi nilainya:

```env
# Koneksi MySQL — sesuaikan username, password, host, dan nama database
DATABASE_URL="mysql://root:password@127.0.0.1:3306/rabelle"

# Secret untuk JWT session NextAuth — generate string random panjang
NEXTAUTH_SECRET="ganti-dengan-string-random-panjang-minimal-32-karakter"

# URL aplikasi (untuk development)
NEXTAUTH_URL="http://localhost:3000"
```

> **Penting:** Database `rabelle` harus sudah dibuat sebelumnya di MySQL. Prisma akan membuat tabelnya.

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database (membuat semua tabel)
npx prisma db push
```

> **Catatan:** Proyek ini tidak menggunakan Prisma Migrate. Skema di-push langsung. Jika database sudah ada dari versi Laravel sebelumnya, Prisma akan introspect secara otomatis.

### 4. (Opsional) Buat Akun Admin

```bash
# Edit kredensial di dalam file terlebih dahulu, lalu:
node scripts/add-admin.js
```

Atau daftar lewat `/register` — semua user baru otomatis berstatus `viewers`. Ubah `is_admin` ke `true` secara manual di database jika perlu.

### 5. Jalankan Development Server

```bash
npm run dev
```

Atau di Windows, double-click `start_rabelle.bat`.

### 6. Verifikasi

1. Buka `http://localhost:3000` — Landing page harus muncul dengan statistik tower.
2. Klik "Masuk ke Dashboard" → Login dengan akun yang dibuat.
3. Navigasi ke "Peta" → Marker tower harus muncul di peta Jawa-Bali.
4. Jika database masih kosong, impor data via "Import CSV" atau "Edit Data > GeoJSON".

---

## Struktur Folder

```
d:\Rabelle-Standalone\
├── prisma/
│   └── schema.prisma          # Definisi semua tabel: locations, lokasi_pemancar,
│                               # pengukuran, stasiun_radio, users, audit_logs
├── public/
│   ├── logo.png               # Logo untuk light mode
│   ├── tacet-white.png        # Logo untuk dark mode
│   └── logos/                 # Logo operator telekomunikasi
│
├── scripts/
│   ├── add-admin.js           # Script CLI untuk membuat akun admin
│   ├── export-csv.js          # Script CLI untuk export data ke CSV
│   └── seed_rf_data.js        # Script untuk seed data RF (frekuensi, tinggi, azimuth)
│                               # ke tabel lokasi_pemancar
│
├── src/
│   ├── middleware.ts           # NextAuth middleware: proteksi /dashboard/*,
│   │                           # rate limiting in-memory untuk /login, /api/markers
│   │
│   ├── app/
│   │   ├── layout.tsx          # Root layout: font (Plus Jakarta Sans), ThemeProvider, AuthProvider
│   │   ├── page.tsx            # Landing page server component (fetch stats)
│   │   ├── LandingPageClient.tsx  # Landing page UI (animasi, hero, fitur)
│   │   ├── globals.css         # CSS variables untuk theming (light/dark)
│   │   │
│   │   ├── login/page.tsx      # Halaman login (react-hook-form + zod)
│   │   ├── register/page.tsx   # Halaman registrasi
│   │   ├── forgot-password/    # Halaman lupa password (UI only, belum ada backend)
│   │   │
│   │   ├── actions/
│   │   │   ├── auth.ts         # Server Action: registerUser
│   │   │   └── import.ts       # Server Action: importTowers (CSV bulk import)
│   │   │
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth route handler (auto-generated)
│   │   │   ├── markers/route.ts # GET endpoint utama peta: query tower + stats
│   │   │   ├── kota/           # Lookup kota
│   │   │   └── operators/      # Lookup operator
│   │   │
│   │   └── dashboard/
│   │       ├── layout.tsx      # Dashboard shell: Sidebar + Header + Providers
│   │       ├── page.tsx        # Overview: statistik, chart, top operators
│   │       ├── Sidebar.tsx     # Navigasi utama (collapsible)
│   │       ├── DashboardHeader.tsx
│   │       ├── CommandPalette.tsx  # ⌘K command palette (navigasi cepat)
│   │       ├── IdleProvider.tsx    # Auto-hide UI setelah idle 5 detik
│   │       ├── PreferencesProvider.tsx # Konteks preferensi: tema peta, format koordinat, unit sinyal
│   │       │
│   │       ├── maps/
│   │       │   ├── page.tsx           # Server component: fetch filter metadata
│   │       │   ├── MapWrapper.tsx     # Dynamic import (SSR disabled) untuk MapComponentWebGL
│   │       │   ├── MapComponentWebGL.tsx  # ★ KOMPONEN UTAMA PETA — 500+ baris
│   │       │   │                          # Rendering marker, coverage, popup, Voronoi,
│   │       │   │                          # cluster (province/kota/point modes), geolocation
│   │       │   ├── FloatingFilter.tsx # Panel filter cascading dengan SearchableSelect
│   │       │   ├── hooks/
│   │       │   │   └── useSignalCoverage.ts  # ★ CORE LOGIC: Okumura-Hata → hexagon polygon
│   │       │   └── components/
│   │       │       ├── MapControls.tsx          # Tombol coverage, theme switcher, zoom indicator
│   │       │       ├── CheckSignalPanel.tsx     # Panel cek sinyal (geolokasi user)
│   │       │       ├── CoverageProgressOverlay.tsx # Progress bar saat menghitung coverage
│   │       │       └── MapStatsOverlay.tsx      # Overlay statistik marker
│   │       │
│   │       ├── data-tabel/
│   │       │   ├── page.tsx           # Tabel data pengukuran (server-side pagination)
│   │       │   ├── actions.ts         # Server Actions: delete, export CSV
│   │       │   ├── TableFilter.tsx    # Filter tabel (jenis, operator, wilayah)
│   │       │   ├── Pagination.tsx     # Komponen paginasi
│   │       │   ├── ExportButton.tsx   # Tombol export ke CSV
│   │       │   └── [id]/edit/        # Edit satu entri pengukuran
│   │       │
│   │       ├── edit-data/
│   │       │   ├── page.tsx           # Form import GeoJSON + GPS manual
│   │       │   └── actions.ts         # Server Actions: uploadGeojson, saveGpsTower
│   │       │
│   │       ├── add-tower/
│   │       │   ├── csv/page.tsx       # Import bulk CSV (PapaParse preview + confirm)
│   │       │   └── manual/           # Form tambah tower manual
│   │       │
│   │       ├── audit/page.tsx         # Log audit (immutable, readonly)
│   │       └── settings/page.tsx      # Pengaturan preferensi peta
│   │
│   ├── components/
│   │   ├── AuthProvider.tsx    # SessionProvider wrapper untuk NextAuth
│   │   ├── ThemeProvider.tsx   # Dark/light mode (localStorage + CSS variables)
│   │   └── ThemeToggle.tsx     # Toggle button tema
│   │
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config: CredentialsProvider, JWT callbacks
│   │   ├── prisma.ts           # Prisma singleton + BigInt serialization + audit immutability
│   │   ├── constants.ts        # PROVINSI_LIST, EXCLUDED_JENIS, TOWER_REVALIDATE_PATHS
│   │   ├── tower.ts            # upsertLocation, revalidateTowerPaths
│   │   ├── audit.ts            # createAuditLog helper
│   │   ├── rf-propagation.ts   # ★ CORE MATH: Haversine distance, Okumura-Hata path loss,
│   │   │                       #   bearing, getDestination, antenna attenuation,
│   │   │                       #   operator frequency mapping, tower parameter generation
│   │   └── middleware/
│   │       └── action-wrapper.ts  # createSafeAction: auth + zod validation + audit logging
│   │
│   └── types/
│       └── next-auth.d.ts      # Type augmentation: Session.user.{username, isAdmin}
│
├── tests/e2e/                  # Playwright E2E tests
│   ├── auth.spec.ts            # Login, register, protected route tests
│   ├── admin-journey.spec.ts   # Admin workflow tests
│   ├── user-journey.spec.ts    # Viewer workflow tests
│   ├── map.spec.ts             # Map loading test
│   ├── add-tower.spec.ts       # CSV import tests
│   └── middleware.spec.ts      # Middleware rate limiting + auth protection tests
│
├── .env.example                # Template environment variables
├── .env.test                   # Environment untuk Playwright tests
├── playwright.config.ts        # Playwright config: Chromium, baseURL localhost:3000
├── start_rabelle.bat           # Windows shortcut untuk npm run dev
└── tower_data_export.csv       # Contoh data export (159KB, ~2000+ rows)
```

---

## Fitur yang Sudah Berjalan

### Autentikasi & Otorisasi
- Login via username atau email + password (bcrypt, kompatibel hash Laravel)
- Registrasi user baru (otomatis role `viewers`)
- JWT session berlaku 30 hari
- Middleware proteksi `/dashboard/*` — redirect ke `/login` jika belum login
- Rate limiting in-memory (50 req/menit) untuk `/login`, `/register`, `/api/markers`
- Dua role: `admin` (CRUD penuh) dan `viewers` (read-only)

### Peta Interaktif
- Rendering ribuan marker tower via MapLibre GL + source GeoJSON (bukan DOM markers)
- 3 level zoom: **Province cluster** → **Kota cluster** → **Individual markers**
- Filter cascading: Jenis Komunikasi → Operator, Provinsi → Kota
- 4 tema peta: Colorful (CARTO Voyager GL), Voyager (Positron), Dark, Satellite (Esri)
- Popup detail tower saat klik marker
- Simulasi cek sinyal: geolokasi user → cari tower terdekat → hitung dBm via Okumura-Hata

### Visualisasi Coverage Sinyal
- Toggle on/off visualisasi radius cakupan sinyal
- 3 lapis heksagon per tower: Hijau (-70 dBm), Kuning (-90 dBm), Merah (-110 dBm)
- Radius dihitung berdasarkan model **Okumura-Hata** yang mempertimbangkan: frekuensi (MHz), tinggi menara (m), daya pancar (dBm)
- Orientasi heksagon mengikuti azimuth pertama dari data tower
- Mode single tower (klik 1 tower) dan mode all towers
- Diagram Voronoi untuk wilayah cakupan telco (dashed lines)
- Progress bar saat menghitung coverage untuk banyak tower

### Manajemen Data
- Import bulk dari CSV (preview data sebelum konfirmasi)
- Import dari GeoJSON (OSM format, auto-detect operator dari properties)
- Tambah tower manual via form GPS (lat/lng + metadata)
- Edit data pengukuran individual
- Hapus data pengukuran (admin only)
- Export data ke CSV
- Tabel data server-side paginated dengan filter

### Dashboard & Analytics
- Statistik overview: total tower, BTS, TV, Radio
- Chart distribusi per operator (bar chart)
- Chart distribusi per wilayah
- Top 5 operators
- Command Palette (⌘K) untuk navigasi cepat

### Audit & Keamanan
- Audit log otomatis untuk setiap mutasi data (immutable — tidak bisa diubah/dihapus)
- Server Actions dibungkus `createSafeAction` wrapper: validasi Zod + auth check + auto audit log
- Halaman viewer audit log di `/dashboard/audit`

### UX
- Dark/Light mode dengan transisi smooth
- Auto-hide UI setelah idle 5 detik (di halaman peta)
- Sidebar collapsible
- Preferensi tersimpan di localStorage: tema peta, format koordinat (Decimal/DMS), unit sinyal (dBm/%)

---

## Yang Belum Selesai / Perlu Dilanjutkan

### Fitur yang Ada UI-nya Tapi Belum Ada Backend

1. **Forgot Password** (`src/app/forgot-password/page.tsx`)
   Halaman UI-nya sudah ada dan terlihat polished, tapi tidak ada Server Action maupun email service yang menghandle reset password. Perlu integrasi dengan layanan email (Resend, SendGrid, dll) dan mekanisme token reset.

2. **Social Login (Google, GitHub, Apple)**
   Tombol OAuth di halaman login dan register sudah ada di UI, tapi **tidak ada `onClick` handler dan tidak ada NextAuth provider yang dikonfigurasi** di `src/lib/auth.ts`. Saat ini hanya Credentials provider yang aktif. Jika ingin mengaktifkan, tambahkan provider di `authOptions.providers[]`.

### Hal yang Masih Hardcoded / Placeholder

3. **Data RF di `rf-propagation.ts` sebagian besar di-generate dari hash ID**
   Untuk tower yang tidak memiliki data frekuensi/tinggi/azimuth di database (kolom `frekuensi`, `tinggi_menara_m`, `azimuths` di tabel `lokasi_pemancar`), sistem men-generate nilai pseudo-random berdasarkan hash dari ID tower (`pseudoRandomSeed`). Ini menciptakan parameter yang deterministik tapi tidak mencerminkan realita. Fungsi `getFrequencyForOperator` di baris 72-92 memetakan nama operator ke rentang frekuensi yang masuk akal (Telkomsel → 900/1800/2100/2300 MHz, dll), tapi tetap memilih secara pseudo-random.

   Script `scripts/seed_rf_data.js` sudah ada untuk mengisi kolom-kolom ini di database, tapi perlu dijalankan manual dan hanya men-generate data dummy juga. **Idealnya data ini diisi dari sumber resmi (misal data spektrum SDPPI).**

4. **Daftar provinsi di `constants.ts` tidak sinkron dengan database**
   `PROVINSI_LIST` berisi "DI Jogja" tapi di database setelah normalisasi menjadi "DI Yogyakarta". Konstanta ini digunakan di beberapa tempat sebagai referensi. **Perlu disinkronkan.**

5. **`PROVINCE_CENTERS` dan `CITY_CENTERS` di `MapComponentWebGL.tsx`**
   Koordinat pusat provinsi dan kota di-hardcode (baris 33-56). Jika ada kota/provinsi baru yang diimpor tapi tidak ada di lookup ini, sistem fallback ke rata-rata koordinat dari data `locations` — ini sudah cukup baik. Tapi lookup table-nya mungkin perlu diperluas.

### Bug yang Diketahui

6. **Voronoi diagram dihitung tapi penggunaannya terbatas**
   `voronoiData` di `MapComponentWebGL.tsx` (baris 222-262) dihitung setiap kali coverage diaktifkan — ini memakan CPU untuk kalkulasi yang hanya menampilkan garis putus-putus tipis. Bisa dipertimbangkan untuk lazy compute atau dibuatkan toggle terpisah.

### Infrastruktur yang Belum Disiapkan

7. **Tidak ada Prisma migrations**
   Schema langsung di-push (`prisma db push`). Untuk produksi, sebaiknya mulai menggunakan `prisma migrate` agar perubahan skema bisa dilacak dan di-rollback.

8. **Tidak ada CI/CD pipeline**
   Belum ada GitHub Actions, Vercel config, atau Dockerfile. Playwright tests harus dijalankan manual.

9. **Tidak ada seed script terintegrasi**
    Tidak ada `prisma/seed.ts`. Data harus diimpor manual via CSV/GeoJSON atau script di `scripts/`.

10. **`next-themes` diinstal tapi tidak digunakan**
    Package `next-themes` ada di `package.json` tapi theming dihandle custom via `ThemeProvider.tsx` menggunakan CSS variables + localStorage. Package ini bisa di-uninstall.

---

## Keputusan Teknis Penting

### Mengapa MapLibre GL + Deck.GL, bukan Leaflet?
Proyek ini awalnya menggunakan Leaflet (terlihat dari riwayat cleanup). Migrasi ke MapLibre GL + Deck.GL dilakukan karena performa rendering ribuan marker dan polygon coverage jauh lebih baik di WebGL. Leaflet rendering DOM-based tidak mampu menangani volume data ini tanpa lag.

### Mengapa Okumura-Hata dan bukan model propagasi lain?
Okumura-Hata adalah model empiris standar industri untuk prediksi path loss di lingkungan urban/suburban pada rentang frekuensi 150-1500 MHz (dengan ekstensi hingga 2300 MHz). Model ini dipilih karena:
- Cukup akurat untuk visualisasi cakupan kasar tanpa data terrain detail
- Parameternya sederhana: frekuensi, tinggi tower, jarak
- Secara otomatis menghasilkan radius yang lebih besar untuk frekuensi rendah (Radio/TV) dan lebih kecil untuk frekuensi tinggi (seluler) — sesuai fisika propagasi

### Mengapa Server Actions dibungkus `createSafeAction`?
Ini pattern yang menggabungkan authentication check, Zod validation, dan audit logging dalam satu wrapper. Alasannya: menghindari duplikasi boilerplate di setiap Server Action. Setiap action cukup deklarasikan role yang dibutuhkan (`admin`/`user`/`public`), schema Zod-nya, dan handler logic. Lihat `src/lib/middleware/action-wrapper.ts`.

### Mengapa coverage polygon pakai hexagon dan bukan circle?
Permintaan klien. Hexagon dipilih karena secara visual lebih tegas menunjukkan area cakupan, dan orientasi sudut atasnya bisa di-rotate mengikuti azimuth pertama antena tower — memberikan indikasi arah pancaran utama.

### Mengapa BigInt di-monkey-patch?
Prisma menggunakan `BigInt` untuk kolom `UNSIGNED BIGINT` di MySQL. JavaScript `JSON.stringify` tidak bisa serialize BigInt secara native. Monkey-patch `BigInt.prototype.toJSON` di `src/lib/prisma.ts` adalah solusi pragmatis yang dipakai secara luas di ekosistem Prisma + Next.js.

### Mengapa audit_logs dibuat immutable di level ORM?
Prisma client di-extend untuk menolak `update`, `updateMany`, `delete`, `deleteMany` pada model `audit_logs`. Ini menjamin integritas log audit bahkan jika ada bug di kode aplikasi yang secara tidak sengaja mencoba memodifikasi log.

### Asal-usul skema database: Laravel
Skema database ini **bukan** dibuat dari nol untuk Next.js. Nama tabel dan kolom (snake_case, `created_at`/`updated_at`, `remember_token`) menunjukkan ini adalah migrasi dari proyek Laravel sebelumnya. Kolom `remember_token` di tabel `users` adalah artefak Laravel yang tidak digunakan di Next.js. Password hash di database kompatibel antara Laravel (`bcrypt`) dan `bcryptjs` yang dipakai di sini — ini sudah diverifikasi dan dicatat di komentar `src/lib/auth.ts` baris 30.

---

## Cara Berkontribusi / Development Workflow

### Branch Naming

Proyek ini menggunakan branch `update-dashboard-maps` sebagai branch kerja utama saat ini. Konvensi yang direkomendasikan:

```
feature/nama-fitur      — Fitur baru
fix/deskripsi-bug        — Perbaikan bug
refactor/area-kode       — Refactoring tanpa perubahan fitur
chore/deskripsi          — Cleanup, dependency update, dll
```

### Commit Messages

Mengikuti format [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(maps): implement azimuth-aware coverage polygons
fix(maps): resolve popup closing issue on marker click
refactor(middleware): replace rate limiter with edge-compatible version
chore(deps): remove unused npm packages
```

### Menambah Fitur Baru

1. **Jika fitur melibatkan data baru:** Tambahkan model/kolom di `prisma/schema.prisma`, lalu `npx prisma db push` dan `npx prisma generate`.
2. **Jika fitur adalah halaman baru di dashboard:** Buat folder di `src/app/dashboard/nama-fitur/` dengan `page.tsx`. Tambahkan link di `Sidebar.tsx`.
3. **Jika fitur melibatkan mutasi data:** Buat Server Action dan bungkus dengan `createSafeAction` dari `src/lib/middleware/action-wrapper.ts`. Ini otomatis menangani auth check, validasi, dan audit logging.
4. **Jika fitur melibatkan komponen peta baru:** Semua logika peta ada di `MapComponentWebGL.tsx`. Untuk layer Deck.GL baru, tambahkan di `useMemo` block `deckLayers`.

### Menjalankan Tests

```bash
# Install browser Playwright (pertama kali saja)
npx playwright install chromium

# Jalankan semua E2E tests (akan otomatis start dev server)
npx playwright test

# Jalankan test spesifik
npx playwright test tests/e2e/auth.spec.ts

# Lihat report
npx playwright show-report
```

> **Catatan:** Tests membutuhkan `.env.test` yang sudah ada di repo. Pastikan database test tersedia dan terjangkau.

### Tips Development

- **Hot reload peta lambat?** MapLibre GL dan Deck.GL di-lazy-load via `MapWrapper.tsx`. Perubahan di `MapComponentWebGL.tsx` memerlukan full remount. Pertimbangkan untuk memecah komponen jika file ini terus membengkak (saat ini 500+ baris).
- **BigInt error di console?** Pastikan `src/lib/prisma.ts` sudah ter-import sebelum operasi Prisma apapun. Monkey-patch BigInt harus jalan sebelum `JSON.stringify`.
- **Filter peta tidak update?** Filter menggunakan URL search params. Periksa bahwa `useSearchParams()` terbaca dengan benar dan `fetchMarkers` di-trigger ulang.
- **Coverage tidak muncul?** Coverage hanya render di zoom level ≥ 11. Periksa `zoomOpacity` calculation di `deckLayers` useMemo.

---

## Referensi Cepat: File yang Paling Sering Disentuh

| Skenario | File Utama |
|----------|-----------|
| Menambah/mengubah field database | `prisma/schema.prisma` |
| Mengubah tampilan/logika peta | `src/app/dashboard/maps/MapComponentWebGL.tsx` |
| Mengubah kalkulasi coverage/propagasi | `src/lib/rf-propagation.ts`, `src/app/dashboard/maps/hooks/useSignalCoverage.ts` |
| Menambah Server Action baru | Buat file di `src/app/.../actions.ts`, gunakan `createSafeAction` dari `src/lib/middleware/action-wrapper.ts` |
| Mengubah filter peta | `src/app/dashboard/maps/FloatingFilter.tsx` |
| Mengubah filter tabel | `src/app/dashboard/data-tabel/TableFilter.tsx` |
| Mengubah navigasi sidebar | `src/app/dashboard/Sidebar.tsx` |
| Menambah API endpoint | `src/app/api/nama-endpoint/route.ts` |
| Mengubah autentikasi | `src/lib/auth.ts` |
| Mengubah proteksi route | `src/middleware.ts` |
| Menambah tipe data custom | `src/types/next-auth.d.ts` |
