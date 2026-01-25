'use client';

import { useState } from 'react';

export default function TestFonntePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-fonnte');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Gagal menghubungi API lokal' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-4">Fonnte Connection Test</h1>
      <button 
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Sedang Mengetes...' : 'Klik untuk Test Kirim WA'}
      </button>

      {result && (
        <pre className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}