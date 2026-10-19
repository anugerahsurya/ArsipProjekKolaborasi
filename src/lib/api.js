const URL = import.meta.env.VITE_APPSCRIPT_URL

export const terhubung = Boolean(URL)

// Tanpa VITE_APPSCRIPT_URL data disimpan di localStorage supaya tetap bisa dicoba lokal.
const LOCAL_KEY = 'pai-db'

function localDb() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { checkpoint: [], projek: [], berkas: [] }
  } catch {
    return { checkpoint: [], projek: [], berkas: [] }
  }
}

function localUpsert(sheet, keys, obj) {
  const db = localDb()
  const i = db[sheet].findIndex((r) => keys.every((k) => r[k] === obj[k]))
  if (i >= 0) db[sheet][i] = obj
  else db[sheet].push(obj)
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(db))
  } catch {}
  return obj
}

async function get(params) {
  const res = await fetch(`${URL}?${new URLSearchParams(params)}`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Gagal memuat data')
  return data
}

async function post(body) {
  // text/plain supaya tidak memicu preflight CORS di Apps Script
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Gagal menyimpan')
  return data.row
}

export async function fetchProjects() {
  if (!URL) return localDb().projek
  return (await get({ action: 'projects' })).projects
}

export async function fetchState(project) {
  if (!URL) {
    const db = localDb()
    const own = (r) => r.project === project
    return {
      projek: db.projek.find(own) || null,
      checkpoints: db.checkpoint.filter(own),
      berkas: db.berkas.filter(own),
    }
  }
  return get({ action: 'state', project })
}

export async function saveCheckpoint(row) {
  if (!URL) return localUpsert('checkpoint', ['project', 'topic', 'stepId'], { ...row, updatedAt: new Date().toISOString() })
  return post({ action: 'checkpoint', ...row })
}

export async function saveProjectStatus(project, status) {
  if (!URL) return localUpsert('projek', ['project'], { project, status, updatedAt: new Date().toISOString() })
  return post({ action: 'projectStatus', project, status })
}

export async function saveLink(row) {
  if (!URL) return localUpsert('berkas', ['project', 'topic', 'jenis'], { ...row, nama: row.url, updatedAt: new Date().toISOString() })
  return post({ action: 'link', ...row })
}

export async function uploadPdf({ project, topic, jenis, file }) {
  if (!URL) throw new Error('Unggah berkas butuh VITE_APPSCRIPT_URL')
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('Berkas tidak bisa dibaca'))
    reader.readAsDataURL(file)
  })
  return post({ action: 'upload', project, topic, jenis, nama: file.name, data })
}
