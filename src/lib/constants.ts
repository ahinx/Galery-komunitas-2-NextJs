// ============================================================================
// APPLICATION CONSTANTS
// File: src/lib/constants.ts
// Deskripsi: Konstanta global untuk aplikasi
// ============================================================================

// ============================================================================
// APP CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
    NAME: 'Galeri Foto Komunitas',
    DESCRIPTION: 'Aplikasi galeri foto dengan sistem audit siluman',
    VERSION: '1.0.0',
    AUTHOR: 'Tim Developer',
} as const

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLES = {
    MEMBER: 'member',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
} as const

export const ROLE_LABELS = {
    [USER_ROLES.MEMBER]: 'Member',
    [USER_ROLES.ADMIN]: 'Admin',
    [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
} as const

export const ROLE_COLORS = {
    [USER_ROLES.MEMBER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [USER_ROLES.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [USER_ROLES.SUPER_ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
} as const

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const AUTH_CONFIG = {
    OTP_LENGTH: 6,
    OTP_EXPIRY_MINUTES: 5,
    MAX_OTP_ATTEMPTS: 3,
    RESEND_COOLDOWN_SECONDS: 60,
} as const

export const AUTH_ROUTES = {
    LOGIN: '/login',
    VERIFY_OTP: '/verify-otp',
    WAITING_ROOM: '/waiting-room',
    DASHBOARD: '/dashboard',
} as const

// ============================================================================
// FILE UPLOAD
// ============================================================================

export const UPLOAD_CONFIG = {
    MAX_FILE_SIZE_MB: 10,
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
    COMPRESSION_MAX_WIDTH: 1920,
    COMPRESSION_MAX_HEIGHT: 1920,
    COMPRESSION_QUALITY: 0.8,
} as const

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'] as const

// ============================================================================
// GALLERY
// ============================================================================

export const GALLERY_CONFIG = {
    ITEMS_PER_PAGE: 24,
    MASONRY_COLUMNS: {
        mobile: 2,
        tablet: 3,
        desktop: 4,
    },
    LAZY_LOAD_THRESHOLD: '200px',
} as const

// ============================================================================
// THEME
// ============================================================================

export const THEME = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
} as const

// ============================================================================
// NAVIGATION
// ============================================================================

export const NAV_ITEMS = [
    {
        label: 'Galeri',
        href: '/dashboard',
        icon: 'Images',
    },
    {
        label: 'Upload',
        href: '/upload',
        icon: 'Upload',
    },
    {
        label: 'Profil',
        href: '/profile',
        icon: 'User',
    },
] as const

export const ADMIN_NAV_ITEMS = [
    {
        label: 'Dashboard',
        href: '/admin',
        icon: 'LayoutDashboard',
    },
    {
        label: 'Kelola Member',
        href: '/admin/users',
        icon: 'Users',
    },
    {
        label: 'Moderasi Foto',
        href: '/admin/photos',
        icon: 'Images',
    },
] as const

export const SUPER_ADMIN_NAV_ITEMS = [
    ...ADMIN_NAV_ITEMS,
    {
        label: 'Tempat Sampah',
        href: '/trash',
        icon: 'Trash2',
    },
    {
        label: 'Audit Log',
        href: '/admin/audit',
        icon: 'Shield',
    },
] as const

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
    // Auth errors
    INVALID_PHONE: 'Nomor telepon tidak valid. Gunakan format: 08xx atau +62xx',
    INVALID_OTP: 'Kode OTP harus 6 digit angka',
    OTP_EXPIRED: 'Kode OTP sudah kadaluarsa. Silakan minta kode baru',
    OTP_INVALID: 'Kode OTP tidak valid atau sudah digunakan',
    MAX_ATTEMPTS: 'Terlalu banyak percobaan. Silakan minta kode OTP baru',

    // Upload errors
    FILE_TOO_LARGE: 'Ukuran file terlalu besar. Maksimal 10MB',
    INVALID_FILE_TYPE: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP',
    UPLOAD_FAILED: 'Gagal mengunggah foto. Silakan coba lagi',

    // Permission errors
    UNAUTHORIZED: 'Anda tidak memiliki izin untuk mengakses halaman ini',
    NOT_APPROVED: 'Akun Anda belum disetujui oleh admin',
    NOT_VERIFIED: 'Silakan verifikasi nomor telepon Anda terlebih dahulu',

    // General errors
    NETWORK_ERROR: 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda',
    SERVER_ERROR: 'Terjadi kesalahan server. Silakan coba lagi nanti',
    UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui',
} as const

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
    OTP_SENT: 'Kode OTP telah dikirim ke WhatsApp Anda',
    LOGIN_SUCCESS: 'Login berhasil! Selamat datang',
    UPLOAD_SUCCESS: 'Foto berhasil diunggah',
    DELETE_SUCCESS: 'Foto berhasil dihapus',
    UPDATE_SUCCESS: 'Data berhasil diperbarui',
    APPROVAL_SUCCESS: 'Member berhasil disetujui',
    BAN_SUCCESS: 'Member berhasil diblokir',
} as const

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
    SEND_OTP: '/api/auth/send-otp',
    VERIFY_OTP: '/api/auth/verify-otp',
    LOGOUT: '/api/auth/logout',
    UPLOAD_PHOTO: '/api/photos/upload',
    DELETE_PHOTO: '/api/photos/delete',
    GET_PHOTOS: '/api/photos',
    APPROVE_USER: '/api/admin/approve-user',
    BAN_USER: '/api/admin/ban-user',
} as const

