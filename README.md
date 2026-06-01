# Rabelle — Geographic Intelligence Platform

Rabelle adalah platform web untuk memetakan dan menganalisis infrastruktur telekomunikasi (BTS Seluler, Menara TV, dan Radio) di wilayah Jawa & Bali. Aplikasi ini mengambil data menara dari database MySQL, menampilkannya di peta interaktif berbasis WebGL (MapLibre + deck.gl), dan menyediakan dashboard analitik berupa grafik distribusi operator dan wilayah. Target penggunanya adalah analis telekomunikasi dan tim internal yang perlu memahami sebaran infrastruktur pemancar secara visual. Ini adalah aplikasi Next.js full-stack — satu codebase menangani UI, API, dan akses database.

---

## Arsitektur Ringkas

```
Browser
  │
  ├─ Landing Page (/) ──── Server Component, fetch stats dari DB
  │
  ├─ /login, /register ── Client Components (NextAuth credentials)
  │
  └─ /dashboard ────────── Protected area (session-gated)
       │
       ├─ Dashboard Home ── Server Component, fetch aggregasi data
       ├─ Peta Interaktif ─ Client Component (MapLibre + deck.gl)
       │    └─ fetch /api/markers (viewport-based, rate-limited)
       ├─ Tabel Data ────── Server Component, paginated query
       ├─ Tambah Data ───── Admin-only: CSV import atau manual form
       ├─ Edit Data ──────── Admin-only: GeoJSON upload, GPS form
       ├─ Audit Log ──────── Admin-only: immutable log viewer
       └─ Settings ──────── Client Component (preferences + profile)
```

**Data flow utama:**
1. Data masuk ke MySQL via import CSV (`importTowers`), manual form (`saveGpsTower`), atau GeoJSON upload (`uploadGeojson`).
2. Setiap entri melibatkan 4 tabel: `locations` → `stasiun_radio` → `lokasi_pemancar` → `pengukuran` (junction table).
3. API `/api/markers` melayani peta — mengembalikan marker viewport + statistik global per provinsi/kota.
4. Peta client menghitung simulasi sinyal (Okumura-Hata model) secara real-time di browser via `rf-propagation.ts`.

---

## Tech Stack

| Teknologi | Versi | Peran dalam Proyek |
|---|---|---|
| **Next.js** | 16.2.4 | Framework utama — App Router, Server Components, Server Actions, API Routes |
| **React** | 19.2.4 | UI rendering |
| **TypeScript** | ^5 | Type safety seluruh codebase |
| **Prisma** | 6.4.1 | ORM untuk MySQL — schema definition, query builder, migrations |
| **MySQL** | — | Database utama (biasanya via XAMPP) |
| **MapLibre GL** | ^5.24.0 | Rendering peta WebGL (open-source, tile-based) |
| **react-map-gl** | ^8.1.1 | React wrapper untuk MapLibre |
| **deck.gl** | ^9.3.2 | Visualisasi geospasial (H3 hexagons, GeoJSON layers, coverage overlay) |
| **Turf.js** | ^7.3.5 | Geospatial computation — Voronoi diagram, bounding box, circle, sector |
| **h3-js** | ^4.4.0 | Uber H3 hexagonal grid untuk visualisasi cakupan sinyal |
| **Chart.js** | ^4.5.1 | Grafik analitik di dashboard (distribusi operator, wilayah) |
| **NextAuth.js** | ^4.24.14 | Authentication — credentials provider (email/username + bcrypt password) |
| **bcryptjs** | ^3.0.3 | Password hashing (kompatibel dengan hash Laravel) |
| **Tailwind CSS** | ^4 | Styling utama (PostCSS plugin mode) |
| **Framer Motion** | ^12.38.0 | Animasi UI (page transitions, modals, components) |
| **Zod** | ^4.4.3 | Schema validation untuk form input (edit tower, GPS input) |
| **react-hook-form** | ^7.75.0 | Form management (login, register, forgot password) |
| **PapaParse** | ^5.5.3 | CSV parsing untuk bulk import |
| **Lucide React** | ^1.14.0 | Icon library |
| **Playwright** | ^1.60.0 | E2E testing framework |
| **LRU Cache** | ^11.3.6 | In-memory rate limiting pada API routes |

