import { Link } from 'react-router-dom'
import { ChevronRight, CloudOff } from 'lucide-react'
import { terhubung } from '../lib/api.js'

export default function TopBar({ trail = [] }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <rect x="2" y="2" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M6 20c4-6 8-1 12-5s6-6 8-3" fill="none" stroke="var(--contour)" strokeWidth="2" />
            <path d="M6 25c5-4 9 0 13-3s5-4 7-2" fill="none" stroke="var(--water)" strokeWidth="2" />
          </svg>
          <span>Projek Artikel Ilmiah</span>
        </Link>
        {trail.length > 0 && (
          <nav className="crumbs" aria-label="Lokasi">
            {trail.map((t, i) => (
              <span key={i} className="crumb">
                <ChevronRight size={14} aria-hidden="true" />
                {t.to ? <Link to={t.to}>{t.label}</Link> : <span aria-current="page">{t.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {!terhubung && (
          <span className="offline" title="VITE_APPSCRIPT_URL belum diisi, data tersimpan di browser ini saja">
            <CloudOff size={14} aria-hidden="true" />
            <span>Tersimpan lokal</span>
          </span>
        )}
      </div>
    </header>
  )
}
