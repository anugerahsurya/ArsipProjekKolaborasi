// Tiap folder di src/projects/<projek>/ berisi project.json dan subfolder <topik>/topik.json.
// Menambah projek atau topik cukup dengan menambah folder baru (template di folder templates/).
const projectFiles = import.meta.glob('./*/project.json', { eager: true, import: 'default' })
const topicFiles = import.meta.glob('./*/*/topik.json', { eager: true, import: 'default' })
// Kode ekstraksi opsional per topik: src/projects/<projek>/<topik>/kode/*
const codeFiles = import.meta.glob('./*/*/kode/*.{js,py,R}', { eager: true, query: '?raw', import: 'default' })
// Metadata variabel keluaran kode (opsional): src/projects/<projek>/<topik>/metadata_variabel.json
const metaFiles = import.meta.glob('./*/*/metadata_variabel.json', { eager: true, import: 'default' })

function kodeOf(topicPath) {
  const base = topicPath.replace('topik.json', 'kode/')
  return Object.fromEntries(
    Object.entries(codeFiles)
      .filter(([p]) => p.startsWith(base))
      .map(([p, isi]) => [p.slice(base.length), isi]),
  )
}

export const projects = Object.entries(projectFiles)
  .map(([path, p]) => {
    const dir = path.split('/')[1]
    const topics = Object.entries(topicFiles)
      .filter(([tp]) => tp.split('/')[1] === dir)
      .map(([tp, t]) => ({ ...t, kodeSumber: kodeOf(tp), metadataVariabel: metaFiles[tp.replace('topik.json', 'metadata_variabel.json')] }))
      .sort((a, b) => a.nomor - b.nomor)
    return { ...p, topics }
  })
  .sort((a, b) => a.nama.localeCompare(b.nama))

export function getProject(id) {
  return projects.find((p) => p.id === id)
}

export function stepsOf(topic) {
  return topic.checkpoint.flatMap((f) => f.langkah)
}

export function deadlineOf(project) {
  return (project.jadwal.find((j) => j.utama) || project.jadwal[0])?.tanggal
}