---

## Cara Setup & Menjalankan

### Prerequisites

- **Node.js** v18+ (direkomendasikan v20+)
- **MySQL** — bisa via XAMPP, MariaDB, atau MySQL Server standalone
- **Git** — untuk clone repository
- Browser modern (Chrome/Edge — dibutuhkan untuk WebGL map)

### 1. Clone & Install

```bash
git clone <url-repository>
cd Rabelle-Standalone
npm install
```

### 2. Konfigurasi Environment

Salin `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit `.env` — ada **3 variabel** yang harus diisi:

```env
# Koneksi MySQL — sesuaikan user, password, host, port, dan nama database
DATABASE_URL="mysql://root:@127.0.0.1:3306/rabelle"

# Secret untuk signing JWT session (generate random string yang panjang)
NEXTAUTH_SECRET="ganti-dengan-string-random-minimal-32-karakter"

# URL tempat aplikasi berjalan
NEXTAUTH_URL="http://localhost:3000"
```

> **Catatan**: Jika pakai XAMPP default, `root` tanpa password sudah benar. Pastikan database bernama `rabelle` sudah dibuat di MySQL.

### 3. Setup Database

Pastikan MySQL sudah aktif, lalu push schema Prisma ke database:

```bash
npx prisma db push
```

Ini akan membuat semua tabel (`locations`, `stasiun_radio`, `lokasi_pemancar`, `pengukuran`, `users`, `audit_logs`) secara otomatis.

### 4. Buat User Admin Pertama

Edit file `scripts/add-admin.js` — ubah `NEW_ADMIN_DATA` sesuai kebutuhan, lalu jalankan:

```bash
node scripts/add-admin.js
```

> **Penting**: File ini masuk `.gitignore` karena berisi password plaintext. Jangan commit.

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Atau double-click `start_rabelle.bat` (Windows).

### 6. Verifikasi

1. Buka `http://localhost:3000` — landing page harus muncul dengan statistik (0 data jika database kosong).
2. Klik "Masuk" → login dengan kredensial admin yang dibuat di langkah 4.
3. Dashboard harus tampil dengan sidebar navigasi.
4. Navigasi ke "Peta Interaktif" — peta MapLibre harus load (tile dari CartoDB CDN).

---

## Struktur Folder

