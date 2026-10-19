import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main className="page page-narrow">
        <h1>Lembar tidak ditemukan</h1>
        <p className="note">Alamat ini tidak cocok dengan projek atau topik mana pun.</p>
        <Link to="/" className="btn">Kembali ke daftar projek</Link>
      </main>
    </>
  )
}
