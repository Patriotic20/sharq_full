import { useEffect, useRef } from 'react'
import { cn } from '../lib/utils'
import { CODE_LABEL, TABEL_CODES, type TabelCode } from '../types/tabel'

interface Props {
  currentCode: string                  // empty string if cell is blank
  onSelect: (code: TabelCode | null) => void
  onClose: () => void
}

const CODE_COLOR: Record<TabelCode, string> = {
  B:  'bg-green-100 text-green-800 hover:bg-green-200',
  O:  'bg-green-100 text-green-800 hover:bg-green-200',
  A:  'bg-gray-200 text-gray-700 hover:bg-gray-300',
  F:  'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  V:  'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  G:  'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  N:  'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  RP: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  R:  'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  OU: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  P:  'bg-red-100 text-red-800 hover:bg-red-200',
}

export default function TabelCellPopover({ currentCode, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-2 w-56"
      onClick={e => e.stopPropagation()}
    >
      <div className="grid grid-cols-3 gap-1.5">
        {TABEL_CODES.map(code => (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            title={CODE_LABEL[code]}
            className={cn(
              'h-10 rounded-lg text-sm font-bold transition-colors',
              CODE_COLOR[code],
              currentCode === code && 'ring-2 ring-primary-500',
            )}
          >
            {code}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="mt-2 w-full text-xs text-gray-500 hover:text-red-600 py-1.5 border-t border-gray-100 transition-colors"
      >
        ✕ Tozalash
      </button>
    </div>
  )
}
