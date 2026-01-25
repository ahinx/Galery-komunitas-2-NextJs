// ============================================================================
// Script: Generate Password Hash untuk Seed Data
// File: scripts/generate-hash.js
// 
// Cara pakai:
// node scripts/generate-hash.js
// ============================================================================

const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scryptAsync(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
    console.log('🔐 Generating Password Hashes...\n');
    console.log('=' .repeat(60));
    
    const passwords = [
        { label: 'Super Admin', password: '123456' },
        { label: 'Admin', password: 'admin123' },
        { label: 'Member', password: 'member123' },
    ];
    
    for (const { label, password } of passwords) {
        const hash = await hashPassword(password);
        console.log(`\n📌 ${label}`);
        console.log(`   Password: ${password}`);
        console.log(`   Hash: ${hash}`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Copy hash di atas ke file SQL migration!\n');
    
    // Generate SQL INSERT statement
    console.log('📋 SQL INSERT Statement:\n');
    
    const superAdminHash = await hashPassword('123456');
    const adminHash = await hashPassword('admin123');
    const memberHash = await hashPassword('member123');
    
    console.log(`
INSERT INTO public.profiles (
    full_name, phone_number, password_hash, role, is_verified, is_approved
) VALUES 
    -- Super Admin (password: 123456)
    (
        'Super Admin Utama',
        '+6285157300793',
        '${superAdminHash}',
        'super_admin',
        TRUE,
        TRUE
    ),
    -- Admin (password: admin123)
    (
        'Admin User',
        '+6285124616060',
        '${adminHash}',
        'admin',
        TRUE,
        TRUE
    ),
    -- Member (password: member123)
    (
        'Member Test',
        '+6289876543210',
        '${memberHash}',
        'member',
        TRUE,
        TRUE
    )
ON CONFLICT (phone_number) DO NOTHING;
`);
}

main().catch(console.error);