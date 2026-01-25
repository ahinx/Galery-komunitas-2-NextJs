'use client'

import { ReactNode } from 'react'

interface TooltipProps {
  text: string
  children: ReactNode
}

export default function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <div className="absolute top-full mt-2 mb-2 hidden group-hover:block w-max z-50">
        <div className="relative bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg">
          {text}
          {/* Segitiga kecil */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
        </div>
      </div>
    </div>
  )
}