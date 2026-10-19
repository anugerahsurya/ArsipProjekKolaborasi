import { useMemo } from 'react'

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function ring(cx, cy, r, waves, steps = 72) {
  const pts = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const k = waves.reduce((acc, w) => acc + w.a * Math.sin(w.f * t + w.p), 1)
    pts.push([cx + Math.cos(t) * r * k * 1.25, cy + Math.sin(t) * r * k])
  }
  // kurva halus lewat titik tengah antar titik
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  let d = `M${mid(pts[pts.length - 1], pts[0]).join(' ')}`
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % pts.length])
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`
  })
  return d + 'Z'
}

// Peta kontur ilustratif (bukan peta sebenarnya): beberapa bukit, satu sungai.
export default function Contours({ seed = 7, width = 640, height = 420, hills = 3, levels = 7, draw = false, className = '' }) {
  const paths = useMemo(() => {
    const r = rng(seed)
    const out = []
    for (let h = 0; h < hills; h++) {
      const cx = width * (0.2 + r() * 0.6)
      const cy = height * (0.2 + r() * 0.6)
      const max = Math.min(width, height) * (0.22 + r() * 0.18)
      const waves = [1, 2, 3].map((f) => ({ f: f + 1, a: 0.05 + r() * 0.09, p: r() * 6.28 }))
      for (let l = 0; l < levels; l++) {
        out.push({ d: ring(cx, cy, max * (1 - l / levels), waves), index: l, major: l % 4 === 0, hill: h })
      }
    }
    return out
  }, [seed, width, height, hills, levels])

  const river = useMemo(() => {
    const r = rng(seed + 99)
    let d = `M-10 ${height * (0.55 + r() * 0.3)}`
    for (let x = 0; x <= width + 40; x += 80) {
      d += ` S${x + 40} ${height * (0.45 + r() * 0.45)} ${x + 80} ${height * (0.5 + r() * 0.4)}`
    }
    return d
  }, [seed, width, height])

  return (
    <svg className={`contours ${draw ? 'is-drawing' : ''} ${className}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path className="contours-river" d={river} />
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          className={p.major ? 'contour contour-major' : 'contour'}
          style={{ '--i': p.index + p.hill * 2 }}
        />
      ))}
    </svg>
  )
}
