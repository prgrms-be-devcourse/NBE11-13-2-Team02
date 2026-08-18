import { Link } from 'react-router-dom'

export default function GroupBuyCard({ groupBuy }) {
  const {
    groupBuyId,
    productName,
    discountRate,
    currentCount,
    targetCount,
    deadline,
    status,
  } = groupBuy

  const progress = targetCount > 0 ? Math.min(100, Math.round((currentCount / targetCount) * 100)) : 0

  return (
    <Link to={`/group-buys/${groupBuyId}`} style={styles.card}>
      <div style={styles.header}>
        <span style={styles.status}>{status}</span>
        <span style={styles.discount}>{Math.round(discountRate * 100)}% 할인</span>
      </div>
      <h3 style={styles.title}>{productName}</h3>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      <div style={styles.footer}>
        <span>{currentCount} / {targetCount}명</span>
        <span>{new Date(deadline).toLocaleString('ko-KR')} 마감</span>
      </div>
    </Link>
  )
}

const styles = {
  card: {
    display: 'block',
    border: '1px solid #e5e5e5',
    borderRadius: 12,
    padding: 16,
    textDecoration: 'none',
    color: 'inherit',
  },
  header: { display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 },
  status: { color: '#666' },
  discount: { color: '#e0522f', fontWeight: 600 },
  title: { margin: '4px 0 12px', fontSize: 16 },
  progressTrack: { height: 6, background: '#eee', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#e0522f' },
  footer: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginTop: 8 },
}
