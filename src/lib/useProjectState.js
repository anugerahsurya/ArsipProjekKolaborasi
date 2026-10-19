import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './api.js'

const key = (...p) => p.join('|')

export function useProjectState(project) {
  const [state, setState] = useState({ loading: true, error: null, projek: null, checkpoints: {}, berkas: {} })
  const ref = useRef(state)
  ref.current = state

  const load = useCallback(async () => {
    try {
      const data = await api.fetchState(project.id)
      setState({
        loading: false,
        error: null,
        projek: data.projek,
        checkpoints: Object.fromEntries(data.checkpoints.map((r) => [key(r.topic, r.stepId), r])),
        berkas: Object.fromEntries(data.berkas.map((r) => [key(r.topic, r.jenis), r])),
      })
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }))
    }
  }, [project.id])

  useEffect(() => {
    load()
  }, [load])

  const saveCheckpoint = useCallback(
    async (topic, stepId, patch) => {
      const k = key(topic, stepId)
      const prev = ref.current.checkpoints[k]
      const next = { status: 'belum', pic: '', catatan: '', ...prev, ...patch, project: project.id, topic, stepId }
      ref.current = { ...ref.current, checkpoints: { ...ref.current.checkpoints, [k]: next } }
      setState((s) => ({ ...s, checkpoints: { ...s.checkpoints, [k]: next } }))
      try {
        const row = await api.saveCheckpoint(next)
        setState((s) => ({ ...s, checkpoints: { ...s.checkpoints, [k]: { ...next, ...row } } }))
      } catch (err) {
        setState((s) => ({ ...s, checkpoints: { ...s.checkpoints, [k]: prev } }))
        throw err
      }
    },
    [project.id],
  )

  const setProjectStatus = useCallback(
    async (status) => {
      const row = await api.saveProjectStatus(project.id, status)
      setState((s) => ({ ...s, projek: row }))
    },
    [project.id],
  )

  const saveBerkas = useCallback(
    async (topic, jenis, input) => {
      const row =
        jenis === 'link'
          ? await api.saveLink({ project: project.id, topic, jenis, url: input })
          : await api.uploadPdf({ project: project.id, topic, jenis, file: input })
      setState((s) => ({ ...s, berkas: { ...s.berkas, [key(topic, jenis)]: row } }))
    },
    [project.id],
  )

  const statusProjek = state.projek?.status || project.status

  return { ...state, statusProjek, saveCheckpoint, setProjectStatus, saveBerkas, reload: load }
}

export function progressOf(topic, checkpoints) {
  const steps = topic.checkpoint.flatMap((f) => f.langkah)
  const statuses = steps.map((s) => checkpoints[key(topic.id, s.id)]?.status || 'belum')
  return {
    total: steps.length,
    selesai: statuses.filter((s) => s === 'selesai').length,
    proses: statuses.filter((s) => s === 'proses').length,
    statuses,
  }
}

export { key as stateKey }
