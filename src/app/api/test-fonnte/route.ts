// src/app/api/test-fonnte/route.ts
import { NextResponse } from 'next/server';
import { formatPhoneForFonnte } from '@/lib/utils';

export async function GET() {
    const token = process.env.FONNTE_TOKEN?.trim(); // Pastikan tidak ada spasi liar
    const rawTarget = "085157300793"; // Masukkan nomor tes Anda di sini
    const target = formatPhoneForFonnte(rawTarget); // Hasilnya: 6281234567890

    // Cek di terminal VS Code Anda saat URL diakses
    console.log("Token yang terbaca:", token ? "Terdeteksi" : "KOSONG/UNDEFINED");

    if (!token) {
        return NextResponse.json({
            status: false,
            reason: "Token tidak terbaca di environment server"
        });
    }

    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token || '',
            },
            body: new URLSearchParams({
                target: target,
                message: 'Tes Koneksi Galeri: Jika pesan ini sampai, koneksi sudah benar.',
            }),
        });

        const data = await response.json();

        // Jika masih gagal, kita kembalikan detail untuk diagnosa
        return NextResponse.json({
            ...data,
            debug: {
                used_target: target,
                token_length: token?.length || 0
            }
        });
    } catch (error) {
        return NextResponse.json({ status: false, reason: 'Network Error' }, { status: 500 });
    }
}