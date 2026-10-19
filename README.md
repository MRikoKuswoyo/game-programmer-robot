<div align="center">

# 🤖 Misi Coder-Bot

**Game belajar berpikir logis dan dasar pemrograman untuk anak SD**
Susun kartu perintah, jalankan robot, hindari bug, dan capai finish!

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

Dibuat oleh **[MRikoKuswoyo](https://github.com/MRikoKuswoyo)**

</div>

---

## ✨ Fitur

- **15 level** pada papan **6×6**, makin sulit secara bertahap.
- **Kartu perintah**: ⬆️ Maju, ⬇️ Mundur, ↩️ Belok Kanan, ↪️ Belok Kiri, 🔄 Balik Arah, ✋ Ambil, 🔁 Ulangi. Kartu baru muncul bertahap: Balik Arah (level 3), Mundur (4), Ulangi (5), Ambil + 🔑 kunci + 🚪 pintu (6).
- **Kunci, pintu, dan finish**: pintu terkunci sampai robot berdiri di kotak kunci dan memakai kartu ✋ Ambil. Level 5 membatasi 8 kartu supaya anak belajar memakai 🔁 Ulangi.
- **⏱️ Timer dan rekor waktu** per level, tampil di peta level dan popup.
- **⭐ Bintang dan papan peringkat** antar siswa.
- **🎬 Tutorial animasi** 12 slide dengan narasi suara bahasa Indonesia.
- **Dashboard Admin** (`/#/admin`): ringkasan, daftar siswa, riwayat main, ekspor CSV, kelola akun admin dan reset PIN siswa.
- **Dua mode penyimpanan**: database **Supabase** bila terhubung, jika tidak otomatis memakai `localStorage` di perangkat. Dashboard admin hanya bisa dipakai saat Supabase terhubung.

## 🚀 Menjalankan

```bash
npm install
npm run dev        # mode pengembangan (bisa dibuka dari HP lewat IP laptop)
npm run build      # hasil build ada di folder dist
npm run check      # memastikan semua level bisa diselesaikan
```

Tanpa Supabase, game tetap jalan dan skor tersimpan di browser (`localStorage`).

## 🗄️ Database dan Admin (Supabase)

Game memakai [Supabase](https://supabase.com) (PostgreSQL). Tabel dikunci, dan frontend hanya memanggil fungsi RPC berawalan `cb_` (misalnya `cb_login`, `cb_register`, `cb_admin_login`). Kunci **anon/publishable** memang boleh publik, tetapi **jangan pernah** memakai kunci `service_role` di frontend.

### 1. Siapkan project Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, lalu jalankan isi file [`supabase/schema.sql`](supabase/schema.sql). Ini membuat tabel `cb_admins`, `cb_config`, `cb_plays`, `cb_progress`, `cb_sessions`, `cb_students`, `cb_throttle` dan semua fungsi `cb_*`.
3. Buka **Project Settings → API**, lalu salin **Project URL** dan **anon/publishable key**.

### 2. Isi konfigurasi lokal

Salin `.env.example` menjadi `.env`, lalu isi:

```env
VITE_SUPABASE_URL=https://ID-PROJECT-KAMU.supabase.co
VITE_SUPABASE_ANON_KEY=kunci-anon-atau-publishable-kamu
```

File `.env` sudah ada di `.gitignore`, jadi tidak ikut ter-upload ke GitHub. Setelah mengubah `.env`, jalankan ulang `npm run dev`.

### 3. Buat admin pertama

1. Buka **Table Editor → `cb_admins`** di Supabase.
2. Tambahkan baris dengan `username` dan `password` (minimal 6 karakter).
3. Masuk lewat `http://localhost:5173/#/admin`. Admin lain bisa ditambahkan dari dalam dashboard.

Kode pemulihan untuk **"Lupa password?"** tersimpan di tabel `cb_config`, baris `recovery_code`.

### Cek koneksi

Buka DevTools (F12) → tab **Network**, lalu cari request `rpc/cb_ping`. Jawaban `{"ok":true}` berarti game terhubung ke Supabase. Jika dashboard admin menampilkan pesan *"Admin butuh database Supabase (tidak terhubung)"*, periksa isi `.env` (atau Environment Variables di Vercel) dan pastikan project Supabase tidak sedang dijeda (paused).

**Keamanan:** login admin dan PIN siswa dibatasi, salah beberapa kali akan dikunci sementara (tabel `cb_throttle`). Jangan membagikan kunci `service_role` dan password admin.

## 🌐 Deploy ke Vercel

1. Hubungkan repositori GitHub ke Vercel (Framework: **Vite**, Build: `npm run build`, Output: `dist`).
2. Buka **Settings → Environment Variables**, lalu tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Redeploy.** Variabel berawalan `VITE_` dimasukkan saat proses build, jadi deployment lama tidak akan membacanya.

Setiap `git push` ke branch `main` akan men-deploy ulang otomatis.

## 🔊 Suara narasi tutorial

Rekaman ada di `public/voice/01.mp3` sampai `12.mp3` (satu file per slide). Naskahnya ada di `NASKAH-SUARA.txt`. Untuk mengganti satu slide, rekam ulang, simpan dengan nama yang sama, lalu timpa filenya. Tanpa rekaman, tutorial memakai suara Indonesia bawaan perangkat.

## 🗂️ Struktur project

```
src/               kode game (React): game.js, Board, Tutorial, Admin, storage
public/voice/      rekaman narasi tutorial
scripts/           pembuat dan pemeriksa level
supabase/          skema database Supabase (schema.sql)
.env.example       contoh konfigurasi Supabase
```

> Catatan: `api.php`, `schema.php`, `setup.php`, `config.sample.php`, `database.sql`, dan proxy Laragon di `vite.config.js` adalah sisa versi lama (PHP + MySQL). Semuanya tidak dipakai lagi sejak database pindah ke Supabase.

## 👤 Pembuat

Dibuat oleh **MRikoKuswoyo** ([github.com/MRikoKuswoyo](https://github.com/MRikoKuswoyo)).

## ©️ Hak Cipta

Copyright © 2026 **MRikoKuswoyo**. Hak cipta dilindungi.

Seluruh kode, desain, tampilan, level, dan rekaman suara dalam repositori ini adalah karya MRikoKuswoyo. Dilarang menyalin, memperbanyak, memodifikasi, menjual, atau mendistribusikan ulang sebagian maupun seluruhnya tanpa izin tertulis dari pembuat. Penggunaan untuk pembelajaran pribadi di kelas diperbolehkan selama mencantumkan nama pembuat.