```
Rabelle-Standalone/
├── prisma/
│   └── schema.prisma          # ← PENTING: Definisi semua tabel database
│
├── public/
│   ├── logo.png               # Logo Rabelle (light mode)
│   ├── tacet-white.png        # Logo (dark mode)
│   ├── hero-actual.png        # Hero image landing page
│   ├── logos/                  # Logo-logo operator telekomunikasi
│   └── previews/              # Screenshot tema peta (untuk halaman Settings)
│
├── scripts/
│   ├── add-admin.js           # Script CLI untuk membuat user admin baru
│   ├── export-csv.js          # Script CLI untuk export seluruh data ke CSV
│   └── seed_rf_data.js        # Script untuk generate data RF (frekuensi, azimuth, tinggi) ke tower telco
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout — ThemeProvider, AuthProvider, font loading
│   │   ├── page.tsx           # Landing page — server component, fetch stats
│   │   ├── LandingPageClient.tsx  # Landing page client component (animasi, hero, stats cards)
│   │   ├── globals.css        # Design system — CSS variables, light/dark theme tokens, primitives
│   │   │
│   │   ├── login/page.tsx     # Halaman login (split-screen design)
│   │   ├── register/page.tsx  # Halaman registrasi
│   │   ├── forgot-password/page.tsx  # Halaman lupa password (⚠️ BELUM FUNGSIONAL)
│   │   │
│   │   ├── actions/
│   │   │   ├── auth.ts        # Server action: registerUser()
│   │   │   └── import.ts      # Server action: importTowers() — bulk CSV import
│   │   │
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # NextAuth API handler
│   │   │   ├── markers/route.ts     # ← PENTING: API utama untuk peta — GET markers + stats
│   │   │   ├── kota/route.ts        # Autocomplete search kota
│   │   │   └── operators/route.ts   # Autocomplete search operator
│   │   │
│   │   └── dashboard/
│   │       ├── layout.tsx     # Dashboard shell — Sidebar, Header, IdleProvider, PreferencesProvider
│   │       ├── page.tsx       # Dashboard home — aggregasi stats (count BTS, TV, Radio, top operators)
│   │       ├── DashboardPageClient.tsx  # Client: render stats cards + charts
│   │       ├── Sidebar.tsx    # ← PENTING: Definisi navigasi (NAV_GROUPS), role-based menu
│   │       ├── CommandPalette.tsx  # CMD+K command palette (navigasi cepat)
│   │       ├── DashboardHeader.tsx # Top bar: search, notifications, user dropdown
│   │       ├── IdleProvider.tsx    # Auto-hide UI saat idle di halaman peta
│   │       ├── PreferencesProvider.tsx  # Context: mapTheme, coordFormat, signalUnit, hexagonMode
│   │       │
│   │       ├── maps/
│   │       │   ├── page.tsx             # Server component: fetch metadata untuk filter
│   │       │   ├── MapComponentWebGL.tsx # ← PENTING: Komponen peta utama (542 baris)
│   │       │   ├── FloatingFilter.tsx   # Panel filter cascading (jenis → provinsi → kota → operator)
│   │       │   ├── MapWrapper.tsx       # Dynamic import wrapper (ssr: false)
│   │       │   ├── components/
│   │       │   │   ├── CheckSignalPanel.tsx      # Panel "Cek Sinyal Saya" (geolocation + nearest tower)
│   │       │   │   ├── CoverageProgressOverlay.tsx # Progress bar saat computing signal coverage
│   │       │   │   ├── MapControls.tsx            # Tombol kontrol (coverage toggle, theme, zoom)
│   │       │   │   └── MapStatsOverlay.tsx        # Badge stats (jumlah marker terlihat)
│   │       │   └── hooks/
│   │       │       └── useSignalCoverage.ts       # ← PENTING: Hook komputasi H3 hexagon coverage
│   │       │
│   │       ├── data-tabel/
│   │       │   ├── page.tsx         # Tabel data utama — server component, paginated
│   │       │   ├── actions.ts       # Server actions: deleteTowerData(), exportCsvData()
│   │       │   ├── TableFilter.tsx  # Filter + search bar
│   │       │   ├── Pagination.tsx   # Komponen pagination
│   │       │   ├── ActionButtons.tsx # Tombol Edit/Delete per row (admin only)
│   │       │   ├── ExportButton.tsx # Download CSV button
│   │       │   ├── CoordinateCell.tsx # Cell koordinat (copy-to-clipboard)
│   │       │   └── [id]/edit/       # Halaman edit single tower
│   │       │
│   │       ├── add-tower/
│   │       │   ├── csv/page.tsx     # Halaman import CSV (admin only)
│   │       │   └── manual/page.tsx  # Halaman input manual + geolocation (admin only)
│   │       │
│   │       ├── edit-data/
│   │       │   ├── page.tsx         # Panel admin: GeoJSON upload + GPS form
│   │       │   └── actions.ts       # Server actions: uploadGeojson(), saveGpsTower()
│   │       │
│   │       ├── audit/page.tsx       # Audit log viewer (admin only, redirect kalau bukan admin)
│   │       └── settings/page.tsx    # Settings page: profil, preferensi peta, API keys, security
│   │
│   ├── components/
│   │   ├── AuthProvider.tsx   # SessionProvider wrapper (next-auth/react)
│   │   ├── ThemeProvider.tsx  # Custom theme context (light/dark/system) — localStorage persistence
│   │   └── ThemeToggle.tsx    # Toggle button light/dark
│   │
│   ├── lib/
│   │   ├── prisma.ts          # ← PENTING: Prisma client singleton + BigInt serialization fix + audit immutability
│   │   ├── auth.ts            # NextAuth config — CredentialsProvider, JWT callbacks, session strategy
│   │   ├── rf-propagation.ts  # ← PENTING: Model propagasi RF (Okumura-Hata), antenna pattern, frequency mapping
│   │   ├── tower.ts           # Helper: upsertLocation(), revalidateTowerPaths()
│   │   ├── audit.ts           # Helper: createAuditLog() — write ke tabel audit_logs
│   │   ├── constants.ts       # PROVINSI_LIST, EXCLUDED_JENIS, TOWER_REVALIDATE_PATHS
│   │   ├── rate-limit.ts      # In-memory rate limiter (LRU cache, 50 req/min/IP)
│   │   └── activity-logger.ts # File-based activity logger (menulis ke activity.log) — jarang dipakai
│   │
│   └── types/
│       └── next-auth.d.ts     # Type augmentation untuk NextAuth session (id, username, isAdmin)
│
├── tests/e2e/
│   ├── auth.spec.ts           # Test login, register, logout
│   ├── user-journey.spec.ts   # Test user workflow: login → dashboard → maps → data table
│   ├── admin-journey.spec.ts  # Test admin workflow: login → audit → add tower → edit data
│   ├── add-tower.spec.ts      # Test CSV import dan manual tower entry
│   └── map.spec.ts            # Test map page loading
│
├── theme/                     # (Kosong atau berisi asset tema — tidak signifikan)
├── .env.example               # Template environment variables
├── .env.test                  # Environment untuk Playwright tests (database: rabelle_test)
├── playwright.config.ts       # Konfigurasi E2E test
├── start_rabelle.bat          # Windows shortcut: npm run dev
├── download.ps1               # Script PowerShell untuk download sesuatu (utility, bukan bagian core)
├── download_logos.js           # Script download logo operator (utility one-time)
└── tower_data_export.csv      # Contoh output dari scripts/export-csv.js (ada di .gitignore)
```

