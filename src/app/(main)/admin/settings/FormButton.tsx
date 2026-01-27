'use client'

import { useFormStatus } from 'react-dom'
import { Save, Loader2 } from 'lucide-react'

export default function FormButton() {
  const { pending } = useFormStatus()

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Menyimpan...
        </>
      ) : (
        <>
          <Save className="w-5 h-5" />
          Simpan Perubahan
        </>
      )}
    </button>
  )
}