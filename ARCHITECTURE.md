# 🏗️ System Architecture - Blueprint 1.0

Dokumentasi arsitektur lengkap aplikasi Galeri Foto Komunitas.

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │ Mobile PWA   │  │   Desktop    │      │
│  │  (Chrome,    │  │  (Android,   │  │   (macOS,    │      │
│  │   Safari)    │  │    iOS)      │  │   Windows)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              App Router (RSC)                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │   Pages    │  │  Layouts   │  │   API      │     │   │
│  │  │  (Routes)  │  │ (Shared UI)│  │  Routes    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Server Actions (Mutations)                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │   Auth   │  │  Photos  │  │  Admin   │           │   │
│  │  │ Actions  │  │ Actions  │  │ Actions  │           │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │   │
│  └───────┼─────────────┼─────────────┼──────────────────┘   │
└──────────┼─────────────┼─────────────┼──────────────────────┘
           │             │             │
           ↓             ↓             ↓
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   PostgreSQL                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ profiles │  │  photos  │  │otp_codes │           │   │
│  │  │  (RLS)   │  │  (RLS)   │  │  (RLS)   │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Storage Bucket                     │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │            photos/ (public)                  │    │   │
│  │  │  - user_id/filename.webp                     │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Fonnte API (WhatsApp Gateway)                      │   │
│  │   - Send OTP messages                                │   │
│  │   - Notifications                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────┐
│       profiles          │
├─────────────────────────┤
│ id (PK)                 │
│ full_name               │
│ phone_number (UNIQUE)   │
│ role (ENUM)             │
│ is_verified             │
│ is_approved             │
│ created_at              │
│ updated_at              │
│ last_login              │
└────────┬────────────────┘
         │ 1
         │
         │ N
         ↓
┌─────────────────────────┐
│        photos           │
├─────────────────────────┤
│ id (PK)                 │
│ user_id (FK)            │────┐
│ storage_path            │    │
│ display_url             │    │ References
│ file_name               │    │
│ file_size               │    │
│ mime_type               │    │
│ is_deleted              │    │
│ deleted_at              │    │
│ deleted_by (FK)         │────┘
│ audit_metadata (JSONB)  │
│ exif_data (JSONB)       │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌─────────────────────────┐
│       otp_codes         │
├─────────────────────────┤
│ id (PK)                 │
│ phone_number            │
│ otp_code                │
│ is_used                 │
│ expires_at              │
│ created_at              │
│ used_at                 │
│ attempt_count           │
└─────────────────────────┘
```

### Key Relationships

- `profiles.id` → `photos.user_id` (1:N)
- `profiles.id` → `photos.deleted_by` (1:N)

---

## 🔐 Security Architecture

### Authentication Flow

```
User → Enter Phone
  ↓
Generate OTP (6 digits)
  ↓
Store in otp_codes table (expires: 5 min)
  ↓
Send via Fonnte API → WhatsApp
  ↓
User enters OTP
  ↓
Verify OTP (check: code, expiry, attempts)
  ↓
Valid? → Create/Update profile
  ↓
Set session cookie (user_id)
  ↓
Redirect based on approval status
```

### Authorization Layers

**Layer 1: Middleware**

- Check session cookie
- Redirect unauthorized users

**Layer 2: Page Level**

- Server Component checks
- getCurrentUser()
- Role-based redirects

**Layer 3: Database (RLS)**

- Row-level policies
- Automatic filtering
- Role-based access

**Layer 4: Server Actions**

- Validation
- Authorization checks
- Business logic enforcement

### Row Level Security Policies

```sql
-- Example: Member can only view own photos
CREATE POLICY "view_own_photos"
ON photos FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND is_deleted = FALSE
);

-- Admin can view all photos
CREATE POLICY "admin_view_all"
ON photos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

## 📁 File Upload Architecture

### Upload Flow

```
1. Client Side:
   ┌─────────────────────────┐
   │ User selects file(s)    │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │ Validate file type      │
   │ Validate file size      │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │ Compress image          │
   │ (browser-image-comp.)   │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │ Extract EXIF data       │
   │ (exif-js)               │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │ Send to Server Action   │
   └───────────┬─────────────┘
               │
2. Server Side: ↓
   ┌─────────────────────────┐
   │ Capture metadata        │
   │ (IP, User-Agent, etc)   │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │ Upload to Storage       │
   │ (Supabase Storage)      │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │ Insert to database      │
   │ (photos table)          │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │ Return success/error    │
   └─────────────────────────┘
```

### Storage Structure

```
Supabase Storage Bucket: photos/
│
├── user_id_1/
│   ├── 1234567890-abc123.webp
│   ├── 1234567891-def456.webp
│   └── ...
│
├── user_id_2/
│   ├── 1234567892-ghi789.webp
│   └── ...
│
└── ...
```

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App Layout
│
├── Auth Pages
│   ├── Login
│   ├── VerifyOTP
│   └── WaitingRoom
│
├── Dashboard
│   ├── Navigation
│   ├── Stats
│   └── PhotoGrid
│       └── PhotoCard (multiple)
│
├── Upload
│   └── DropZone
│       └── FilePreview (multiple)
│
├── Admin
│   ├── Stats
│   └── ApprovalCard (multiple)
│
└── Trash (Super Admin)
    └── TrashGrid
        └── TrashCard (multiple)