---

## Fitur yang Sudah Ada & Berfungsi

### Authentication
- ✅ Login via email ATAU username (dengan bcrypt hash — kompatibel dengan hash dari Laravel)
- ✅ Register user baru (validasi duplikat email/username)
- ✅ JWT-based session (30 hari expiry)
- ✅ Role-based access: `admin` dan `viewers`
- ✅ Protected routes (redirect ke `/login` jika belum auth)

### Peta Interaktif (`/dashboard/maps`)
- ✅ Peta WebGL dengan MapLibre GL + react-map-gl
- ✅ 4 tema peta: Colorful, Voyager, Dark, Satellite (semua dari CartoDB tiles)
- ✅ Smart clustering: zoom rendah → kluster per provinsi, zoom sedang → per kota, zoom tinggi → titik individual
- ✅ Floating filter panel: cascading filter jenis → provinsi → kota → operator
- ✅ Popup detail saat klik marker (nama operator, jenis, koordinat, spesifikasi menara)
- ✅ Simulasi cakupan sinyal (toggle on/off):
  - Model Okumura-Hata untuk kalkulasi path loss
  - Visualisasi hexagonal (H3) atau Voronoi diagram
  - Warna gradasi: hijau (kuat) → kuning (sedang) → merah (lemah)
- ✅ "Cek Sinyal Saya": gunakan geolocation browser → cari menara terdekat → tampilkan estimasi kuat sinyal
- ✅ Auto-hide UI saat idle di halaman peta (IdleProvider)
- ✅ Rate limiting pada API markers (50 req/min/IP via LRU cache)
- ✅ Format koordinat switchable: Decimal ↔ DMS
- ✅ Unit sinyal switchable: Persentase ↔ dBm

### Dashboard Analitik (`/dashboard`)
- ✅ Statistik ringkasan: total tower, BTS, TV, Radio
- ✅ Grafik top 5 operator (by jumlah stasiun radio)
- ✅ Grafik top 10 kota (by jumlah pengukuran)

### Data Management (Admin Only)
- ✅ Tabel data dengan pagination server-side (10 item/halaman)
- ✅ Filter + search pada tabel (by jenis, provinsi, kota, operator, teks bebas)
- ✅ Export data ke CSV (sesuai filter aktif)
- ✅ Delete data tower (dengan cascade cleanup: hapus pengukuran → cek & hapus stasiun_radio/lokasi_pemancar jika orphan)
- ✅ Edit data tower individual (`/dashboard/data-tabel/[id]/edit`)
- ✅ Import bulk via CSV (`/dashboard/add-tower/csv`) — PapaParse parsing, relational mapping otomatis
- ✅ Input manual tower (`/dashboard/add-tower/manual`) — form + HTML5 Geolocation API
- ✅ Upload GeoJSON (`/dashboard/edit-data`) — parsing geometry (Point, Polygon, LineString), dedup by coordinate proximity
- ✅ GPS-based tower entry (`/dashboard/edit-data`) — form dengan validasi Zod

