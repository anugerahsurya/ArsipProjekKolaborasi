// Tiap folder di src/projects/<projek>/ berisi project.js dan subfolder <topik>/index.js.
// Menambah projek atau topik cukup dengan menambah folder baru.
const projectFiles = import.meta.glob('./*/project.js', { eager: true, import: 'default' })
const topicFiles = import.meta.glob('./*/*/index.js', { eager: true, import: 'default' })

export const projects = Object.entries(projectFiles)
  .map(([path, p]) => {
    const dir = path.split('/')[1]
    const topics = Object.entries(topicFiles)
      .filter(([tp]) => tp.split('/')[1] === dir)
      .map(([, t]) => t)
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
