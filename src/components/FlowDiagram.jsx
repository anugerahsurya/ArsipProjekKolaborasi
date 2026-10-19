// Kerangka pikir sebagai rute: tiap tahap satu halte di garis jalan.
export default function FlowDiagram({ alur }) {
  return (
    <ol className="flow">
      {alur.map((a, i) => (
        <li key={a.tahap} className="flow-stop" style={{ '--i': i }}>
          <div className="flow-node">
            <span className="flow-dot" aria-hidden="true" />
            <h4>{a.tahap}</h4>
          </div>
          <ul>
            {a.item.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
