import { Check } from 'lucide-react'

// Status digambar seperti simbol area di legenda peta: garis, arsir, blok penuh.
export default function StatusSymbol({ status = 'belum', size = 18 }) {
  return (
    <span className={`symbol symbol-${status}`} style={{ '--s': `${size}px` }} aria-hidden="true">
      {status === 'selesai' && <Check size={size * 0.7} strokeWidth={3} />}
    </span>
  )
}

export const STATUS = [
  { value: 'belum', label: 'Belum' },
  { value: 'proses', label: 'Proses' },
  { value: 'selesai', label: 'Selesai' },
]