### Audit & Logging
- ✅ Audit log immutable (Prisma client melarang update/delete pada `audit_logs`)
- ✅ Setiap mutasi data (import, tambah, hapus, edit) menghasilkan entry di audit_logs
- ✅ Halaman audit log viewer admin-only (`/dashboard/audit`)

### UI/UX
- ✅ Light/Dark mode (custom ThemeProvider, localStorage persistence, system detection)
- ✅ Command Palette (CMD+K / CTRL+K) untuk navigasi cepat
- ✅ Responsive design (sidebar collapse, mobile hamburger menu)
- ✅ Design token system (CSS variables untuk light/dark)
- ✅ Framer Motion animations (page transitions, modals, dropdowns)

---

## Yang Belum Selesai / Perlu Dilanjutkan

### 🔴 Forgot Password — HANYA UI, TIDAK ADA BACKEND

File: `src/app/forgot-password/page.tsx` (baris 36-42)

```typescript
const onSubmit = async (data: ForgotFormValues) => {
  setIsLoading(true);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  setIsLoading(false);
  setIsSubmitted(true);
};
```

Halaman ini menampilkan form "kirim email reset password" dan menampilkan pesan "Email Terkirim!", tapi **tidak ada email yang benar-benar dikirim**. Tidak ada API route untuk reset password, tidak ada token reset di database, tidak ada integrasi email provider (Resend, SendGrid, dll).

**Yang perlu dibuat:** API endpoint untuk generate reset token, simpan token di DB, kirim email, dan halaman untuk set password baru.

---

### 🔴 Settings Page — SEBAGIAN BESAR TIDAK FUNGSIONAL

File: `src/app/dashboard/settings/page.tsx`

**Yang sudah jalan:**
- Tab "Preferensi Peta" — mapTheme, coordFormat, signalUnit, hexagonMode tersimpan di `PreferencesProvider` (localStorage)

**Yang TIDAK jalan:**
- **Tab "Umum" (Profil)** — form nama dan email hanya menampilkan hardcoded value `"Harits"` dan `"harits@example.com"`. Tombol "Simpan Perubahan" tidak melakukan apa-apa ke database. Upload foto profil tidak diimplementasikan.
- **Tab "Developer & API"** — menampilkan 2 API key dummy yang hardcoded. Tombol "Generate New Key" tidak melakukan apa-apa. Tidak ada sistem API key di database.
- **Tab "Keamanan"** — form ubah password tidak tersambung ke backend. Tombol "Enable 2FA" tidak diimplementasikan.
- **Bug CSS**: Baris 361 memiliki `py-10 py-3` (duplikat padding class) pada input Password Baru.

---

### 🟡 Halaman "Hak Akses" (`/dashboard/permissions`) — TIDAK ADA

Sidebar mendefinisikan link ke `/dashboard/permissions` (file `Sidebar.tsx` baris 49), tapi **halaman ini tidak pernah dibuat**. Mengklik akan menghasilkan 404.

---

### 🟡 Notifications Panel — UI ONLY

File: `src/app/dashboard/NotificationsPanel.tsx` (7979 bytes). Komponen ini kemungkinan menampilkan panel notifikasi, tapi tidak ada backend untuk notifikasi (tidak ada tabel notifications di database, tidak ada API endpoint).

---

### 🟡 User Profile Dropdown — PERLU REVIEW

File: `src/app/dashboard/UserProfileDropdown.tsx` (6428 bytes). Komponen ini ada tapi perlu diverifikasi apakah semua action links-nya benar-benar tersambung.

---

### 🟡 Activity Logger — UNDERUTILIZED

File: `src/lib/activity-logger.ts` menulis ke file `activity.log` di root, tapi sangat jarang dipanggil di kode. Sistem audit yang sebenarnya dipakai adalah `audit.ts` (menulis ke database). `activity-logger.ts` kemungkinan sisa dari fase development awal dan bisa dihapus atau digantikan sepenuhnya oleh audit database.

---

### 🟡 Download Scripts — ONE-TIME UTILITIES

`download.ps1`, `download_logos.js`, `download_logos2.js` — script untuk mendownload logo operator. Ini utilitas one-time, bukan bagian core app. Bisa diabaikan.

