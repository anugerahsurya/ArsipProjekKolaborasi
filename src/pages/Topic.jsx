import { useParams } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import TopBar from '../components/TopBar.jsx'
import Sheet from '../components/Sheet.jsx'
import Legend from '../components/Legend.jsx'
import Illustration from '../components/Illustration.jsx'
import Contours from '../components/Contours.jsx'
import ScaleBar from '../components/ScaleBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import FlowDiagram from '../components/FlowDiagram.jsx'
import LiteratureTable from '../components/LiteratureTable.jsx'
import Checkpoints from '../components/Checkpoints.jsx'
import Berkas from '../components/Berkas.jsx'
import Kolaborator from '../components/Kolaborator.jsx'
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

function Refs({ ids, litById }) {
  if (!ids?.length) return null
  return (
    <div className="refs">
      {ids.map((r) => (
        <button key={r} type="button" className="ref" onClick={() => sorotLiteratur(r)}>
          {litById[r] ? `${litById[r].penulis} (${litById[r].tahun})` : r}
        </button>
      ))}
    </div>
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

  const so = topic.sorotan
  const iv = topic.intervensi
  const ds = topic.desain

  const legend = [
    { id: 'ringkasan', label: 'Ringkasan', swatch: 'line' },
    so && { id: 'sorotan', label: 'Sorotan dan kebijakan', swatch: 'road' },
    { id: 'gap', label: 'Research gap', swatch: 'contour', meta: topic.gap.length },
    { id: 'kerangka', label: 'Kerangka penelitian', swatch: 'water' },
    ds && { id: 'desain', label: 'Metode dan skala desa', swatch: 'veg', meta: ds.opsiMetode?.length },
    { id: 'literatur', label: 'Tabel literatur', swatch: 'dots', meta: topic.literatur.length },
    { id: 'checkpoint', label: 'Checkpoint', swatch: 'veg', meta: `${pr.selesai}/${pr.total}` },
    { id: 'berkas', label: 'Berkas', swatch: 'road', meta: `${nBerkas}/3` },
  ].filter(Boolean)

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
            {topic.ilustrasi ? (
              <figure className="title-illus">
                <Illustration jenis={topic.ilustrasi} />
              </figure>
            ) : (
              <div className="title-map">
                <Contours seed={topic.nomor * 17} hills={2} levels={7} />
              </div>
            )}
          </header>

          <Kolaborator list={st.kolaborator} onAdd={st.addKolaborator} onRemove={st.removeKolaborator} loading={st.loading} />

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

              {so && (
                <section id="sorotan" className="block">
                  <h2>Sorotan dan arah kebijakan</h2>
                  <div className="highlight-grid">
                    {[
                      ['Fenomena', so.fenomena],
                      ['Masalah', so.masalah],
                      ['Target', so.target],
                      ['Hasil yang dijanjikan', so.hasil],
                    ].map(([label, items]) => (
                      <div key={label} className="highlight">
                        <h3>{label}</h3>
                        <List items={items} />
                      </div>
                    ))}
                  </div>
                  {so.catatanHasil && <p className="note">{so.catatanHasil}</p>}

                  {so.agenda && (
                    <>
                      <h3>Kaitan dengan RPJMN dan SDGs</h3>
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th scope="col">Agenda</th>
                              <th scope="col">Butir</th>
                              <th scope="col">Kaitan dengan indeks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {so.agenda.map((a) => (
                              <tr key={a.agenda}>
                                <td data-label="Agenda"><strong>{a.agenda}</strong></td>
                                <td data-label="Butir">{a.butir}</td>
                                <td data-label="Kaitan">{a.kaitan}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {iv && (
                    <>
                      <h3>Arah intervensi per tipologi</h3>
                      {iv.pengantar && <p className="prose">{iv.pengantar}</p>}
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th scope="col">Tipologi</th>
                              <th scope="col">Ciri</th>
                              <th scope="col">Arah</th>
                              <th scope="col">Program</th>
                              <th scope="col">Pelaksana</th>
                            </tr>
                          </thead>
                          <tbody>
                            {iv.tipologi.map((r) => (
                              <tr key={r.nama}>
                                <td data-label="Tipologi"><strong>{r.nama}</strong></td>
                                <td data-label="Ciri">{r.ciri}</td>
                                <td data-label="Arah">{r.arah}</td>
                                <td data-label="Program">{r.program}</td>
                                <td data-label="Pelaksana">{r.pelaksana}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {iv.tuas && (
                        <>
                          <h3>Sub-indeks sebagai tuas kebijakan</h3>
                          <List items={iv.tuas} />
                        </>
                      )}
                    </>
                  )}
                </section>
              )}

              <section id="gap" className="block">
                <h2>Research gap</h2>
                <ol className="gaps">
                  {topic.gap.map((g, i) => (
                    <li key={g.judul} className="gap">
                      <span className="gap-no num" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                      <div>
                        <h3>{g.judul}</h3>
                        <p className="prose">{g.isi}</p>
                        <Refs ids={g.rujukan} litById={litById} />
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

                {ds?.variabel && (
                  <>
                    <h3>Variabel geospasial per dimensi</h3>
                    {ds.pengantar && <p className="prose">{ds.pengantar}</p>}
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th scope="col">Dimensi</th>
                            <th scope="col">Variabel dan sumber</th>
                            <th scope="col">Pengolahan ke desa</th>
                            <th scope="col">Arah</th>
                            <th scope="col">Dasar literatur</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ds.variabel.map((v, i) => (
                            <tr key={v.nama}>
                              <td data-label="Dimensi">{ds.variabel[i - 1]?.dimensi !== v.dimensi && <strong>{v.dimensi}</strong>}</td>
                              <td data-label="Variabel">
                                <strong>{v.nama}</strong>
                                <span className="lit-source">{v.sumber}</span>
                              </td>
                              <td data-label="Pengolahan">{v.olah}</td>
                              <td data-label="Arah"><span className="role">{v.arah}</span></td>
                              <td data-label="Dasar">
                                {v.dasar}
                                <Refs ids={v.rujukan} litById={litById} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <h3>{k.variabelJudul || 'Variabel PODES 2025'}</h3>
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
                        <tr key={`${v.kode}-${v.nama}`}>
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

              {ds && (
                <section id="desain" className="block">
                  <h2>Metode indeks dan penurunan ke desa</h2>
                  {ds.opsiMetode && (
                    <>
                      <h3>Opsi metode pembangunan indeks</h3>
                      <ol className="options">
                        {ds.opsiMetode.map((o) => (
                          <li key={o.kode} className={o.rekomendasi ? 'option is-rec' : 'option'}>
                            <div className="option-head">
                              <span className="gap-no num" aria-hidden="true">{o.kode}</span>
                              <h4>{o.nama}</h4>
                              {o.rekomendasi && <span className="option-badge">Direkomendasikan</span>}
                            </div>
                            <p className="prose">{o.cara}</p>
                            <dl className="option-facts">
                              <div><dt>Kelebihan</dt><dd>{o.kelebihan}</dd></div>
                              <div><dt>Kekurangan</dt><dd>{o.kekurangan}</dd></div>
                              <div><dt>Ukuran akurasi</dt><dd>{o.akurasi}</dd></div>
                            </dl>
                            <Refs ids={o.rujukan} litById={litById} />
                          </li>
                        ))}
                      </ol>
                      {ds.rekomendasi && <p className="prose callout">{ds.rekomendasi}</p>}
                    </>
                  )}

                  {ds.akurasi && (
                    <>
                      <h3>Protokol uji akurasi</h3>
                      <List items={ds.akurasi} />
                    </>
                  )}

                  {ds.skala && (
                    <>
                      <h3>Mekanisme penurunan ke tingkat desa</h3>
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th scope="col">Data asal</th>
                              <th scope="col">Mekanisme</th>
                              <th scope="col">Rumus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ds.skala.map((r) => (
                              <tr key={r.asal}>
                                <td data-label="Data asal">
                                  <strong>{r.asal}</strong>
                                  <span className="lit-source">{r.contoh}</span>
                                </td>
                                <td data-label="Mekanisme">
                                  {r.mekanisme}
                                  <Refs ids={r.rujukan} litById={litById} />
                                </td>
                                <td data-label="Rumus"><code className="formula">{r.rumus}</code></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {ds.catatanSkala && (
                        <>
                          <h3>Catatan penyelarasan</h3>
                          <List items={ds.catatanSkala} />
                        </>
                      )}
                    </>
                  )}
                </section>
              )}

              <section id="literatur" className="block">
                <h2>Tabel literatur</h2>
                <p className="note">Semua tautan mengarah ke DOI atau halaman resmi penerbit.</p>
                <LiteratureTable items={topic.literatur} />
              </section>

              <section id="checkpoint" className="block">
                <h2>Checkpoint pengerjaan</h2>
                {st.error && <p className="error">Data checkpoint gagal dimuat: {st.error}</p>}
                <Checkpoints topic={topic} checkpoints={st.checkpoints} onSave={st.saveCheckpoint} loading={st.loading} tim={st.kolaborator} />
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
