import { useEffect, useState } from 'react'
import { getGroupBuyList } from '../api/groupBuyApi'
import GroupBuyCard from '../components/GroupBuyCard.jsx'

const STATUS_TABS = [
  { label: '모집중', value: '모집중' },
  { label: '전체', value: null },
]

/** GB-02. 공동구매 목록 조회 */
export default function GroupBuyListPage() {
  const [status, setStatus] = useState('모집중')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getGroupBuyList({ status, page, size: 12 })
      .then(({ data }) => {
        if (!cancelled) setData(data)
      })
      .catch(() => {
        if (!cancelled) setError('목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [status, page])

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>공동구매</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => { setStatus(tab.value); setPage(0) }}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid #ddd',
              background: status === tab.value ? '#e0522f' : '#fff',
              color: status === tab.value ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {!loading && !error && data.content.length === 0 && (
        <p style={{ color: '#888' }}>진행중인 공동구매가 없어요.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {data.content.map((gb) => (
          <GroupBuyCard key={gb.groupBuyId} groupBuy={gb} />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>이전</button>
          <span>{page + 1} / {data.totalPages}</span>
          <button disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>다음</button>
        </div>
      )}
    </div>
  )
}
