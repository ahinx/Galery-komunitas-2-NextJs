# ⚡ Quick Start Guide - 15 Menit Setup!

## 🎯 Target: Aplikasi Running dalam 15 Menit

Ikuti langkah-langkah ini secara berurutan untuk setup cepat.

---

## 📦 Step 1: Create Project (2 menit)

```bash
# Buat project Next.js
npx create-next-app@latest galeri-foto-komunitas --typescript --tailwind --app --src-dir

cd galeri-foto-komunitas

# Install semua dependencies
npm install @supabase/supabase-js @supabase/ssr lucide-react browser-image-compression jszip clsx tailwind-merge react-dropzone exif-js
```

---

## 📁 Step 2: Setup File Structure (1 menit)

```bash
# Buat folder structure
mkdir -p src/app/\(auth\)/{login,verify-otp,waiting-room}
mkdir -p src/app/{admin,dashboard,upload,trash}
mkdir -p src/app/api/auth/logout
mkdir -p src/components/{admin,gallery,trash,upload}
mkdir -p src/lib/supabase
mkdir -p src/actions
mkdir -p supabase/migrations
```

---

## 📄 Step 3: Copy File dari Artifact (5 menit)

**PENTING:** Copy semua file yang sudah saya buat di atas ke lokasi yang tepat:

### Root Files:

- `middleware.ts` → root folder
- `next.config.js` → root folder
- `tailwind.config.ts` → root folder
- `tsconfig.json` → root folder
- `.env.example` → root folder
- `.gitignore` → root folder
- `package.json` → merge dengan existing
- `README.md` → root folder
- `DEPLOYMENT.md` → root folder
- `CHECKLIST.md` → root folder
- `QUICKSTART.md` → root folder (file ini)

### App Files:

- Semua file di `app/` folder sesuai struktur
- `app/layout.tsx`
- `app/globals.css`
- `app/(auth)/login/page.tsx`
- `app/(auth)/verify-otp/page.tsx`
- `app/(auth)/waiting-room/page.tsx`
- `app/dashboard/page.tsx`
- `app/upload/page.tsx`
- `app/admin/page.tsx`
- `app/trash/page.tsx`
- `app/api/auth/logout/route.ts`

### Components:

- `components/admin/ApprovalCard.tsx`
- `components/gallery/PhotoCard.tsx`
- `components/gallery/PhotoGrid.tsx`
- `components/trash/TrashGrid.tsx`
- `components/upload/DropZone.tsx`

### Lib & Actions:

- `lib/supabase/client.ts`
- `lib/constants.ts`
- `lib/utils.ts`
- `lib/image-compression.ts`
- `lib/exif-extractor.ts`
- `actions/auth.ts`
- `actions/photos.ts`
- `actions/admin.ts`

### Database:

- `supabase/migrations/20240101000000_init_schema.sql`

---

## 🗄️ Step 4: Setup Supabase (3 menit)

### A. Buat Project Supabase

1. Buka [https://supabase.com](https://supabase.com)
2. Create New Project
3. Tunggu project selesai dibuat (2-3 menit)

### B. Install Supabase CLI

```bash
npm install -g supabase
```

### C. Link Project

```bash
# Login
supabase login

# Link (akan buka browser)
supabase link --project-ref YOUR_PROJECT_REF

# Push migration
supabase db push
```

### D. Get Credentials

1. Buka Supabase Dashboard
2. Settings > API
3. Copy:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## 📱 Step 5: Setup Fonnte (2 menit)

### A. Daftar Fonnte

1. Buka [https://fonnte.com](https://fonnte.com)
2. Daftar/Login
3. Top up saldo minimal Rp 50.000

### B. Get Token

1. Dashboard > Device
2. Copy API Token

---

## ⚙️ Step 6: Environment Setup (1 menit)

```bash
# Copy .env.example
cp .env.example .env.local

# Edit dengan kredensial Anda
nano .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
FONNTE_TOKEN=xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 👤 Step 7: Buat Super Admin (1 menit)

```sql
-- Buka Supabase SQL Editor
-- Jalankan query ini (ganti nomor dengan nomor Anda):

INSERT INTO profiles (full_name, phone_number, role, is_verified, is_approved)
VALUES (
  'Super Admin',
  '+6281234567890',  -- GANTI dengan nomor WA Anda
  'super_admin',
  true,
  true
);
```

---

## 🚀 Step 8: Run Development! (30 detik)

```bash
npm run dev
```

Buka: [http://localhost:3000](http://localhost:3000)

---

## ✅ Testing Flow (Quick Test)

### 1. Test Login

1. Buka `http://localhost:3000/login`
2. Masukkan nama dan nomor WA (yang sudah jadi Super Admin)
3. Klik "Kirim Kode OTP"
4. Cek WhatsApp, copy kode OTP
5. Masukkan di halaman verifikasi
6. Jika berhasil → masuk ke Dashboard! 🎉

### 2. Test Upload

1. Klik "Upload" di navigation
2. Drag & drop foto atau klik untuk pilih
3. Klik "Upload"
4. Cek dashboard → foto muncul! 📸

### 3. Test Admin

1. Buka `/admin`
2. Lihat statistics
3. Test approve user baru

---

## 🐛 Quick Troubleshooting

### Masalah: OTP Tidak Terkirim

```bash
# Cek:
1. Saldo Fonnte cukup?
2. Token benar?
3. Nomor format: +62xxx (international)
```

### Masalah: Error Build

```bash
# Fix:
npm install --legacy-peer-deps
rm -rf node_modules .next
npm install
npm run dev
```

### Masalah: Database Error

```bash
# Reset database:
supabase db reset
# Ini akan re-run migration
```

---

## 📚 Next Steps

Setelah aplikasi running:

1. **Baca CHECKLIST.md** untuk testing lengkap
2. **Baca DEPLOYMENT.md** untuk deploy ke production
3. **Baca README.md** untuk dokumentasi detail

---

## 💡 Pro Tips

1. **Development:** Gunakan 2 browser (Chrome untuk admin, Safari untuk user biasa)
2. **Testing:** Gunakan nomor WA berbeda untuk test approval flow
3. **Debug:** Check console logs untuk error details
4. **Database:** Gunakan Supabase Table Editor untuk lihat data real-time

---

## 🎉 Selamat!

Aplikasi Anda sudah running! Lanjutkan dengan:

- Customize styling sesuai brand
- Tambah fitur sesuai kebutuhan
- Deploy ke production (lihat DEPLOYMENT.md)

**Need Help?**

- Check CHECKLIST.md untuk troubleshooting
- Lihat comment di kode untuk penjelasan
- Read documentation di README.md

---

**Blueprint 1.0 - Ready to Rock! 🚀**
