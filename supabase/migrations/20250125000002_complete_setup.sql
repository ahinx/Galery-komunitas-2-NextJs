-- ============================================================================
-- MIGRASI DATABASE LENGKAP - Schema + Seed Data
-- File: supabase/migrations/20250125000000_complete_setup.sql
-- Deskripsi: Setup lengkap database galeri foto dengan initial users
-- UPDATED: Menggunakan format hash yang kompatibel dengan Node.js scrypt
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING OBJECTS (Clean Slate)
-- ============================================================================

DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.otp_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP FUNCTION IF EXISTS public.hash_password CASCADE;
DROP FUNCTION IF EXISTS public.verify_password CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_otp CASCADE;

-- ============================================================================
-- 2. CUSTOM TYPES
-- ============================================================================

CREATE TYPE public.user_role AS ENUM ('member', 'admin', 'super_admin');

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function untuk auto update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk cleanup expired OTP
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.otp_codes 
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. TABEL PROFILES
-- ============================================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informasi dasar
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Sistem otoritas
    role public.user_role NOT NULL DEFAULT 'member',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT phone_format CHECK (phone_number ~ '^\+62[0-9]{9,13}$'),
    CONSTRAINT name_not_empty CHECK (length(trim(full_name)) > 0),
    CONSTRAINT password_not_empty CHECK (length(password_hash) > 0)
);

-- Index untuk performa
CREATE INDEX idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX idx_profiles_name_lower ON public.profiles(lower(full_name));
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_pending ON public.profiles(is_approved, is_verified) 
    WHERE is_approved = FALSE AND is_verified = TRUE;

-- Trigger update timestamp
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 5. TABEL OTP_CODES
-- ============================================================================

CREATE TABLE public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    phone_number TEXT NOT NULL,
    otp_code CHAR(6) NOT NULL,
    
    -- Tipe OTP
    otp_type TEXT NOT NULL CHECK (otp_type IN ('registration', 'reset_password')),
    
    -- Status & expiry
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Metadata keamanan
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at > created_at),
    CONSTRAINT valid_attempts CHECK (attempt_count >= 0 AND attempt_count <= 5),
    CONSTRAINT valid_otp CHECK (otp_code ~ '^[0-9]{6}$')
);

-- Index
CREATE INDEX idx_otp_phone_type ON public.otp_codes(phone_number, otp_type);
CREATE INDEX idx_otp_expires ON public.otp_codes(expires_at) WHERE is_used = FALSE;

-- Trigger cleanup
CREATE TRIGGER trigger_cleanup_otp
    AFTER INSERT ON public.otp_codes
    EXECUTE FUNCTION public.cleanup_expired_otp();

-- ============================================================================
-- 6. TABEL PHOTOS
-- ============================================================================

CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relasi ke user
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- File info
    storage_path TEXT NOT NULL,
    display_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type TEXT NOT NULL,
    
    -- Soft delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id),
    
    -- Metadata
    audit_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    exif_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_delete CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL AND deleted_by IS NULL) OR
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

-- Index
CREATE INDEX idx_photos_user_active ON public.photos(user_id, created_at DESC) 
    WHERE is_deleted = FALSE;
CREATE INDEX idx_photos_deleted ON public.photos(is_deleted, deleted_at) 
    WHERE is_deleted = TRUE;
CREATE INDEX idx_photos_audit ON public.photos USING GIN (audit_metadata);
CREATE INDEX idx_photos_exif ON public.photos USING GIN (exif_data);

-- Trigger update timestamp
CREATE TRIGGER trigger_photos_updated_at
    BEFORE UPDATE ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PROFILES
-- ============================================================================

CREATE POLICY "select_own_profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "update_own_profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
        is_approved = (SELECT is_approved FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "admin_select_all_profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_update_profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "super_admin_all_profiles"
    ON public.profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - PHOTOS
-- ============================================================================

CREATE POLICY "select_own_photos"
    ON public.photos FOR SELECT
    USING (user_id = auth.uid() AND is_deleted = FALSE);

CREATE POLICY "insert_photos"
    ON public.photos FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_approved = TRUE AND is_verified = TRUE
        )
    );

CREATE POLICY "update_own_photos"
    ON public.photos FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "admin_select_all_photos"
    ON public.photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_update_photos"
    ON public.photos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "super_admin_delete_photos"
    ON public.photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - OTP (Service Role Only)
-- ============================================================================

CREATE POLICY "service_role_otp"
    ON public.otp_codes FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'photos',
    'photos',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (skip jika sudah ada)
DO $$
BEGIN
    -- Upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'authenticated_upload'
    ) THEN
        CREATE POLICY "authenticated_upload"
            ON storage.objects FOR INSERT
            WITH CHECK (
                bucket_id = 'photos' AND
                auth.role() = 'authenticated' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;
    
    -- Select policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'public_select'
    ) THEN
        CREATE POLICY "public_select"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'photos');
    END IF;
    
    -- Update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'owner_update'
    ) THEN
        CREATE POLICY "owner_update"
            ON storage.objects FOR UPDATE
            USING (
                bucket_id = 'photos' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;
    
    -- Delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'super_admin_delete'
    ) THEN
        CREATE POLICY "super_admin_delete"
            ON storage.objects FOR DELETE
            USING (
                bucket_id = 'photos' AND
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;
END $$;

-- ============================================================================
-- 9. SEED INITIAL USERS
-- ============================================================================
-- Password hash dibuat dengan Node.js scrypt
-- Format: salt:hash (hex encoded)
-- 
-- Untuk generate hash baru, jalankan di Node.js:
-- const crypto = require('crypto');
-- const salt = crypto.randomBytes(16).toString('hex');
-- crypto.scrypt('yourpassword', salt, 64, (err, key) => {
--     console.log(`${salt}:${key.toString('hex')}`);
-- });
-- ============================================================================

-- Pre-generated hashes untuk password default:
-- Password: 123456
-- Password: admin123  
-- Password: member123

INSERT INTO public.profiles (
    full_name, phone_number, password_hash, role, is_verified, is_approved
) VALUES 
    -- Super Admin (password: 123456)
    (
        'ahink',
        '+6285157300793',
        'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85536b7af5bc909c4e1e4f7c9f8e6d5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3',
        'super_admin',
        TRUE,
        TRUE
    ),
    -- Admin (password: admin123)
    (
        'febri',
        '+6285124616060',
        'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4:d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1',
        'admin',
        TRUE,
        TRUE
    ),
    -- Member (password: member123)
    (
        'Member',
        '+6285124616050',
        'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5:c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6',
        'member',
        TRUE,
        TRUE
    )
ON CONFLICT (phone_number) DO NOTHING;

-- ============================================================================
-- VERIFIKASI
-- ============================================================================

SELECT 
    full_name,
    phone_number,
    role,
    is_verified,
    is_approved,
    created_at
FROM public.profiles
ORDER BY 
    CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 3
    END;

-- ============================================================================
-- CATATAN PENTING:
-- ============================================================================
-- Password hash di atas adalah PLACEHOLDER!
-- 
-- Untuk production, Anda harus:
-- 1. Jalankan aplikasi Next.js
-- 2. Gunakan endpoint atau script untuk membuat user dengan password yang di-hash
--    oleh aplikasi (menggunakan Node.js crypto scrypt)
-- 3. Atau gunakan script generate-hash.js di bawah ini
--
-- Alternatif: Buat user pertama via aplikasi (register), 
-- lalu update role-nya ke super_admin via SQL:
--
-- UPDATE public.profiles 
-- SET role = 'super_admin', is_approved = TRUE 
-- WHERE phone_number = '+6285157300793';
-- ============================================================================