---

### 🟡 Provinsi "DI Jogja" vs "DI Yogyakarta"

Di `constants.ts` baris 8, provinsi ditulis `"DI Jogja"`. Tapi di `MapComponentWebGL.tsx` baris 39, `PROVINCE_CENTERS` menggunakan `"DI Yogyakarta"`. Inkonsistensi ini bisa menyebabkan kluster provinsi Yogyakarta tidak muncul pada zoom rendah jika data di database menggunakan salah satu format saja.

---

### 🟡 `test_ops.js` — File test utility di root

File `test_ops.js` (420 bytes) di root project. Kemungkinan test script sementara yang tertinggal.

---

## Keputusan Teknis Penting

### 1. BigInt Serialization Monkey Patch

File: `src/lib/prisma.ts` baris 3-8

```typescript
if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}
```

**Alasan**: Prisma menggunakan `BigInt` untuk ID kolom `UNSIGNED BIGINT` dari MySQL. JavaScript native `JSON.stringify()` tidak bisa serialize `BigInt`, menyebabkan crash saat Next.js mencoba serialize data ke client. Monkey patch ini mengkonversi BigInt ke string saat JSON serialization.

**Risiko**: Monkey patch ini mengubah prototype global. Ini adalah workaround standar tapi perlu diperhatikan saat debugging issue terkait number/string type mismatch.

### 2. Audit Log Immutability via Prisma Extension

File: `src/lib/prisma.ts` baris 11-28

Prisma client di-extend dengan hook yang melempar error jika ada upaya `update`, `updateMany`, `delete`, atau `deleteMany` pada tabel `audit_logs`. Ini memastikan audit trail tidak bisa dimanipulasi dari aplikasi.

**Catatan**: Ini hanya proteksi di level aplikasi. Akses langsung ke MySQL masih bisa mengubah data. Untuk produksi, pertimbangkan proteksi di level database (GRANT permissions).

### 3. Kompatibilitas Hash Password Laravel

File: `src/lib/auth.ts` baris 29-30

```typescript
// bcryptjs handles bcrypt hashes from laravel perfectly
const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
```

**Konteks**: Proyek ini kemungkinan migrasi dari aplikasi Laravel. `bcryptjs` kompatibel dengan hash `$2y$` yang dihasilkan Laravel, sehingga user lama bisa login tanpa reset password.

### 4. Simulasi RF — Bukan Data Riil

File: `src/lib/rf-propagation.ts`

Kalkulasi cakupan sinyal menggunakan model **Okumura-Hata** yang merupakan model propagasi standar telekomunikasi. Namun beberapa parameter di-generate secara pseudo-random:

- `getFrequencyForOperator()` — jika data frekuensi tidak ada di database, frekuensi di-derive dari nama operator dengan seed pseudo-random.
- `getTowerParams()` — tinggi menara, jumlah sektor antena, dan azimuth di-generate berdasarkan tower density dan seed dari ID.

**Implikasi**: Visualisasi cakupan sinyal adalah **simulasi/estimasi**, bukan pengukuran aktual. Data yang akurat bergantung pada apakah field `frekuensi`, `tinggi_menara_m`, dan `azimuths` di tabel `lokasi_pemancar` diisi dengan benar saat import.

Script `scripts/seed_rf_data.js` bisa dijalankan untuk mengisi data RF secara otomatis ke tower telco yang belum memiliki data tersebut.

### 5. Rate Limiting In-Memory

File: `src/lib/rate-limit.ts`

Rate limiter menggunakan LRU cache di memori proses. Ini berarti:
- Reset setiap kali server restart.
- Tidak shared antar instance jika di-deploy multi-process.
- Cukup untuk development dan single-instance deployment.

Untuk produksi, pertimbangkan Redis-based rate limiting.

### 6. `EXCLUDED_JENIS` — Filter "Lighting"

File: `src/lib/constants.ts` baris 15

```typescript
export const EXCLUDED_JENIS = ["lighting", "Lighting"];
```

Ada jenis komunikasi "Lighting" di database yang di-exclude dari semua query dan tampilan. Ada juga script `db:delete-lighting` di package.json untuk menghapusnya. Ini kemungkinan data noise/artifact dari import data awal.

