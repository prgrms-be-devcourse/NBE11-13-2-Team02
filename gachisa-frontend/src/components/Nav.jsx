import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <nav style={{
      display: 'flex', gap: 16, padding: '12px 24px',
      borderBottom: '1px solid #eee', alignItems: 'center',
    }}>
      <Link to="/" style={{ fontWeight: 700, color: '#e0522f', textDecoration: 'none' }}>가치사</Link>
      <Link to="/" style={{ color: '#333', textDecoration: 'none' }}>공동구매</Link>
      <Link to="/my/participations" style={{ color: '#333', textDecoration: 'none' }}>내 참여내역</Link>
    </nav>
  )
}
