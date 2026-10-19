import { toast } from 'sonner'
import { Copy, Download, FileJson } from 'lucide-react'
import projectTpl from '../../templates/project.template.json?raw'
import topikTpl from '../../templates/topik.template.json?raw'

const TEMPLATES = [
  {
    nama: 'project.template.json',
    judul: 'Projek baru',
    ket: 'Untuk konferensi atau jurnal baru. Isi bagian <<...>> di _prompt dengan teks call for paper.',
    simpan: 'src/projects/<id-projek>/project.json',
    isi: projectTpl,
  },
  {
    nama: 'topik.template.json',
    judul: 'Topik baru',
    ket: 'Untuk topik di dalam projek. Isi info projek, ide topik, metadata data, dan tanggal.',
    simpan: 'src/projects/<id-projek>/<id-topik>/topik.json',
    isi: topikTpl,
  },
]

export default function Templates() {
  const salin = async (t) => {
    try {
      await navigator.clipboard.writeText(t.isi)
      toast.success(`${t.nama} tersalin, tempel ke Claude`)
    } catch {
      toast.error('Gagal menyalin, pakai tombol Unduh')
    }
  }

  const unduh = (t) => {
    const url = URL.createObjectURL(new Blob([t.isi], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = t.nama
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="index-block" aria-labelledby="h-template">
      <h2 id="h-template">Template projek dan topik</h2>
      <p className="note tpl-note">
        Salin template, isi bagian bertanda &lt;&lt;...&gt;&gt; di kunci _prompt, lalu tempel seluruhnya ke Claude. Simpan
        jawabannya di lokasi yang tertulis, lalu push. Nama folder harus sama dengan id di JSON, dan tautan literatur tetap
        perlu dicek.
      </p>
      <div className="tpl-list">
        {TEMPLATES.map((t) => (
          <div key={t.nama} className="tpl">
            <FileJson size={22} aria-hidden="true" />
            <div className="tpl-text">
              <h3>{t.judul}</h3>
              <p>{t.ket}</p>
              <code>{t.simpan}</code>
            </div>
            <div className="tpl-actions">
              <button type="button" className="btn" onClick={() => salin(t)}>
                <Copy size={16} aria-hidden="true" />
                Salin
              </button>
              <button type="button" className="btn btn-outline" onClick={() => unduh(t)}>
                <Download size={16} aria-hidden="true" />
                Unduh
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