### 7. Custom Theme Provider (bukan next-themes)

Meskipun `next-themes` terdaftar di `package.json`, project menggunakan **custom `ThemeProvider`** (`src/components/ThemeProvider.tsx`) yang mengimplementasikan light/dark/system detection sendiri via localStorage key `"rabelle-theme"`. `next-themes` mungkin tidak terpakai atau sisa dari versi sebelumnya.

### 8. Tidak Ada Middleware untuk Auth Protection

Saat ini, proteksi route dilakukan per-halaman (masing-masing server component memanggil `getServerSession()` dan `redirect()` sendiri). Tidak ada `middleware.ts` Next.js untuk auth guard global. Ini berarti jika developer menambah halaman baru di `/dashboard/`, halaman tersebut **secara default tidak terproteksi** — harus menambahkan session check manual.

---

## Cara Berkontribusi / Development Workflow

### Menambah Fitur Baru

1. **Halaman baru di dashboard**: Buat folder di `src/app/dashboard/<nama-fitur>/`, tambahkan `page.tsx`. Tambahkan link di `Sidebar.tsx` (array `NAV_GROUPS`). Jika admin-only, tambahkan `adminOnly: true`.

2. **API endpoint baru**: Buat `src/app/api/<endpoint>/route.ts`. Ikuti pola yang sudah ada — import `prisma`, tambahkan session check jika perlu, gunakan `rateLimit()` untuk endpoint publik.

3. **Server action baru**: Buat file `.ts` dengan `"use server"` di atas. Tempatkan di `src/app/actions/` untuk action global, atau di folder fitur terkait (contoh: `data-tabel/actions.ts`).

4. **Modifikasi schema database**: Edit `prisma/schema.prisma`, lalu jalankan `npx prisma db push` (development) atau `npx prisma migrate dev` (jika ingin migration history).

### Menjalankan Tests

```bash
# Pastikan database test sudah ada (rabelle_test di MySQL)
npx prisma db push --schema=./prisma/schema.prisma  # dengan .env.test

# Jalankan E2E tests
npx playwright test

# Jalankan test spesifik
npx playwright test tests/e2e/auth.spec.ts

# Buka test report
npx playwright show-report
```

Playwright config (`playwright.config.ts`) otomatis menjalankan dev server dengan `.env.test` sebelum test dimulai.

### Scripts Utility

```bash
# Export seluruh data tower ke CSV
node scripts/export-csv.js

# Generate data RF (frekuensi, tinggi, azimuth) untuk tower telco
node scripts/seed_rf_data.js

# Hapus data "lighting" dari database
npm run db:delete-lighting

# Tambah user admin baru (edit file dulu)
node scripts/add-admin.js
```

### Konvensi Kode

- **Bahasa UI**: Indonesia (label, error message, komentar). Kode dan nama variabel dalam bahasa Inggris.
- **Styling**: Tailwind CSS utilities. Warna menggunakan semantic tokens (`text-foreground`, `bg-card`, `border-border`, dll.) yang didefinisikan di `globals.css`.
- **State management**: Tidak ada global state library. Gunakan React Context (lihat `PreferencesProvider`, `IdleProvider`) atau server components.
- **Data fetching**: Server Components untuk initial data, client-side `fetch()` untuk data dinamis (markers).
- **Validasi**: Zod schema untuk form input yang kritis. Validasi manual untuk form yang lebih sederhana.

### Hal-Hal yang Perlu Diperhatikan

- Selalu test dengan dark mode — beberapa komponen (terutama popup peta di `MapComponentWebGL.tsx` baris 451) memiliki hardcoded `bg-white` dan `text-slate-800` yang tidak mengikuti theme system.
- API `/api/markers` membatasi response ke **1500 marker** per viewport (`take: 1500` di `markers/route.ts` baris 64). Ini sengaja untuk performa, tapi bisa menyembunyikan data di area sangat padat.
- Setelah mutasi data (import/tambah/hapus), panggil `revalidateTowerPaths()` dari `src/lib/tower.ts` untuk invalidate cache Next.js pada halaman terkait.

---

## Lisensi

Proyek ini dikembangkan untuk kebutuhan internal **Rabelle Intelligence**. Hak cipta © 2026.
