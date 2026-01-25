-- supabase/seed.sql

-- Contoh menambahkan user admin (Pastikan ID ini sesuai dengan UID di auth.users jika sudah ada)
-- Namun biasanya seed digunakan untuk data dummy seperti kategori atau setting awal
INSERT INTO public.profiles (id, full_name, phone_number, role, is_verified, is_approved)
VALUES 
  (gen_random_uuid(), 'Super Admin', '+6285157300793', 'super_admin', true, true);