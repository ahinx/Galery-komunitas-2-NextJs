// Script sederhana untuk test koneksi Fonnte
async function testFonnte() {
    // const token = "fvvxv7gfre1uWbfUqK1g"; // Ganti dengan token asli untuk tes
    // const target = "6285157300793";    // Format: 628xxx

    const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
            // 'Authorization': process.env.FONNTE_API_TOKEN!.trim(), // Tambahkan .trim() untuk hapus spasi liar
            'Authorization': "fvvxv7gfre1uWbfUqK1g", // Tambahkan .trim() untuk hapus spasi liar
        },
        body: new URLSearchParams({
            target: '6285157300793',
            message: 'Tes koneksi',
            // countryCode: '62' // Opsional, tambahkan jika nomor tidak pakai 62
        }),
    })

    const result = await response.json();
    console.log(result);
}

testFonnte();