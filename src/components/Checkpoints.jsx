import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, MessageSquareText, UserRound } from 'lucide-react'
import StatusSymbol, { STATUS } from './StatusSymbol.jsx'
import ScaleBar from './ScaleBar.jsx'
import { stateKey } from '../lib/useProjectState.js'
import { formatTanggalPendek, sisaHari, waktuRelatif } from '../lib/format.js'

function Step({ step, row, onSave }) {
  const status = row?.status || 'belum'
  const [pic, setPic] = useState(row?.pic || '')
  const [catatan, setCatatan] = useState(row?.catatan || '')
  const [open, setOpen] = useState(Boolean(row?.catatan))
  const telat = status !== 'selesai' && sisaHari(step.target) < 0

  const simpan = async (patch, pesan) => {
    try {
      await onSave(patch)
      if (pesan) toast.success(pesan)
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err.message}`)
    }
  }

  return (
    <li className={`step step-${status}`}>
      <div className="step-head">
        <StatusSymbol status={status} size={20} />
        <div className="step-text">
          <h4>{step.judul}</h4>
          <p>{step.isi}</p>
        </div>
        <span className={`step-target num ${telat ? 'is-late' : ''}`} title="Target selesai">
          <CalendarDays size={14} aria-hidden="true" />
          {formatTanggalPendek(step.target)}
        </span>
      </div>

      <div className="step-controls">
        <div className="seg" role="radiogroup" aria-label={`Status ${step.judul}`}>
          {STATUS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={status === s.value}
              className={`seg-btn ${status === s.value ? 'is-on' : ''}`}
              onClick={() => status !== s.value && simpan({ status: s.value, pic, catatan }, `${step.judul}: ${s.label.toLowerCase()}`)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="field field-pic">
          <UserRound size={15} aria-hidden="true" />
          <input
            list="pic-list"
            placeholder="PIC"
            value={pic}
            onChange={(e) => setPic(e.target.value)}
            onBlur={() => pic !== (row?.pic || '') && simpan({ pic, catatan })}
            aria-label={`PIC ${step.judul}`}
          />
        </label>

        <button type="button" className={`btn-ghost ${open ? 'is-on' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <MessageSquareText size={15} aria-hidden="true" />
          Catatan
        </button>
      </div>

      <div className={`collapse ${open ? 'is-open' : ''}`}>
        <div>
          <textarea
            rows={3}
            placeholder="Catatan, kendala, atau tautan hasil"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            onBlur={() => catatan !== (row?.catatan || '') && simpan({ pic, catatan }, 'Catatan tersimpan')}
            aria-label={`Catatan ${step.judul}`}
          />
        </div>
      </div>

      {row?.updatedAt && <div className="step-meta">Diperbarui {waktuRelatif(row.updatedAt)}{row.pic ? ` · ${row.pic}` : ''}</div>}
    </li>
  )
}

export default function Checkpoints({ topic, checkpoints, onSave, loading }) {
  const picList = [...new Set(Object.values(checkpoints).map((r) => r.pic).filter(Boolean))]

  if (loading) {
    return (
      <div className="skeleton-list" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="phases">
      <datalist id="pic-list">
        {picList.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {topic.checkpoint.map((f, fi) => {
        const statuses = f.langkah.map((s) => checkpoints[stateKey(topic.id, s.id)]?.status || 'belum')
        return (
          <section key={f.fase} className="phase">
            <header className="phase-head">
              <h3>
                <span className="phase-no num">{fi + 1}</span>
                {f.fase}
              </h3>
              <ScaleBar statuses={statuses} compact label={false} />
            </header>
            <ol className="steps">
              {f.langkah.map((s) => (
                <Step
                  key={s.id}
                  step={s}
                  row={checkpoints[stateKey(topic.id, s.id)]}
                  onSave={(patch) => onSave(topic.id, s.id, patch)}
                />
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
