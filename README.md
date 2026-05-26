# 📡 Rabelle: Geographic Intelligence Platform

**Rabelle** adalah platform analisis dan pemetaan infrastruktur telekomunikasi (Menara BTS, TV, dan Radio) untuk wilayah Pulau Jawa dan Bali. Aplikasi ini dirancang untuk memberikan visualisasi data yang presisi, analisis distribusi operator, serta pemantauan cakupan sinyal secara interaktif.

---

## 🚀 Fitur Utama
- **Interactive WebGL Map**: Visualisasi ribuan titik infrastruktur dengan performa tinggi menggunakan MapLibre GL.
- **Smart Clustering**: Pengelompokan data berdasarkan Provinsi dan Kota/Kabupaten secara dinamis.
- **Signal Coverage Visualization**: Simulasi gradasi jangkauan sinyal (Kuat, Sedang, Lemah).
- **Advanced Analytics Dashboard**: Grafik distribusi operator dan wilayah menggunakan Chart.js.
- **Smart Filtering**: Filter pencarian cerdas dengan fitur *autocomplete* untuk wilayah dan kategori.
- **Secure Authentication**: Sistem login aman menggunakan NextAuth.js.

---

## 🛠️ Tech Stack
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: MySQL / MariaDB
- **Map Engine**: MapLibre GL / React Map GL
- **Styling**: Vanilla CSS & Tailwind CSS
- **Animations**: Framer Motion
- **Analytics**: Chart.js & React-Chartjs-2

---

## 📋 Prasyarat
Sebelum memulai, pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (Versi 18 atau lebih baru)
- [XAMPP](https://www.apachefriends.org/) atau server MySQL lokal lainnya
- Browser modern (Chrome/Edge/Safari)

---

## ⚙️ Langkah Instalasi & Setup

### 1. Clone Repositori
```bash
git clone https://github.com/username/rabelle.git
cd rabelle
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di root direktori dan salin isi dari `.env.example`:
```bash
cp .env.example .env
```
Sesuaikan nilai `DATABASE_URL` dengan kredensial database MySQL Anda:
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/rabelle"
```

### 4. Setup Database (Prisma)
Pastikan MySQL Anda aktif (via XAMPP), lalu jalankan perintah berikut untuk mensinkronisasi schema database:
```bash
npx prisma db push
```

### 5. Jalankan Aplikasi
Anda dapat menjalankan aplikasi menggunakan salah satu cara berikut:

**Opsi A (Via Terminal):**
```bash
npm run dev
```

**Opsi B (Via Shortcut Windows):**
Jalankan file `start_rabelle.bat` dengan klik dua kali.

---

## 🖥️ Cara Penggunaan
1. Buka browser dan akses [http://localhost:3000](http://localhost:3000).
2. Gunakan **Landing Page** untuk ringkasan cepat.
3. Masuk ke **Dashboard** untuk melihat analisis statistik.
4. Gunakan menu **Peta Interaktif** untuk eksplorasi geografis.
5. Gunakan **Tabel Data** untuk melihat detail teknis setiap infrastruktur.

---

## 📁 Struktur Proyek
- `/src/app`: Logika halaman dan routing (Next.js App Router).
- `/src/components`: Komponen UI yang dapat digunakan kembali.
- `/prisma`: Schema database dan konfigurasi ORM.
- `/public`: Aset statis (Logo, Gambar).
- `/scripts`: Skrip bantuan untuk manipulasi data database.

---

## 🎨 Versi 2.0 (Modernization Overhaul)

Branch `v2` membawa pembaruan besar pada sisi antarmuka dan pengalaman pengguna (UI/UX) dengan standar industri modern:

- **Intelligence Interaction System**: Implementasi **Command Palette (CMD+K)** untuk navigasi instan, pencarian wilayah, dan peluncuran aksi cepat ala Raycast/Linear.
- **Modern Authentication Flow**: Perombakan total halaman Login, Register, dan Forgot Password dengan desain *split-screen* premium dan validasi real-time.
- **Premium SaaS Aesthetic**: Desain minimalis sinematik dengan dukungan **Dark Mode** penuh, tipografi modern (Inter/Geist), dan mikro-animasi yang halus.
- **Security & Access Control**: Pengamanan ketat pada modul sensitif (Audit Logs, Aktivitas Terbaru, Panel Admin) dengan kontrol akses berbasis peran (Admin-only).
- **Data Visualization 2.0**: Grafik distribusi infrastruktur dan pangsa pasar operator yang lebih presisi dengan tata letak *side-by-side* yang optimal.
- **Responsive Mastery**: Antarmuka yang dioptimalkan untuk perangkat seluler dan desktop dengan sistem grid yang adaptif.

---

## 🚀 Versi 4.0 (Data Operations & Quality Assurance)

Branch `v4` memperkenalkan kapabilitas operasional data tingkat lanjut dan otomatisasi pengujian E2E (End-to-End) komprehensif:

- **E2E Test Automation**: Terintegrasi penuh dengan **Playwright** untuk memastikan stabilitas fitur dari sisi *User* maupun *Admin* (mencakup pendaftaran, manajemen data, hingga eksplorasi peta).
- **Smart Data Import**: Fitur impor massal (*Bulk Import*) data infrastruktur via file `.csv` dengan pemetaan relasional otomatis yang cerdas.
- **Manual Data Entry**: Panel form input manual terintegrasi dengan HTML5 Geolocation API untuk akurasi data wilayah.
- **CSV Data Export**: Skrip utilitas bawaan untuk melakukan *export* atau migrasi seluruh data pengukuran beserta metadata wilayah dan operator ke dalam file `.csv`.
- **Admin Sandbox**: Lingkungan aman bagi admin untuk menambah, memodifikasi, dan mengelola entitas relasional (*stasiun radio*, *lokasi pemancar*, dan *wilayah*) secara intuitif dari dalam *Dashboard*.

---

## 📄 Lisensi
Proyek ini dikembangkan untuk kebutuhan internal **Rabelle Intelligence**. Hak cipta © 2026.

---
*Developed with ❤️ for Better Connectivity.*
