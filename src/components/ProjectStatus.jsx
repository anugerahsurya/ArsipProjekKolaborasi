import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, LoaderCircle } from 'lucide-react'

// Dua langkah, bukan modal: klik pertama minta konfirmasi di tombol yang sama.
export default function ProjectStatus({ status, onChange }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const selesai = status === 'selesai'

  useEffect(() => {
    if (!confirm) return
    const t = setTimeout(() => setConfirm(false), 4000)
    return () => clearTimeout(t)
  }, [confirm])

  const klik = async () => {
    if (!selesai && !confirm) return setConfirm(true)
    setBusy(true)
    try {
      await onChange(selesai ? 'aktif' : 'selesai')
      toast.success(selesai ? 'Projek dibuka kembali' : 'Projek ditandai selesai dan masuk arsip')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }

  return (
    <button type="button" className={`btn ${confirm ? 'btn-confirm' : 'btn-outline'}`} onClick={klik} disabled={busy}>
      {busy ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : selesai ? <ArchiveRestore size={16} aria-hidden="true" /> : <Archive size={16} aria-hidden="true" />}
      {selesai ? 'Buka kembali projek' : confirm ? 'Klik lagi untuk menandai selesai' : 'Tandai projek selesai'}
    </button>
  )
}
