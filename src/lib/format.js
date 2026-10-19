const tgl = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const tglPendek = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

export const formatTanggal = (iso) => (iso ? tgl.format(new Date(iso)) : '')
export const formatTanggalPendek = (iso) => (iso ? tglPendek.format(new Date(iso)) : '')

export function sisaHari(iso) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

export function labelSisa(iso) {
  const n = sisaHari(iso)
  if (n > 1) return `${n} hari lagi`
  if (n === 1) return 'besok'
  if (n === 0) return 'hari ini'
  return `lewat ${-n} hari`
}

const rel = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })

export function waktuRelatif(iso) {
  if (!iso) return ''
  const diff = (new Date(iso) - Date.now()) / 1000
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [u, s] of units) {
    if (Math.abs(diff) >= s) return rel.format(Math.round(diff / s), u)
  }
  return 'baru saja'
}
