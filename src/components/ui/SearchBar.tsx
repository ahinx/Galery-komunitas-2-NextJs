'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce' // Install jika perlu: npm i use-debounce
// Atau pakai timeout manual jika tidak ingin install library tambahan:

export default function SearchBar() {
  const searchParams = useSearchParams()
  const { replace } = useRouter()

  // Delay pencarian 300ms agar server tidak berat
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    replace(`/dashboard?${params.toString()}`)
  }

  // Jika tidak mau install 'use-debounce', gunakan logika simpel ini:
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(e.target.value)
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Cari foto..."
        onChange={handleChange}
        defaultValue={searchParams.get('q')?.toString()}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-full leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
      />
    </div>
  )
}