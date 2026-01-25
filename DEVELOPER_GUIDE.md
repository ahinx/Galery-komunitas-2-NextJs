# 👨‍💻 Developer Guide - Blueprint 1.0

Panduan lengkap untuk developer yang akan maintain atau develop fitur baru.

---

## 📐 Arsitektur Aplikasi

### Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Auth:** Custom (WhatsApp OTP via Fonnte)
- **State Management:** React Server Components + Server Actions

### Folder Structure Philosophy

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth flow (grouped route)
│   ├── (dashboard)/       # Protected routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── [feature]/        # Feature-specific components
├── lib/                   # Utilities & configs
│   ├── supabase/         # Supabase client
│   └── *.ts              # Helper functions
└── actions/              # Server Actions (mutations)
```

**Prinsip:**

- **Colocation:** Components dekat dengan page yang menggunakannya
- **Separation of Concerns:** Logic (actions) terpisah dari UI (components)
- **Type Safety:** Semuanya fully typed

---

## 🔄 Data Flow

### Authentication Flow

```
1. User input nomor WA → sendOTP (Server Action)
2. Fonnte API → kirim OTP ke WA
3. User input OTP → verifyOTP (Server Action)
4. Create/update profile → Set cookie session
5. Redirect based on approval status
```

### Upload Flow

```
1. User select file → Client validation
2. Compress image (client-side)
3. Extract EXIF data (client-side)
4. uploadPhoto (Server Action)
5. Capture metadata siluman (server-side)
6. Upload to Supabase Storage
7. Insert record to database
8. Return success/error
```

### Query Flow (Gallery)

```
1. Page load → getPhotos (Server Action)
2. Apply RLS policies (database level)
3. Return filtered photos
4. Render PhotoGrid component
5. Client-side interactions (select, download)
```

---

## 🛠️ Key Concepts

### 1. Row Level Security (RLS)

**Konsep:** Access control di database level, bukan application level.

**Contoh:**

```sql
-- Member hanya bisa lihat foto sendiri
CREATE POLICY "Users can view own photos"
ON photos FOR SELECT
USING (user_id = auth.uid() AND is_deleted = FALSE);

-- Admin bisa lihat semua
CREATE POLICY "Admins can view all photos"
ON photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

**Why?**

- Security di database level
- Tidak perlu logic check di application
- Scalable & performant

### 2. Server Actions

**Konsep:** Server-side functions yang bisa dipanggil dari client.

**Contoh:**

```typescript
"use server";

export async function uploadPhoto(formData: FormData) {
  // Validation
  // Database operations
  // Return result
}
```

**Benefits:**

- No need API routes
- Type-safe
- Automatic serialization
- Better DX

### 3. Silent Audit

**Konsep:** Capture metadata tanpa user sadar.

**Implementation:**

```typescript
async function captureUploadMetadata() {
  const headersList = await headers();

  return {
    upload_ip: headersList.get("x-forwarded-for"),
    user_agent: headersList.get("user-agent"),
    device_type: detectDevice(userAgent),
    captured_at: new Date().toISOString()
  };
}
```

**Data Captured:**

- IP address
- User agent
- Device type
- Upload timestamp
- EXIF data (jika ada)

### 4. Soft Delete Pattern

**Konsep:** Tidak hapus data secara permanen, hanya flag.

```typescript
// Soft delete
await supabase
  .from("photos")
  .update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    deleted_by: user.id
  })
  .eq("id", photoId);

// Permanent delete (Super Admin only)
await supabase.from("photos").delete().eq("id", photoId);
```

**Benefits:**

- Data recovery possible
- Audit trail
- Compliance

---

## 🔐 Security Best Practices

### 1. Environment Variables

```typescript
// ❌ JANGAN
const apiKey = "hardcoded-key";

// ✅ LAKUKAN
const apiKey = process.env.FONNTE_TOKEN;
if (!apiKey) throw new Error("Missing FONNTE_TOKEN");
```

### 2. Input Validation

```typescript
// ❌ JANGAN
async function uploadPhoto(file: File) {
  // Langsung upload tanpa validasi
}

// ✅ LAKUKAN
async function uploadPhoto(file: File) {
  if (!isImageFile(file)) {
    return { success: false, message: "Invalid file type" };
  }

  if (!isValidFileSize(file, 10)) {
    return { success: false, message: "File too large" };
  }

  // Upload
}
```

### 3. Authorization Checks

```typescript
// ❌ JANGAN
async function deletePhoto(photoId: string) {
  // Langsung delete tanpa check ownership
  await supabase.from("photos").delete().eq("id", photoId);
}

// ✅ LAKUKAN
async function deletePhoto(photoId: string) {
  const user = await getCurrentUser();

  if (user.role !== "super_admin") {
    // Check ownership
    const { data: photo } = await supabase
      .from("photos")
      .select("user_id")
      .eq("id", photoId)
      .single();

    if (photo.user_id !== user.id) {
      return { success: false, message: "Unauthorized" };
    }
  }

  // Delete
}
```

### 4. SQL Injection Prevention

```typescript
// ❌ JANGAN (raw SQL)
const query = `SELECT * FROM users WHERE phone = '${phone}'`;

// ✅ LAKUKAN (Supabase query builder)
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("phone_number", phone);
```

---

## 🎨 Styling Guidelines

### Tailwind Best Practices

```tsx
// ❌ Avoid magic values
<div className="mt-4 mb-8 px-6" />

// ✅ Use consistent spacing
<div className="space-y-6 px-4" />

// ❌ Long className
<button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" />

// ✅ Use component patterns
<button className="btn btn-primary" />

// atau extract to component:
<Button variant="primary">Click me</Button>
```