```

### State Management

**Server State:**

- Managed by React Server Components
- Fetched via Server Actions
- Automatic revalidation

**Client State:**

- React useState for UI state
- No global state management needed
- Form state via native FormData

**URL State:**

- Search params for filters
- Route params for IDs

---

## 🔄 Data Flow Patterns

### Server → Client

```typescript
// Server Component
async function PhotoGallery() {
  const photos = await getPhotos(); // Server Action

  return <PhotoGrid photos={photos} />; // Pass to Client
}

// Client Component
("use client");
function PhotoGrid({ photos }) {
  const [selected, setSelected] = useState([]);
  // Client-side interactivity
}
```

### Client → Server

```typescript
// Client Component
"use client";
function UploadForm() {
  const handleSubmit = async (formData) => {
    const result = await uploadPhoto(formData); // Server Action
    if (result.success) {
      router.refresh(); // Revalidate
    }
  };
}
```

### Optimistic Updates

```typescript
"use client";
function PhotoCard({ photo }) {
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = async () => {
    setIsDeleted(true); // Optimistic

    const result = await deletePhoto(photo.id);

    if (!result.success) {
      setIsDeleted(false); // Rollback
    }
  };
}
```

---

## 🚀 Performance Optimizations

### Image Optimization

1. **Client-side compression** before upload
2. **WebP conversion** on Supabase
3. **Next.js Image component** for rendering
4. **Lazy loading** with Intersection Observer
5. **Responsive images** with srcset

### Database Optimizations

1. **Indexes** on frequently queried columns
2. **Pagination** for large datasets
3. **Selective queries** (only needed columns)
4. **RLS** for automatic filtering

### Caching Strategy

```
┌──────────────────────────────────┐
│        Browser Cache             │
│  - Static assets (24h)           │
│  - Images (7 days)               │
└───────────┬──────────────────────┘
            ↓
┌──────────────────────────────────┐
│         CDN Cache                │
│  - Cloudflare/Vercel Edge        │
│  - Static files (immutable)      │
└───────────┬──────────────────────┘
            ↓
┌──────────────────────────────────┐
│      Next.js Cache               │
│  - Static Generation             │
│  - Incremental Static Regen      │
└───────────┬──────────────────────┘
            ↓
┌──────────────────────────────────┐
│      Database Query              │
│  - Supabase Connection Pooling   │
└──────────────────────────────────┘
```

---

## 📊 Monitoring & Observability

### Logging Strategy

```typescript
// Server Actions
export async function uploadPhoto(formData) {
  console.log("📸 Upload started:", {
    userId: user.id,
    fileName: file.name,
    fileSize: file.size
  });

  try {
    // Upload logic
    console.log("✅ Upload success:", photoId);
  } catch (error) {
    console.error("❌ Upload failed:", error);
  }
}
```

### Error Tracking

- **Server Errors:** Logged to console (captured by hosting provider)
- **Client Errors:** React Error Boundaries
- **Database Errors:** Supabase logs
- **External API Errors:** Try-catch with fallbacks

### Performance Metrics

Track:

- Page load time
- Image load time
- Upload duration
- Database query time

---

## 🔧 Development Workflow

### Git Flow

```
main (production)
  ↑
develop (staging)
  ↑
feature/new-feature (development)
```

### CI/CD Pipeline

```
Git Push
  ↓
GitHub Actions
  ├── Lint
  ├── Type Check
  └── Build
      ↓
  Deploy to Preview
      ↓
  Manual Approval
      ↓
  Deploy to Production
```

---

## 📦 Deployment Architecture

### Cloudflare Pages

```
GitHub Repo
  ↓
Cloudflare Build
  ├── npm install
  ├── npm run build
  └── Static Generation
      ↓
Cloudflare Edge Network (CDN)
  ↓
User
```

### Environment Separation

```
Development
├── localhost:3000
├── .env.local
└── Supabase Dev Project

Staging
├── staging.yourdomain.com
├── Env vars in Cloudflare
└── Supabase Staging Project

Production
├── yourdomain.com
├── Env vars in Cloudflare
└── Supabase Production Project
```

---

## 🎯 Scalability Considerations

### Horizontal Scaling

- **Frontend:** Auto-scaled by Cloudflare/Vercel
- **Database:** Supabase connection pooling
- **Storage:** CDN distribution

### Vertical Scaling

- **Database:** Supabase upgrade plans
- **Compute:** Serverless auto-scaling

### Future Optimizations

1. **Redis Cache** for frequently accessed data
2. **Background Jobs** for heavy processing
3. **Queue System** for bulk uploads
4. **CDN** for global image delivery

---

**Blueprint 1.0 Architecture - Designed for Scale** 🚀
