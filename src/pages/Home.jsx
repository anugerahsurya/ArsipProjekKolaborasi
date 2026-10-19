import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarClock } from 'lucide-react'
import TopBar from '../components/TopBar.jsx'
import Contours from '../components/Contours.jsx'
import ScaleBar from '../components/ScaleBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { projects, deadlineOf } from '../projects/index.js'
import { progressOf, useProjectState } from '../lib/useProjectState.js'
import { formatTanggal, labelSisa } from '../lib/format.js'
import { fetchProjects } from '../lib/api.js'

function ProjectRow({ project }) {
  const st = useProjectState(project)
  const statuses = project.topics.flatMap((t) => progressOf(t, st.checkpoints).statuses)
  const deadline = deadlineOf(project)

  return (
    <Link to={`/${project.id}`} className="index-row">
      <div className="index-main">
        <div className="index-top">
          <StatusBadge status={st.statusProjek} />
          <span className="index-region">{project.wilayah}</span>
        </div>
        <h3>{project.nama}</h3>
        <p>{project.tema}</p>
        <div className="index-topics">
          {project.topics.map((t) => (
            <span key={t.id} className="index-topic">
              <span className="num">Lembar {t.nomor}</span> {t.judulSingkat}
            </span>
          ))}
        </div>
      </div>
      <div className="index-side">
        {deadline && st.statusProjek !== 'selesai' && (
          <span className="index-deadline num">
            <CalendarClock size={15} aria-hidden="true" />
            {formatTanggal(deadline)} · {labelSisa(deadline)}
          </span>
        )}
        {st.loading ? <div className="skeleton" style={{ height: 34 }} /> : <ScaleBar statuses={statuses} />}
        <span className="index-open">
          Buka projek <ArrowUpRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

export default function Home() {
  const [override, setOverride] = useState({})
  useEffect(() => {
    fetchProjects()
      .then((rows) => setOverride(Object.fromEntries(rows.map((r) => [r.project, r.status]))))
      .catch(() => {})
  }, [])
  const statusOf = (p) => override[p.id] || p.status
  const aktif = projects.filter((p) => statusOf(p) !== 'selesai')
  const arsip = projects.filter((p) => statusOf(p) === 'selesai')

  return (
    <>
      <TopBar />
      <main className="page">
        <section className="hero">
          <div className="hero-text">
            <h1>Projek Artikel Ilmiah</h1>
            <p>
              Rancangan, literatur, kemajuan, dan berkas tiap artikel dalam satu lembar kerja tim. Satu projek untuk satu
              konferensi atau jurnal, berisi topik yang dipilih untuk ditulis.
            </p>
          </div>
          <div className="hero-map">
            <Contours seed={13} hills={3} levels={8} draw />
          </div>
        </section>

        <section className="index-block" aria-labelledby="h-aktif">
          <h2 id="h-aktif">Projek berjalan</h2>
          <div className="index-list">
            {aktif.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
            {aktif.length === 0 && <p className="empty">Tidak ada projek berjalan. Tambahkan folder projek baru di src/projects.</p>}
          </div>
        </section>

        <section className="index-block" aria-labelledby="h-arsip">
          <h2 id="h-arsip">Arsip</h2>
          <div className="index-list">
            {arsip.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
            {arsip.length === 0 && (
              <p className="empty">Belum ada projek selesai. Projek yang ditandai selesai akan pindah ke sini.</p>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
