import { Archive, CircleDot } from 'lucide-react'

export default function StatusBadge({ status }) {
  const selesai = status === 'selesai'
  return (
    <span className={`badge ${selesai ? 'badge-done' : 'badge-active'}`}>
      {selesai ? <Archive size={13} aria-hidden="true" /> : <CircleDot size={13} aria-hidden="true" />}
      {selesai ? 'Selesai, diarsipkan' : 'Aktif'}
    </span>
  )
}
