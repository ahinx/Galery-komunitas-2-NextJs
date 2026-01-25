# 📸 Galeri Foto Komunitas - Blueprint 1.0

Aplikasi galeri foto berbasis Next.js dengan sistem audit siluman dan otoritas bertingkat.

## 🚀 Teknologi Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Database + Storage)
- **Auth**: WhatsApp OTP via Fonnte API
- **Deployment**: Cloudflare Pages

## 📋 Prasyarat

Pastikan sudah terinstal:

- Node.js 18+ ([Download](https://nodejs.org))
- npm atau yarn
- Git
- Supabase CLI ([Panduan](https://supabase.com/docs/guides/cli))

## 🛠️ Instalasi Langkah-demi-Langkah

### 1. Clone & Setup Proyek

```bash
# Buat folder proyek baru
npx create-next-app@latest galeri-foto-komunitas --typescript --tailwind --app

# Masuk ke folder proyek
cd galeri-foto-komunitas

# Install dependencies tambahan
npm install @supabase/supabase-js @supabase/ssr lucide-react browser-image-compression jszip clsx tailwind-merge react-dropzone exif-js
```

### 2. Setup Supabase

```bash
# Login ke Supabase
npx supabase login

# Inisialisasi Supabase di proyek
npx supabase init

# Link ke proyek Supabase Anda (atau buat baru di dashboard)
npx supabase link --project-ref your-project-ref
```

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root folder:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Fonnte API (WhatsApp Gateway)
FONNTE_TOKEN=your-fonnte-token

# Optional: untuk production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Cara mendapatkan kredensial:**

- Supabase: Dashboard → Settings → API
- Fonnte: [https://fonnte.com](https://fonnte.com) → Dapatkan token API

### 4. Migrasi Database

```bash
# Jalankan migrasi (akan dibuat di fase berikutnya)
npx supabase db push

# Atau untuk development lokal
npx supabase start
npx supabase db reset
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka browser: [http://localhost:3000](http://localhost:3000)

## 📁 Struktur Folder

```
galeri-foto-komunitas/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Route grup untuk autentikasi
│   │   ├── (dashboard)/    # Route grup untuk dashboard
│   │   ├── admin/          # Panel admin
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Komponen React reusable
│   │   ├── ui/            # Komponen UI dasar
│   │   ├── gallery/       # Komponen galeri
│   │   └── auth/          # Komponen autentikasi
│   ├── lib/               # Utility & helper functions
│   │   ├── supabase/      # Konfigurasi Supabase
│   │   ├── utils.ts       # Fungsi utility umum
│   │   └── constants.ts   # Konstanta aplikasi
│   ├── hooks/             # Custom React hooks
│   ├── actions/           # Server Actions
│   └── types/             # TypeScript type definitions
├── supabase/
│   └── migrations/        # SQL migration files
├── public/                # Static assets
└── .env.local            # Environment variables (JANGAN commit!)
```

## 🔐 Setup Admin Pertama

Setelah database siap, buat Super Admin pertama:

```sql
-- Jalankan di Supabase SQL Editor
UPDATE profiles
SET role = 'super_admin', is_approved = true, is_verified = true
WHERE phone_number = '+62812XXXXXXXX'; -- Ganti dengan nomor Anda
```

## 🚀 Deployment ke Cloudflare Pages

### Via GitHub

1. Push kode ke GitHub
2. Buka [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Pages → Create a project → Connect to Git
4. Pilih repository Anda
5. Build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output**: `.next`
6. Tambahkan Environment Variables (sama seperti `.env.local`)
7. Deploy!

### Via CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
npm run build
wrangler pages deploy .next
```

## 🧪 Testing

```bash
# Jalankan test (jika ada)
npm run test

# Lint kode
npm run lint

# Format kode
npm run format
```

## 📚 Fitur Utama

- ✅ Login WhatsApp OTP (tanpa password)
- ✅ Upload foto dengan kompresi otomatis
- ✅ Audit siluman (IP, device, EXIF)
- ✅ Sistem approval member
- ✅ Galeri responsif (Masonry Grid)
- ✅ Multi-select & bulk operations
- ✅ Soft-delete & permanent purge
- ✅ Dark/Light mode adaptif
- ✅ PWA ready

## 🐛 Troubleshooting

### Error: "Supabase client is not defined"

- Pastikan `.env.local` sudah benar
- Restart development server

### Error: "Fonnte API failed"

- Cek saldo & status token di dashboard Fonnte
- Pastikan nomor WhatsApp format internasional (+62...)

### Upload foto gagal

- Cek storage policy di Supabase
- Pastikan ukuran file < 5MB sebelum kompresi

## 📞 Support

Butuh bantuan? Kontak developer di:

- Email: dev@example.com
- WhatsApp: +62xxx (Super Admin)

## 📄 Lisensi

Proprietary - Blueprint 1.0 Master Edition
© 2024 Tim Developer

---

**Happy Coding! 🎉**

Lanjutkan ke Fase 2 untuk membuat database schema.
