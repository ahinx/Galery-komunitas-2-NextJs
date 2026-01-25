# 🚀 Panduan Deployment Production - Blueprint 1.0

## 📋 Daftar Isi

1. [Persiapan Pre-Deploy](#persiapan-pre-deploy)
2. [Deploy ke Cloudflare Pages](#cloudflare-pages)
3. [Deploy ke Vercel](#vercel)
4. [Deploy ke VPS/Server](#vps-server)
5. [Post-Deployment Setup](#post-deployment)

---

## ✅ Persiapan Pre-Deploy

### 1. Checklist Sebelum Deploy

- [ ] Semua environment variables sudah diset
- [ ] Database migration sudah di-push ke Supabase production
- [ ] Fonnte API token sudah valid dan aktif
- [ ] Storage bucket sudah dibuat di Supabase
- [ ] RLS policies sudah di-enable
- [ ] Super Admin pertama sudah dibuat
- [ ] Build local berhasil tanpa error
- [ ] Type checking passed (`npm run type-check`)
- [ ] Linting passed (`npm run lint`)

### 2. Build Test

```bash
# Test build production
npm run build

# Test production build locally
npm run start
```

### 3. Environment Variables Production

Pastikan semua env vars sudah siap:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
FONNTE_TOKEN=xxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## 🌐 Deploy ke Cloudflare Pages

### Langkah 1: Push ke GitHub

```bash
# Initialize git (jika belum)
git init
git add .
git commit -m "Initial commit - Blueprint 1.0"

# Push ke GitHub
git remote add origin https://github.com/username/repo-name.git
git branch -M main
git push -u origin main
```

### Langkah 2: Connect ke Cloudflare

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih **Pages** > **Create a project**
3. Connect to Git > Pilih GitHub repository
4. **Build settings:**
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Root directory: `/` (atau sesuai struktur)

### Langkah 3: Environment Variables

Di Cloudflare Pages Settings > Environment variables, tambahkan:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
FONNTE_TOKEN
NEXT_PUBLIC_APP_URL
NODE_ENV=production
```

### Langkah 4: Deploy

- Klik **Save and Deploy**
- Tunggu build selesai (3-5 menit)
- Domain otomatis: `project-name.pages.dev`

### Langkah 5: Custom Domain (Opsional)

1. Pages > Custom domains > **Set up a custom domain**
2. Masukkan domain Anda (contoh: `galeri.yourdomain.com`)
3. Ikuti instruksi DNS setup
4. Tunggu propagasi (5-10 menit)

---

## ▲ Deploy ke Vercel

### Cara 1: Via Dashboard (Recommended)

1. Login ke [Vercel Dashboard](https://vercel.com)
2. **Import Project** > Connect Git Repository
3. Pilih repository GitHub
4. Framework Preset: **Next.js** (auto-detect)
5. Environment Variables: Add semua env vars
6. **Deploy**

### Cara 2: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add FONNTE_TOKEN production
```

### Custom Domain

1. Settings > Domains > **Add Domain**
2. Masukkan domain Anda
3. Update DNS records sesuai instruksi
4. Wait for DNS propagation

---

## 🖥️ Deploy ke VPS/Server (Docker)

### Langkah 1: Buat Dockerfile

```dockerfile
# File: Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy .env.local for build
COPY .env.local .env.local

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Langkah 2: Docker Compose

```yaml
# File: docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - FONNTE_TOKEN=${FONNTE_TOKEN}
      - NODE_ENV=production
    restart: unless-stopped
```

### Langkah 3: Deploy ke Server

```bash
# Di server
git clone https://github.com/username/repo-name.git
cd repo-name

# Copy environment variables
nano .env.local
# Paste env vars

# Build dan run
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Langkah 4: Nginx Reverse Proxy

```nginx
# File: /etc/nginx/sites-available/galeri
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/galeri /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com
```

---

## 🔧 Post-Deployment Setup

### 1. Buat Super Admin Pertama

```sql
-- Jalankan di Supabase SQL Editor
UPDATE profiles
SET role = 'super_admin',
    is_approved = true,
    is_verified = true
WHERE phone_number = '+628123456789'; -- Ganti dengan nomor Anda
```

### 2. Test Functionality

Checklist testing:

- [ ] Login dengan WhatsApp OTP berfungsi
- [ ] Approval member baru berfungsi
- [ ] Upload foto berhasil dengan kompresi
- [ ] EXIF data tersimpan
- [ ] Audit metadata tercapture
- [ ] Soft delete berfungsi
- [ ] Permanent delete (Super Admin) berfungsi
- [ ] Download ZIP berfungsi
- [ ] Responsive di mobile & desktop
- [ ] Dark mode berfungsi

### 3. Monitor Performance

```bash
# Check logs (Cloudflare)
Cloudflare Dashboard > Pages > Your Project > Logs

# Check logs (Vercel)
Vercel Dashboard > Project > Logs

# Check logs (VPS)
docker-compose logs -f
```

### 4. Backup Strategy

**Supabase Auto Backup:**

- Supabase Pro: Daily automated backups
- Download backup: Dashboard > Database > Backups

**Manual Backup:**

```bash
# Backup database
supabase db dump -f backup.sql

# Restore
psql -h db.xxx.supabase.co -U postgres -d postgres -f backup.sql
```

### 5. Monitoring & Analytics (Opsional)

**Setup Sentry (Error Tracking):**

```bash
npm install @sentry/nextjs

# Jalankan wizard
npx @sentry/wizard@latest -i nextjs
```

**Setup Google Analytics:**

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🔒 Security Checklist

- [ ] Environment variables aman (tidak di-commit)
- [ ] HTTPS aktif (SSL certificate)
- [ ] RLS policies sudah di-enable
- [ ] Rate limiting di Supabase aktif
- [ ] CORS settings sudah benar
- [ ] API keys tidak exposed di client
- [ ] File upload validation aktif
- [ ] XSS protection aktif
- [ ] CSRF protection aktif

---

## 📱 PWA Setup (Optional)

Install next-pwa:

```bash
npm install next-pwa
```

Buat `public/manifest.json`:

```json
{
  "name": "Galeri Foto Komunitas",
  "short_name": "Galeri",
  "description": "Aplikasi galeri foto dengan sistem audit",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🎉 Done!

Aplikasi Anda sudah live! 🚀

**Next Steps:**

1. Share link ke tim
2. Test semua fitur di production
3. Monitor error logs
4. Setup backup rutin
5. Plan untuk fitur v2.0

**Support:**

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)

---

**Blueprint 1.0 - Master Edition** ✨