### Dark Mode

```tsx
// Selalu sediakan dark mode variant
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-white">Text</p>
</div>
```

### Responsive Design

```tsx
// Mobile-first approach
<div className="
  grid
  grid-cols-2      /* mobile: 2 columns */
  md:grid-cols-3   /* tablet: 3 columns */
  lg:grid-cols-4   /* desktop: 4 columns */
  gap-4
">
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist

```bash
# Auth Flow
- [ ] Login dengan nomor valid
- [ ] Login dengan nomor invalid
- [ ] OTP timeout
- [ ] OTP invalid
- [ ] Approval flow

# Upload Flow
- [ ] Upload file valid
- [ ] Upload file > 10MB
- [ ] Upload non-image file
- [ ] Kompresi berfungsi
- [ ] EXIF extraction

# Gallery
- [ ] Photos load correctly
- [ ] Masonry layout responsive
- [ ] Sticky headers
- [ ] Multi-select
- [ ] Download ZIP

# Admin
- [ ] Approve user
- [ ] Ban user
- [ ] View all photos

# Super Admin
- [ ] Access trash
- [ ] Restore photo
- [ ] Permanent delete
```

### Unit Testing (Future)

```typescript
// Example test structure
describe("uploadPhoto", () => {
  it("should reject files larger than 10MB", async () => {
    const largeFile = createMockFile(11 * 1024 * 1024);
    const result = await uploadPhoto(largeFile);
    expect(result.success).toBe(false);
  });

  it("should compress images before upload", async () => {
    const file = createMockFile(5 * 1024 * 1024);
    const compressed = await compressImage(file);
    expect(compressed.size).toBeLessThan(file.size);
  });
});
```

---

## 📊 Performance Optimization

### 1. Image Optimization

```tsx
// ✅ Use Next.js Image
import Image from "next/image";

<Image
  src={photo.url}
  alt={photo.name}
  fill
  sizes="(max-width: 768px) 50vw, 33vw"
  className="object-cover"
/>;

// Benefits:
// - Automatic WebP conversion
// - Lazy loading
// - Responsive images
```

### 2. Database Indexing

```sql
-- Index frequently queried columns
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_created ON photos(created_at DESC);
CREATE INDEX idx_photos_user_active ON photos(user_id, is_deleted)
  WHERE is_deleted = FALSE;
```

### 3. Query Optimization

```typescript
// ❌ N+1 Query Problem
for (const photo of photos) {
  const user = await supabase
    .from("profiles")
    .select("*")
    .eq("id", photo.user_id)
    .single();
}

// ✅ Use JOIN
const { data: photos } = await supabase
  .from("photos")
  .select("*, profile:profiles(*)");
```

### 4. Pagination

```typescript
// Implement pagination for large datasets
const { data, count } = await supabase
  .from("photos")
  .select("*", { count: "exact" })
  .range(offset, offset + limit - 1);
```

---

## 🐛 Common Issues & Solutions

### Issue: "Hydration Error"

**Penyebab:** Mismatch antara server & client render

**Solusi:**

```tsx
// Use suppressHydrationWarning
<html lang="id" suppressHydrationWarning>

// Or use client-only rendering
'use client'
import { useEffect, useState } from 'react'
```

### Issue: "Module not found: Can't resolve '@/...'"

**Penyebab:** Path alias tidak terkonfigurasi

**Solusi:** Check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Slow Upload

**Penyebab:** File size terlalu besar

**Solusi:**

```typescript
// Increase compression
const options = {
  maxSizeMB: 0.5, // More aggressive
  maxWidthOrHeight: 1200 // Smaller
};
```

---

## 🚀 Adding New Features

### Example: Add Photo Comments

**1. Database Migration**

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "Users can view comments"
ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**2. Server Action**

```typescript
// actions/comments.ts
"use server";

export async function addComment(
  photoId: string,
  content: string
): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await supabase.from("comments").insert({
    photo_id: photoId,
    user_id: user.id,
    content
  });

  if (error) {
    return { success: false, message: "Failed to add comment" };
  }

  return { success: true, message: "Comment added" };
}
```

**3. Component**

```tsx
// components/comments/CommentForm.tsx
"use client";

import { addComment } from "@/actions/comments";

export default function CommentForm({ photoId }: { photoId: string }) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const content = formData.get("content") as string;

    const result = await addComment(photoId, content);
    if (result.success) {
      // Success handling
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="content" required />
      <button type="submit">Post Comment</button>
    </form>
  );
}
```

---

## 📚 Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Tools

- [Supabase Studio](https://app.supabase.com)
- [VSCode Extensions](https://marketplace.visualstudio.com)
  - Tailwind CSS IntelliSense
  - Prettier
  - ESLint
  - TypeScript Error Translator

### Community

- Next.js Discord
- Supabase Discord
- r/nextjs
- Stack Overflow

---

## 🎯 Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Start development
npm run dev

# 4. Test changes
npm run type-check
npm run lint

# 5. Commit
git add .
git commit -m "feat: add new feature"

# 6. Push
git push origin feature/new-feature

# 7. Create PR
```

### Code Review Checklist

- [ ] TypeScript errors cleared
- [ ] No console.log in production code
- [ ] Comments added for complex logic
- [ ] Error handling implemented
- [ ] Mobile responsive
- [ ] Dark mode supported
- [ ] Performance optimized

---

**Happy Coding! 🚀**

Questions? Check other docs:

- QUICKSTART.md - Setup guide
- CHECKLIST.md - Testing guide
- DEPLOYMENT.md - Deployment guide