// ============================================================================
// STORAGE PATHS
// ============================================================================

export const STORAGE_PATHS = {
    PHOTOS: (userId: string, filename: string) => `${userId}/${filename}`,
    THUMBNAILS: (userId: string, filename: string) => `${userId}/thumbnails/${filename}`,
} as const

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
    THEME: 'app-theme',
    SELECTED_PHOTOS: 'selected-photos',
    GALLERY_VIEW: 'gallery-view',
    LAST_UPLOAD: 'last-upload-timestamp',
} as const

// ============================================================================
// BREAKPOINTS (untuk responsive design)
// ============================================================================

export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const

// ============================================================================
// ANIMATIONS
// ============================================================================

export const ANIMATION_DURATION = {
    fast: 150,
    normal: 300,
    slow: 500,
} as const

// ============================================================================
// AUDIT METADATA KEYS
// ============================================================================

export const AUDIT_KEYS = {
    UPLOAD_IP: 'upload_ip',
    USER_AGENT: 'user_agent',
    GEO_LOCATION: 'geo_location',
    DEVICE_TYPE: 'device_type',
    SCREEN_RESOLUTION: 'screen_resolution',
    CAPTURED_AT: 'captured_at',
} as const

// ============================================================================
// EXIF KEYS
// ============================================================================

export const EXIF_KEYS = {
    CAMERA_MODEL: 'camera_model',
    DATE_TAKEN: 'date_taken',
    GPS_LATITUDE: 'gps_latitude',
    GPS_LONGITUDE: 'gps_longitude',
    ISO: 'iso',
    APERTURE: 'aperture',
    FOCAL_LENGTH: 'focal_length',
    EXPOSURE_TIME: 'exposure_time',
} as const

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
    FULL: 'EEEE, dd MMMM yyyy',
    DATE_ONLY: 'dd MMMM yyyy',
    TIME_ONLY: 'HH:mm',
    DATETIME: 'dd MMM yyyy HH:mm',
    MONTH_YEAR: 'MMMM yyyy',
} as const

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 24,
    MAX_LIMIT: 100,
} as const

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const REGEX_PATTERNS = {
    PHONE_NUMBER: /^\+62[0-9]{9,13}$/,
    OTP_CODE: /^\d{6}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const