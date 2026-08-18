import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyParticipations, cancelParticipation } from '../api/participationApi'

const STATUS_FILTERS = ['전체', '참여중', '확정', '환불됨', '취소됨']

/** PT-04 (참여 이력 조회) + PT-02 (참여 취소) */
export default function MyParticipationsPage() {
  const [statusFilter, setStatusFilter] = useState('전체')
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelingId, setCancelingId] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getMyParticipations({ status: statusFilter === '전체' ? undefined : statusFilter })
      .then(({ data }) => setData(data))
      .catch(() => setError('참여 이력을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const handleCancel = async (participationId) => {
    if (!window.confirm('참여를 취소하시겠어요?')) return
    setCancelingId(participationId)
    try {
      await cancelParticipation(participationId)
      load() // 목록 갱신
    } catch (err) {
      const message = err?.response?.data?.message
      alert(message || '취소에 실패했어요. 이미 확정된 참여는 환불로만 처리돼요.')
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>내 참여 내역</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: '1px solid #ddd',
              background: statusFilter === s ? '#e0522f' : '#fff',
              color: statusFilter === s ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && !error && data.content.length === 0 && (
        <p style={{ color: '#888' }}>참여 내역이 없어요.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.content.map((p) => (
          <li
            key={p.participationId}
            style={{
              border: '1px solid #eee',
              borderRadius: 10,
              padding: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Link to={`/group-buys/${p.groupBuyId}`} style={{ fontWeight: 600, color: '#222' }}>
                {p.productName}
              </Link>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
                {p.status} · {p.quantity}개 · {new Date(p.participatedAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
            {p.status === '참여중' && (
              <button
                onClick={() => handleCancel(p.participationId)}
                disabled={cancelingId === p.participationId}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                {cancelingId === p.participationId ? '취소중...' : '취소'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
