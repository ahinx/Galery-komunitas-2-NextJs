-- ============================================================================
-- INIT SCHEMA LENGKAP (FIXED RECURSION + AVATAR SUPPORT)
-- File: init_schema.sql
-- Deskripsi: Setup database dari nol dengan keamanan anti-looping & fitur avatar
-- ============================================================================

-- ============================================================================
-- 1. BERSIHKAN DATABASE (DROP ALL)
-- ============================================================================
-- Hapus urut dari yang paling bergantung (child) ke induk (parent)

DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.otp_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Hapus function helper
DROP FUNCTION IF EXISTS public.get_my_role CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_otp CASCADE;

-- ============================================================================
-- 2. TYPE & HELPER FUNCTIONS
-- ============================================================================

CREATE TYPE public.user_role AS ENUM ('member', 'admin', 'super_admin');

-- Function: Auto Update Timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup OTP Kadaluarsa
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.otp_codes WHERE expires_at < NOW() - INTERVAL '24 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: CEK ROLE (ANTI-RECURSION / JALUR BELAKANG)
-- Penting! Function ini berjalan sebagai Superuser (SECURITY DEFINER)
-- Digunakan dalam Policy agar tidak memicu RLS loop saat cek role admin.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 3. TABEL PROFILES (Updated: Avatar)
-- ============================================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data Diri
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT, -- Kolom Baru untuk Avatar
    
    -- Otoritas
    role public.user_role NOT NULL DEFAULT 'member',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Via OTP
    is_approved BOOLEAN NOT NULL DEFAULT FALSE, -- Via Admin
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    
    -- Validasi
    CONSTRAINT phone_format CHECK (phone_number ~ '^\+62[0-9]{9,13}$'),
    CONSTRAINT name_not_empty CHECK (length(trim(full_name)) > 0)
);

-- Index Profiles
CREATE INDEX idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Trigger Profiles
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 4. TABEL OTP_CODES
-- ============================================================================

CREATE TABLE public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    otp_code CHAR(6) NOT NULL,
    otp_type TEXT NOT NULL CHECK (otp_type IN ('registration', 'reset_password')),
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    attempt_count INTEGER NOT NULL DEFAULT 0
);

-- Trigger OTP
CREATE TRIGGER trigger_cleanup_otp
    AFTER INSERT ON public.otp_codes
    EXECUTE FUNCTION public.cleanup_expired_otp();

-- ============================================================================
-- 5. TABEL PHOTOS
-- ============================================================================

CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relasi
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- File Info
    storage_path TEXT NOT NULL,
    display_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- Status Hapus (Soft Delete)
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id),
    
    -- Metadata Tambahan
    audit_metadata JSONB DEFAULT '{}'::jsonb,
    exif_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index Photos
CREATE INDEX idx_photos_user ON public.photos(user_id);
CREATE INDEX idx_photos_deleted ON public.photos(is_deleted);

-- Trigger Photos
CREATE TRIGGER trigger_photos_updated_at
    BEFORE UPDATE ON public.photos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - FIX RECURSION
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- >>> POLICIES: PROFILES <<<

-- 1. Register: Semua orang (public/anon) boleh insert saat daftar
CREATE POLICY "profiles_insert_public" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- 2. View: Lihat diri sendiri ATAU Admin lihat semua
-- Menggunakan get_my_role() agar tidak looping
CREATE POLICY "profiles_select_logic" ON public.profiles
    FOR SELECT USING (
        id = auth.uid() OR 
        public.get_my_role() IN ('admin', 'super_admin')
    );

-- 3. Update: Edit diri sendiri ATAU Admin edit member
CREATE POLICY "profiles_update_logic" ON public.profiles
    FOR UPDATE USING (
        id = auth.uid() OR 
        public.get_my_role() IN ('admin', 'super_admin')
    );

-- >>> POLICIES: PHOTOS <<<

-- 1. View: Member lihat sendiri, Admin lihat semua
CREATE POLICY "photos_select_logic" ON public.photos
    FOR SELECT USING (
        user_id = auth.uid() OR 
        public.get_my_role() IN ('admin', 'super_admin')
    );

-- 2. Insert: Hanya user yang login (ke akun sendiri)
CREATE POLICY "photos_insert_own" ON public.photos
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- 3. Soft Delete / Update: Member (milik sendiri) atau Admin (global)
CREATE POLICY "photos_update_logic" ON public.photos
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        public.get_my_role() IN ('admin', 'super_admin')
    );

-- 4. Hard Delete: HANYA Super Admin
CREATE POLICY "photos_delete_super_admin" ON public.photos
    FOR DELETE USING (
        public.get_my_role() = 'super_admin'
    );

-- >>> POLICIES: OTP <<<
CREATE POLICY "otp_service_role" ON public.otp_codes
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. STORAGE BUCKETS SETUP
-- ============================================================================

-- Bucket: PHOTOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Bucket: AVATARS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES (PHOTOS)
CREATE POLICY "photos_public_view" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "photos_auth_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND auth.role() = 'authenticated'
);
CREATE POLICY "photos_auth_delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'photos' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR -- Punya sendiri
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin') -- Super Admin
    )
);

-- STORAGE POLICIES (AVATARS)
CREATE POLICY "avatars_public_view" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "avatars_auth_update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- 8. SEED DATA (INITIAL USERS)
-- ============================================================================

INSERT INTO public.profiles (
    full_name, phone_number, password_hash, role, is_verified, is_approved
) VALUES 
    -- Super Admin (Pass: 123456)
    ('Ahink Super', '+62851568484', '61112149e88fd7b4b4d65c9289cba46e:3c7c63c9409e16c818be88e597e283ad5605df90037fae722cc89f05841f34a1528b7f837b06842f2990fd3ca569236fae89648c86fb9e7e9b1666fa8f291749', 'super_admin', TRUE, TRUE),
    
    -- Admin (Pass: admin123)
    ('Febri Admin', '+62851256412', '8a0714b9a34788217fb93d2921f5da9e:93b46c5ba495596877628bb246b52b3314ee7134fa296df6d7b94eec06e3fb21035ca86724628f950f550497803fbbded9c7ddc7110932dce659d099e4c82913', 'admin', TRUE, TRUE),
    
    -- Member (Pass: member123)
    ('Member Test', '+628512465151', 'e5e8cb53e744c486a295414288c07e9d:6a90f94af45f6119a869039aeb0830b016b40e5d8cd902ed5492f6dfc7249a8a58f9bab9be409453689867afb560f631c5bd03f6121e49dcc80eeb213d3d0bb6', 'member', TRUE, TRUE)
ON CONFLICT (phone_number) DO NOTHING;