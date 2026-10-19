// Kemajuan digambar sebagai skala batang peta: tiap ruas satu langkah.
export default function ScaleBar({ statuses, label = true, compact = false }) {
  const selesai = statuses.filter((s) => s === 'selesai').length
  const pct = statuses.length ? Math.round((selesai / statuses.length) * 100) : 0
  return (
    <div className={`scalebar ${compact ? 'is-compact' : ''}`}>
      <div className="scalebar-track" role="img" aria-label={`${selesai} dari ${statuses.length} langkah selesai`}>
        {statuses.map((s, i) => (
          <span key={i} className={`scalebar-seg seg-${s}`} />
        ))}
      </div>
      {label && (
        <div className="scalebar-ticks">
          <span>0</span>
          <span className="num">
            {selesai}/{statuses.length} langkah · {pct}%
          </span>
          <span>{statuses.length}</span>
        </div>
      )}
    </div>
  )
}
