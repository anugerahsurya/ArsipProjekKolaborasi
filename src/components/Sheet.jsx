// Garis tepi lembar peta dengan koordinat sudut (kira-kira batas Sumatera Barat).
export default function Sheet({ children, corners = ["0°54' LU", "98°36' BT", "3°30' LS", "101°53' BT"], className = '' }) {
  return (
    <div className={`sheet ${className}`}>
      <span className="corner corner-tl num">{corners[0]} · {corners[1]}</span>
      <span className="corner corner-br num">{corners[2]} · {corners[3]}</span>
      {children}
    </div>
  )
}
