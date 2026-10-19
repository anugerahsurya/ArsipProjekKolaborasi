import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import TopBar from '../components/TopBar.jsx'
import Sheet from '../components/Sheet.jsx'
import Contours from '../components/Contours.jsx'
import ScaleBar from '../components/ScaleBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ProjectStatus from '../components/ProjectStatus.jsx'
import NotFound from './NotFound.jsx'
import { getProject } from '../projects/index.js'
import { progressOf, useProjectState } from '../lib/useProjectState.js'
import { formatTanggalPendek, sisaHari } from '../lib/format.js'

function Timeline({ jadwal }) {
  return (
    <ol className="route">
      {jadwal.map((j) => {
        const lewat = sisaHari(j.tanggal) < 0
        return (
          <li key={j.tanggal} className={`route-stop ${lewat ? 'is-past' : ''} ${j.utama ? 'is-main' : ''}`}>
            <span className="route-dot" aria-hidden="true" />
            <span className="route-date num">{formatTanggalPendek(j.tanggal)}</span>
            <span className="route-label">{j.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default function Project() {
  const { projectId } = useParams()
  const project = getProject(projectId)
  if (!project) return <NotFound />
  return <ProjectView project={project} />
}

function ProjectView({ project }) {
  const st = useProjectState(project)

  return (
    <>
      <TopBar trail={[{ label: project.nama }]} />
      <main className="page">
        <Sheet>
          <header className="title-block">
            <div className="title-text">
              <div className="title-meta">
                <StatusBadge status={st.statusProjek} />
                <span>{project.wilayah}</span>
              </div>
              <h1>{project.nama}</h1>
              <p className="title-sub">{project.tema}</p>
              <dl className="facts">
                <div>
                  <dt>Konferensi</dt>
                  <dd>{project.namaPanjang}</dd>
                </div>
                <div>
                  <dt>Penyelenggara</dt>
                  <dd>{project.penyelenggara}</dd>
                </div>
              </dl>
              <div className="title-actions">
                {project.tautan.map((t) => (
                  <a key={t.url} href={t.url} target="_blank" rel="noreferrer" className="btn btn-outline">
                    {t.label} <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
            <div className="title-map">
              <Contours seed={31} hills={2} levels={7} />
            </div>
          </header>

          <section className="block" aria-labelledby="h-jadwal">
            <h2 id="h-jadwal">Jadwal</h2>
            <Timeline jadwal={project.jadwal} />
            <p className="note">{project.catatan}</p>
          </section>

          <section className="block" aria-labelledby="h-topik">
            <h2 id="h-topik">Indeks lembar topik</h2>
            <div className="sheet-index">
              {project.topics.map((t) => {
                const pr = progressOf(t, st.checkpoints)
                return (
                  <Link key={t.id} to={`/${project.id}/${t.id}`} className="sheet-cell">
                    <span className="cell-no num">Lembar {t.nomor}</span>
                    <h3>{t.judulSingkat}</h3>
                    <p className="cell-title">{t.judul}</p>
                    <p className="cell-sub">Subtema {t.subtema}</p>
                    {st.loading ? <div className="skeleton" style={{ height: 34 }} /> : <ScaleBar statuses={pr.statuses} />}
                    <span className="index-open">
                      Buka lembar <ArrowUpRight size={16} aria-hidden="true" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="block block-end">
            <div>
              <h2>Status projek</h2>
              <p className="note">Projek yang ditandai selesai pindah ke Arsip di beranda. Isi dan berkasnya tetap bisa dibuka.</p>
            </div>
            <ProjectStatus status={st.statusProjek} onChange={st.setProjectStatus} />
          </section>
        </Sheet>
      </main>
    </>
  )
}
