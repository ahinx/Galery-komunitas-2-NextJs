-- ============================================================================
-- MIGRASI DATABASE - Blueprint 1.0 (Master Edition)
-- File: supabase/migrations/20240101000000_init_schema.sql
-- Deskripsi: Inisialisasi tabel, enum, RLS, dan fungsi audit siluman
-- ============================================================================

-- ============================================================================
-- 1. EXTENSION & ENUM TYPES
-- ============================================================================

-- Enable ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum untuk role pengguna
CREATE TYPE user_role AS ENUM ('member', 'admin', 'super_admin');

-- ============================================================================
-- 2. TABEL PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informasi dasar user
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    
    -- Sistem otoritas
    role user_role NOT NULL DEFAULT 'member',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Constraint
    CONSTRAINT phone_format CHECK (phone_number ~ '^\+62[0-9]{9,13}$')
);

-- Index untuk performa
CREATE INDEX idx_profiles_phone ON profiles(phone_number);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_approved ON profiles(is_approved) WHERE is_approved = FALSE;

-- ============================================================================
-- 3. TABEL PHOTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relasi ke user
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Path storage & URL display
    storage_path TEXT NOT NULL,
    display_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL, -- dalam bytes
    mime_type TEXT NOT NULL,
    
    -- Status soft-delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id),
    
    -- Metadata audit siluman (JSON untuk fleksibilitas)
    audit_metadata JSONB DEFAULT '{}'::jsonb,
    -- Contoh struktur:
    -- {
    --   "upload_ip": "103.xxx.xxx.xxx",
    --   "user_agent": "Mozilla/5.0...",
    --   "geo_location": {"city": "Jakarta", "isp": "Telkom"},
    --   "upload_device": "Android",
    --   "screen_resolution": "1080x2400"
    -- }
    
    -- Data EXIF dari foto
    exif_data JSONB DEFAULT '{}'::jsonb,
    -- Contoh struktur:
    -- {
    --   "camera_model": "Canon EOS 5D",
    --   "date_taken": "2024-01-15T10:30:00",
    --   "gps_latitude": -6.xxx,
    --   "gps_longitude": 106.xxx,
    --   "iso": 400,
    --   "aperture": "f/2.8"
    -- }
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_deleted ON photos(is_deleted);
CREATE INDEX idx_photos_created ON photos(created_at DESC);
CREATE INDEX idx_photos_user_active ON photos(user_id, is_deleted) WHERE is_deleted = FALSE;

-- Index untuk audit metadata (GIN index untuk JSONB)
CREATE INDEX idx_photos_audit ON photos USING GIN (audit_metadata);
CREATE INDEX idx_photos_exif ON photos USING GIN (exif_data);

-- ============================================================================
-- 4. TABEL OTP (untuk autentikasi WhatsApp)
-- ============================================================================

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    
    -- Status & expiry
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metadata keamanan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    attempt_count INTEGER DEFAULT 0,
    
    -- Constraint: OTP hanya valid 5 menit
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Index untuk performa
CREATE INDEX idx_otp_phone ON otp_codes(phone_number);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- Auto-delete OTP yang sudah kadaluarsa (cleanup otomatis)
CREATE OR REPLACE FUNCTION cleanup_expired_otp()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM otp_codes 
    WHERE expires_at < NOW() - INTERVAL '1 day';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_otp
    AFTER INSERT ON otp_codes
    EXECUTE FUNCTION cleanup_expired_otp();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS untuk semua tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PROFILES
-- ============================================================================

-- Member bisa melihat profil sendiri
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Member bisa update profil sendiri (kecuali role)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    );

-- Admin & Super Admin bisa melihat semua profil
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Super Admin bisa mengubah role & approval status
CREATE POLICY "Super Admin can manage users"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - PHOTOS
-- ============================================================================

-- Member bisa melihat foto sendiri yang tidak dihapus
CREATE POLICY "Users can view own photos"
    ON photos FOR SELECT
    USING (
        user_id = auth.uid() 
        AND is_deleted = FALSE
    );

-- Member yang sudah approved bisa upload foto
CREATE POLICY "Approved users can upload photos"
    ON photos FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_approved = TRUE
            AND is_verified = TRUE
        )
    );

-- Member bisa soft-delete foto sendiri
CREATE POLICY "Users can soft-delete own photos"
    ON photos FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        AND is_deleted = TRUE -- hanya boleh set ke deleted
    );

-- Admin bisa melihat semua foto (termasuk yang deleted)
CREATE POLICY "Admins can view all photos"
    ON photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admin bisa soft-delete foto apapun
CREATE POLICY "Admins can soft-delete any photo"
    ON photos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Super Admin bisa permanent delete (akan dihandle di application level)
CREATE POLICY "Super Admin can delete photos"
    ON photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - OTP
-- ============================================================================

-- Tidak ada SELECT untuk user biasa (keamanan)
-- Hanya service role yang bisa akses OTP
CREATE POLICY "Service role only for OTP"
    ON otp_codes FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- 6. FUNGSI HELPER - SILENT AUDIT
-- ============================================================================

-- Fungsi untuk capture metadata upload secara otomatis
CREATE OR REPLACE FUNCTION capture_upload_metadata(
    p_user_id UUID,
    p_ip_address TEXT,
    p_user_agent TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_metadata JSONB;
    v_device_type TEXT;
BEGIN
    -- Deteksi device type dari user agent
    IF p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' THEN
        v_device_type := 'Mobile';
    ELSIF p_user_agent ILIKE '%tablet%' OR p_user_agent ILIKE '%ipad%' THEN
        v_device_type := 'Tablet';
    ELSE
        v_device_type := 'Desktop';
    END IF;
    
    -- Bangun JSON metadata
    v_metadata := jsonb_build_object(
        'upload_ip', p_ip_address,
        'user_agent', p_user_agent,
        'device_type', v_device_type,
        'captured_at', NOW()
    );
    
    RETURN v_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. FUNGSI HELPER - AUTO UPDATE TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update timestamp
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 8. STORAGE BUCKET CONFIGURATION
-- ============================================================================

-- Buat bucket untuk menyimpan foto
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'photos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'photos');

CREATE POLICY "Super Admin can delete photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'photos'
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- 9. SEED DATA (OPSIONAL - untuk development)
-- ============================================================================

-- Uncomment jika ingin membuat super admin default
INSERT INTO profiles (id, full_name, phone_number, role, is_verified, is_approved)
VALUES (
    gen_random_uuid(),
    'Super Admin',
    '+6285157300793',
    'super_admin',
    TRUE,
    TRUE
);

-- ============================================================================
-- SELESAI - MIGRASI DATABASE BLUEPRINT 1.0
-- ============================================================================

-- Cara menjalankan migrasi ini:
-- 1. Simpan file ini di: supabase/migrations/20240101000000_init_schema.sql
-- 2. Jalankan: npx supabase db push
-- 3. Atau untuk local: npx supabase db reset

-- Cara membuat Super Admin pertama:
-- UPDATE profiles SET role = 'super_admin', is_approved = true, is_verified = true
-- WHERE phone_number = '+62xxx'; -- ganti dengan nomor Anda