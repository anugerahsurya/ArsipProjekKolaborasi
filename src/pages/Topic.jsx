import { useParams } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import TopBar from '../components/TopBar.jsx'
import Sheet from '../components/Sheet.jsx'
import Legend from '../components/Legend.jsx'
import Illustration from '../components/Illustration.jsx'
import ScaleBar from '../components/ScaleBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import FlowDiagram from '../components/FlowDiagram.jsx'
import LiteratureTable from '../components/LiteratureTable.jsx'
import Checkpoints from '../components/Checkpoints.jsx'
import Berkas from '../components/Berkas.jsx'
import NotFound from './NotFound.jsx'
import { deadlineOf, getProject } from '../projects/index.js'
import { progressOf, stateKey, useProjectState } from '../lib/useProjectState.js'
import { formatTanggal, labelSisa } from '../lib/format.js'

function sorotLiteratur(id) {
  const el = document.getElementById(`lit-${id}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('is-flash')
  // paksa reflow supaya animasi bisa diulang
  void el.offsetWidth
  el.classList.add('is-flash')
}

function List({ items, ordered }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className="prose-list">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </Tag>
  )
}

export default function Topic() {
  const { projectId, topicId } = useParams()
  const project = getProject(projectId)
  const topic = project?.topics.find((t) => t.id === topicId)
  if (!topic) return <NotFound />
  return <TopicView project={project} topic={topic} />
}

function TopicView({ project, topic }) {
  const st = useProjectState(project)
  const pr = progressOf(topic, st.checkpoints)
  const k = topic.kerangka
  const deadline = deadlineOf(project)
  const litById = Object.fromEntries(topic.literatur.map((l) => [l.id, l]))
  const nBerkas = ['bahan_tayang', 'artikel_final', 'link'].filter((j) => st.berkas[stateKey(topic.id, j)]).length

  const legend = [
    { id: 'ringkasan', label: 'Ringkasan', swatch: 'line' },
    { id: 'gap', label: 'Research gap', swatch: 'contour', meta: topic.gap.length },
    { id: 'kerangka', label: 'Kerangka penelitian', swatch: 'water' },
    { id: 'literatur', label: 'Tabel literatur', swatch: 'dots', meta: topic.literatur.length },
    { id: 'checkpoint', label: 'Checkpoint', swatch: 'veg', meta: `${pr.selesai}/${pr.total}` },
    { id: 'berkas', label: 'Berkas', swatch: 'road', meta: `${nBerkas}/3` },
  ]

  return (
    <>
      <TopBar trail={[{ label: project.nama, to: `/${project.id}` }, { label: `Lembar ${topic.nomor}` }]} />
      <main className="page">
        <Sheet>
          <header className="title-block">
            <div className="title-text">
              <div className="title-meta">
                <span className="num">Lembar {topic.nomor}</span>
                <span>Subtema {topic.subtema}</span>
                {st.statusProjek === 'selesai' && <StatusBadge status="selesai" />}
              </div>
              <h1 className="h1-paper">{topic.judul}</h1>
              <p className="title-sub">{topic.judulSingkat}</p>
              <div className="title-progress">
                <ScaleBar statuses={pr.statuses} />
                {deadline && (
                  <span className="index-deadline num">
                    <CalendarClock size={15} aria-hidden="true" />
                    Batas submit {formatTanggal(deadline)} · {labelSisa(deadline)}
                  </span>
                )}
              </div>
            </div>
            <figure className="title-illus">
              <Illustration jenis={topic.ilustrasi} />
            </figure>
          </header>

          <div className="sheet-body">
            <Legend items={legend} />

            <div className="content">
              <section id="ringkasan" className="block">
                <h2>Ringkasan</h2>
                {topic.ringkasan.map((p) => (
                  <p key={p} className="prose">{p}</p>
                ))}
                <h3>Pertanyaan penelitian</h3>
                <List items={topic.pertanyaan} ordered />
              </section>

              <section id="gap" className="block">
                <h2>Research gap</h2>
                <ol className="gaps">
                  {topic.gap.map((g, i) => (
                    <li key={g.judul} className="gap">
                      <span className="gap-no num" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                      <div>
                        <h3>{g.judul}</h3>
                        <p className="prose">{g.isi}</p>
                        <div className="refs">
                          {g.rujukan.map((r) => (
                            <button key={r} type="button" className="ref" onClick={() => sorotLiteratur(r)}>
                              {litById[r] ? `${litById[r].penulis} (${litById[r].tahun})` : r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section id="kerangka" className="block">
                <h2>Kerangka penelitian</h2>

                <h3>Latar belakang</h3>
                {k.latar.map((p) => (
                  <p key={p} className="prose">{p}</p>
                ))}

                <div className="two-col">
                  <div>
                    <h3>Rumusan masalah</h3>
                    <List items={k.rumusan} ordered />
                  </div>
                  <div>
                    <h3>Tujuan</h3>
                    <List items={k.tujuan} ordered />
                  </div>
                </div>

                <h3>Kerangka pikir</h3>
                <FlowDiagram alur={k.alur} />

                <div className="two-col">
                  <div>
                    <h3>Hipotesis</h3>
                    <List items={k.hipotesis} />
                  </div>
                  <div>
                    <h3>Manfaat</h3>
                    <List items={k.manfaat} />
                  </div>
                </div>

                <h3>Sumber data</h3>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Sumber</th>
                        <th scope="col">Yang diambil</th>
                        <th scope="col">Akses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {k.data.map((d) => (
                        <tr key={d.sumber}>
                          <td data-label="Sumber"><strong>{d.sumber}</strong></td>
                          <td data-label="Isi">{d.isi}</td>
                          <td data-label="Akses">{d.akses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3>Variabel PODES 2025</h3>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Kode</th>
                        <th scope="col">Variabel</th>
                        <th scope="col">Peran</th>
                        <th scope="col">Pengolahan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {k.variabel.map((v) => (
                        <tr key={v.kode}>
                          <td data-label="Kode"><code>{v.kode}</code></td>
                          <td data-label="Variabel">{v.nama}</td>
                          <td data-label="Peran"><span className="role">{v.peran}</span></td>
                          <td data-label="Pengolahan">{v.olah}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3>Metode</h3>
                <dl className="methods">
                  {k.metode.map((m) => (
                    <div key={m.judul}>
                      <dt>{m.judul}</dt>
                      <dd>{m.isi}</dd>
                    </div>
                  ))}
                </dl>

                <h3>Keterbatasan</h3>
                <List items={k.keterbatasan} />

                <h3>Kerangka tulisan (template ICDSOS)</h3>
                <dl className="outline">
                  {k.outline.map((o) => (
                    <div key={o.bab}>
                      <dt>{o.bab}</dt>
                      <dd>{o.isi}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section id="literatur" className="block">
                <h2>Tabel literatur</h2>
                <p className="note">Semua tautan mengarah ke DOI atau halaman resmi penerbit.</p>
                <LiteratureTable items={topic.literatur} />
              </section>

              <section id="checkpoint" className="block">
                <h2>Checkpoint pengerjaan</h2>
                {st.error && <p className="error">Data checkpoint gagal dimuat: {st.error}</p>}
                <Checkpoints topic={topic} checkpoints={st.checkpoints} onSave={st.saveCheckpoint} loading={st.loading} />
              </section>

              <section id="berkas" className="block">
                <h2>Berkas</h2>
                <Berkas topic={topic} berkas={st.berkas} onSave={st.saveBerkas} loading={st.loading} />
              </section>
            </div>
          </div>
        </Sheet>
      </main>
    </>
  )
}
