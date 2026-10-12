# LOKAVA — Laut, Alam, dan Cerita

Platform wisata, kuliner, penginapan, dan UMKM **Ujunggenteng & Sukabumi Selatan**. Next.js 15 (App Router) + TypeScript + Tailwind, Firebase Auth + Firestore, Cloudinary, Leaflet/OpenStreetMap, Telegram Bot, PWA. Dideploy lewat GitHub → Vercel.

> **Status jujur.** Kode lengkap sudah ditulis sesuai spesifikasi, dan logika murni (harga, WhatsApp, enkripsi, batas paket, penilaian kelengkapan) sudah dijalankan dan lolos. **Build penuh (`npm run build`), integrasi Firebase/Cloudinary/Telegram, dan pengujian di perangkat belum pernah dijalankan**, karena lingkungan pembuatan kode tidak punya akses internet. Jalankan checklist di bagian 9 sebelum menyatakan siap produksi.

## Isi

1. [Fitur](#1-fitur) · 2. [Persiapan lokal](#2-persiapan-lokal) · 3. [Firebase](#3-firebase) · 4. [Cloudinary](#4-cloudinary) · 5. [Telegram](#5-telegram) · 6. [Admin pertama & data awal](#6-admin-pertama--data-awal) · 7. [GitHub](#7-github) · 8. [Vercel](#8-vercel) · 9. [Checklist pengujian](#9-checklist-pengujian) · 10. [Arsitektur & keamanan](#10-arsitektur--keamanan) · 11. [Batasan](#11-batasan-yang-perlu-diketahui)

## 1. Fitur

- **Publik tanpa login**: beranda, pencarian + filter, direktori, wisata, kuliner, penginapan, produk, detail bisnis (`/bisnis/slug`), promosi aktif, peta, tombol WhatsApp (tautan `wa.me`, tidak mengirim otomatis), SEO (metadata, sitemap, robots, JSON-LD), PWA.
- **Pemilik bisnis**: registrasi/login/reset sandi, pendaftaran bisnis + verifikasi, produk/menu/layanan, foto (Cloudinary), langganan, promosi, pembayaran manual + unggah bukti, riwayat transaksi, hapus akun.
- **Admin**: ringkasan, bisnis, transaksi, promosi, paket, metode pembayaran + QR, kategori, wilayah, wisata, banner, pengguna, Telegram, pengaturan aplikasi, audit log, penghapusan akun.
- **Dinamis tanpa ubah kode**: kategori, wilayah, destinasi, paket, harga, durasi, batas, jenis promosi, metode pembayaran, banner.

## 2. Persiapan lokal

Butuh **Node.js 20.9+** (disarankan 22 LTS) dan npm.

```bash
npm install
cp .env.example .env.local     # Windows PowerShell: Copy-Item .env.example .env.local
# isi .env.local (lihat bagian 3-5)
npm run dev                    # http://localhost:3000
npm run typecheck
npm run lint
npm test                       # unit test
npm run test:rules             # test Firestore rules (butuh Java + emulator Firebase)
npm run build && npm start     # build production
```

Buat kunci acak:

```bash
openssl rand -hex 32   # → APP_ENCRYPTION_KEY (64 karakter hex)
openssl rand -hex 24   # → CRON_SECRET dan TELEGRAM_WEBHOOK_SECRET (buat masing-masing sendiri)
```

## 3. Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable**.
3. **Build → Firestore Database → Create database** (mode production, pilih region terdekat, mis. `asia-southeast2`).
4. **Project settings → General → Your apps → Web (`</>`)** → daftarkan app → salin config ke `NEXT_PUBLIC_FIREBASE_*`.
5. **Project settings → Service accounts → Generate new private key** → buka file JSON:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (dalam tanda kutip ganda, pertahankan `\n`)
   - **Jangan** commit file JSON itu. `.gitignore` sudah memblokir pola umumnya.
6. Pasang rules dan indeks:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add            # pilih project
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   Pembuatan indeks butuh beberapa menit. Sebelum selesai, sebagian query akan error "requires an index".
7. Setelah deploy Vercel: **Authentication → Settings → Authorized domains → Add domain** → domain `*.vercel.app` Anda dan domain kustom.

## 4. Cloudinary

1. Daftar di cloudinary.com. Dari **Dashboard** salin Cloud name, API Key, API Secret → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
2. Aplikasi memakai **signed upload**: server menandatangani parameter (folder dan tipe ditentukan server). **Upload preset tidak diperlukan**; jangan membuat preset *unsigned*.
3. Folder: `lokava/business/{uid}`, `lokava/product/{uid}`, `lokava/promotion/{uid}`, `lokava/admin`, dan `lokava/proof/{uid}` (tipe `authenticated`).
4. **Bukti pembayaran** diunggah dengan `type=authenticated`, tidak punya URL publik. Admin/pemilik membukanya lewat `/api/proof/{id}` yang membuat URL unduhan berumur 5 menit setelah memeriksa hak akses. Setelah deploy, uji: salin URL Cloudinary mentah sebuah bukti ke jendela penyamaran, harus **gagal** dibuka.
5. Server memeriksa setiap foto baru (ukuran ≤ 5 MB, format JPG/PNG/WebP) lewat Admin API sebelum disimpan; foto yang melanggar dihapus.
6. Opsional: di **Settings → Security** batasi "Allowed fetch domains" dan aktifkan "Restricted image types".

## 5. Telegram

1. Chat **@BotFather** → `/newbot` → salin token.
2. Isi `TELEGRAM_BOT_TOKEN` (atau tempel di dashboard admin → Telegram; disimpan terenkripsi AES-256-GCM, tidak pernah dikembalikan ke browser).
3. Buat grup admin, tambahkan bot, lalu cari Chat ID grup (mis. kirim pesan lalu buka `https://api.telegram.org/bot<TOKEN>/getUpdates` di browser **sementara**, jangan bagikan URL itu). Isi `TELEGRAM_DEFAULT_CHAT_ID` atau isi lewat dashboard.
4. Kirim `/id` ke bot (chat pribadi) untuk mengetahui ID Telegram Anda → masukkan ke **Admin → Telegram → ID admin yang diizinkan**. Hanya ID ini yang bisa menekan Setujui/Tolak.
5. Isi `TELEGRAM_WEBHOOK_SECRET` (acak, ≥ 24 karakter). **Setelah deploy production**, pasang webhook:
   ```bash
   npm run set-webhook          # atau tombol "Pasang webhook" di Admin → Telegram
   ```
6. Tekan **Uji koneksi & notifikasi**, lalu uji dengan pendaftaran bisnis dan bukti pembayaran contoh.

Mode verifikasi: `manual`, `assisted` (default: data wajib tidak lengkap otomatis dikembalikan untuk diperbaiki, keputusan akhir tetap admin), `auto` (setujui hanya jika data lengkap dan tanpa tanda curiga; aktifkan hanya jika Anda paham risikonya). Kelengkapan formulir **tidak** membuktikan identitas atau legalitas usaha.

## 6. Admin pertama & data awal

Tidak ada endpoint publik pembuat admin. Caranya:

```bash
npm run dev            # buka /register, daftarkan akun Anda
npm run create-admin -- email@anda.com   # promosi menjadi admin (yang pertama = admin utama)
npm run seed           # kategori, paket FREE/PREMIUM/BUSINESS, jenis promosi, wilayah, setelan Telegram
```

Lalu keluar-masuk lagi. Di dashboard admin: tambahkan **metode pembayaran** (rekening/QR yang sah), **destinasi wisata** (hanya data terverifikasi), dan sesuaikan pengaturan. Seed **tidak** membuat data bisnis/wisata palsu, dan koordinat tidak pernah diisi otomatis.

## 7. GitHub

Terminal:

```bash
git init
git add .
git status                    # pastikan .env.local TIDAK ada di daftar
git commit -m "LOKAVA: versi awal"
git branch -M main
git remote add origin https://github.com/<akun-anda>/lokava.git   # repo kosong bernama lokava
git push -u origin main
```

GitHub Desktop: **File → Add local repository** → pilih folder → **Publish repository** (nama `lokava`; ceklis *Keep this code private* bila perlu). Periksa panel *Changes*: tidak boleh ada `.env.local`, `node_modules`, `.next`.

Jika secret sempat ter-commit: anggap bocor. Putar (rotate) semua kunci terkait, lalu bersihkan riwayat.

## 8. Vercel

1. vercel.com → login dengan GitHub → **Add New → Project** → impor `lokava`.
2. Framework: **Next.js** (otomatis), Root Directory: `./`, build command bawaan.
3. **Settings → Environment Variables** → isi semua variabel `.env.example` untuk **Production** (dan **Preview** bila perlu). `NEXT_PUBLIC_APP_URL` = URL final (mis. `https://lokava.vercel.app`). Setiap mengubah variabel → **Redeploy**.
4. **Deploy**. Jika build gagal: baca log → perbaiki → `npm run build` lokal → push → Vercel membangun ulang otomatis.
5. Setelah sukses: tambah domain ke Firebase Authorized domains (bagian 3.7), pasang webhook Telegram (bagian 5.5), jalankan checklist bagian 9.
6. Cron `vercel.json` memanggil `/api/cron/maintenance` setiap hari (pukul 20.00 UTC) untuk mengakhiri langganan/promosi/banner kedaluwarsa, melanjutkan penghapusan akun yang gagal, dan menghapus transaksi melewati masa retensi. Vercel otomatis mengirim `Authorization: Bearer $CRON_SECRET`, jadi pastikan `CRON_SECRET` terisi. (Paket Hobby hanya mengizinkan cron harian.)

## 9. Checklist pengujian

Tandai hanya setelah Anda benar-benar mengujinya.

**Build & dasar**: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:rules`, `npm run build` semua lulus · halaman publik terbuka tanpa error · tidak ada error fatal di log Vercel.
**Auth**: daftar · login · logout · reset sandi (email masuk) · `/dashboard` tanpa login diarahkan ke `/login` · pemilik membuka `/admin` → dialihkan · akun baru tidak bisa jadi admin.
**Bisnis**: simpan draf · ajukan (notifikasi Telegram masuk) · minta perbaikan → pemilik melihat catatan · setujui → tampil di `/bisnis` · tolak/tangguhkan → hilang seketika dari publik.
**Paket**: pemilik FREE menambah produk ke-6 → ditolak server · foto melebihi batas → ditolak · ubah harga paket di admin → transaksi baru memakai harga baru, transaksi lama tetap.
**Transaksi**: buat transaksi (nominal dari server; ubah request di DevTools tidak berpengaruh) · unggah bukti · bukti tidak terbuka publik · setujui → paket aktif · tekan setujui dua kali (web & Telegram) → kedua kali ditolak · pemilik tidak bisa memanggil API admin (403).
**Promosi**: ajukan → bayar → setujui → muncul di `/promosi`/beranda · setelah `expiresAt` lewat tidak muncul (bahkan sebelum cron berjalan) · banner terkait transaksi.
**Telegram**: callback dari ID tidak terdaftar ditolak · secret webhook salah → 401 · callback berulang tidak diproses ulang.
**Hapus akun**: konten langsung hilang dari publik · aset Cloudinary milik akun terhapus · transaksi tetap dengan nama dianonimkan · akun Auth terhapus · tidak bisa login lagi.
**PWA**: popup pasang muncul sekali di Chrome Android · petunjuk Share → Add to Home Screen di Safari iPhone · tidak muncul lagi setelah "Nanti Saja" (14 hari) atau setelah terpasang · mode offline menampilkan `/offline` · halaman `/dashboard`, `/admin`, `/api` tidak pernah masuk cache.
**Mobile**: uji di Android, iPhone, tablet, laptop (tabel dashboard memakai daftar adaptif).

## 10. Arsitektur & keamanan

- **Firestore Rules default-deny**: klien hanya boleh *membaca* dokumen miliknya; **semua penulisan** dan semua pembacaan data publik lewat server (Admin SDK). Rules + test di `tests/rules.test.ts`.
- **Admin SDK melewati rules**, karena itu setiap Route Handler memanggil `requireApiUser()` (sesi cookie + dokumen `users/{uid}` sebagai sumber role/status), memeriksa kepemilikan, memvalidasi input (Zod), dan membatasi laju (best-effort per instance).
- **Role** hanya dari dokumen `users` yang tak bisa ditulis klien; admin dibuat lewat skrip `create-admin`.
- **Harga/nominal** dihitung server dari `plans`/`promotionTypes`, disimpan sebagai snapshot di transaksi. Klien tidak pernah mengirim nominal.
- **Persetujuan transaksi** memakai Firestore transaction + pemeriksaan status → tidak bisa disetujui ganda; admin tidak bisa menyetujui transaksinya sendiri; layanan aktif hanya setelah `approved`.
- **Visibilitas publik**: field `visible` (denormalisasi) pada bisnis & produk dihitung ulang tiap status berubah (persetujuan, penangguhan, penghapusan akun). Promosi/banner divalidasi `status` + `expiresAt` di server pada setiap query.
- **Rahasia**: tidak ada di repo/klien. Token Telegram: env var atau terenkripsi AES-GCM; tak pernah dikembalikan; audit log tak memuat nilainya.
- **Header keamanan**, cookie sesi `httpOnly; secure; sameSite=lax`, halaman privat `Cache-Control: private, no-store`, service worker tidak menyimpan `/api`, `/dashboard`, `/admin`.

Struktur utama: `app/` (halaman & API), `components/`, `lib/` (firebase, auth, cloudinary, telegram, payments, validation, permissions, data, admin), `types/`, `scripts/` (admin, seed, webhook), `tests/`, `firestore.rules`, `firestore.indexes.json`.

## 11. Batasan yang perlu diketahui

- **Pencarian** memakai token + `array-contains` (Firestore tak punya full-text): kecocokan kata utuh, maksimal 60 kandidat per koleksi. Untuk skala besar, pertimbangkan Algolia/Typesense.
- **Pembatas laju** disimpan di memori per instance serverless (cukup untuk menahan penyalahgunaan ringan, bukan perlindungan DDoS). Gunakan Vercel Firewall/Upstash untuk skala lebih besar.
- **Tile OpenStreetMap publik** hanya untuk trafik kecil (lihat kebijakan penggunaan tile OSM). Untuk produksi, isi `NEXT_PUBLIC_MAP_TILE_URL` dengan penyedia tile berkontrak.
- **Pembayaran manual**: admin wajib mencocokkan mutasi/QR sebenarnya. Bukti gambar bukan bukti uang diterima.
- **Masa retensi transaksi** diset 1.825 hari (`TRANSACTION_RETENTION_DAYS` di `lib/payments/transactions.ts`). Sesuaikan dengan ketentuan hukum/akuntansi Anda; ini bukan nasihat hukum.
- **Teks kebijakan privasi/syarat** bawaan hanya contoh ringkas. Tinjau dan ganti sebelum peluncuran.
- Foto destinasi/bisnis harus berasal dari pengelola atau berizin; aplikasi menampilkan placeholder jelas bila belum ada foto.
- Belum ada: checkout, komisi, pemesanan hotel otomatis, ulasan pengguna, statistik kunjungan (sengaja, sesuai lingkup versi awal).
