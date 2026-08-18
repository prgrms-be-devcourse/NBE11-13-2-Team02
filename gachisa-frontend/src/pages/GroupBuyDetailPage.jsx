import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getGroupBuyDetail } from '../api/groupBuyApi'
import { participate } from '../api/participationApi'
import { useCountdown } from '../hooks/useCountdown'
import { useParticipationCount } from '../hooks/useParticipationCount'

/**
 * GB-03 (상세 조회) + PT-01 (참여) 화면.
 * 실시간 참여 인원은 useParticipationCount 훅으로 5초마다 폴링해서 갱신한다.
 */
export default function GroupBuyDetailPage() {
  const { groupBuyId } = useParams()

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [participateError, setParticipateError] = useState(null)
  const [participateSuccess, setParticipateSuccess] = useState(false)

  // 폴링으로 최신 참여 인원을 계속 받아온다 (초기값은 상세 조회 결과로 세팅)
  const liveCount = useParticipationCount(groupBuyId)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getGroupBuyDetail(groupBuyId)
      .then(({ data }) => {
        if (!cancelled) setDetail(data)
      })
      .catch(() => {
        if (!cancelled) setError('공동구매 정보를 불러오지 못했어요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [groupBuyId])

  const { label: remainingLabel } = useCountdown(detail?.remainingSeconds)

  // 폴링 값이 오면 그걸 우선 쓰고, 아직 안 왔으면 상세 조회 결과를 보여준다
  const currentCount = liveCount?.currentCount ?? detail?.currentCount ?? 0
  const targetCount = liveCount?.targetCount ?? detail?.targetCount ?? 0
  const isRecruiting = detail?.status === '모집중'
  const isFull = targetCount > 0 && currentCount >= targetCount

  const handleParticipate = async () => {
    setSubmitting(true)
    setParticipateError(null)
    try {
      await participate(groupBuyId, quantity)
      setParticipateSuccess(true)
    } catch (err) {
      const message = err?.response?.data?.message
      if (err?.response?.status === 409) {
        setParticipateError(message || '정원이 마감되었거나 이미 종료된 공동구매예요.')
      } else if (err?.response?.status === 401) {
        setParticipateError('로그인이 필요해요.')
      } else {
        setParticipateError('참여 신청 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p style={{ padding: 24 }}>불러오는 중...</p>
  if (error) return <p style={{ padding: 24, color: 'crimson' }}>{error}</p>
  if (!detail) return null

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <span style={{ fontSize: 13, color: '#888' }}>{detail.status}</span>
      <h1 style={{ margin: '4px 0 4px' }}>{detail.productName}</h1>
      <p style={{ color: '#666' }}>{detail.optionName}: {detail.optionValue}</p>

      <div style={{ margin: '20px 0', padding: 16, background: '#faf7f5', borderRadius: 12 }}>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#e0522f', margin: 0 }}>
          {Math.round(detail.discountRate * 100)}% 할인
        </p>
        <p style={{ margin: '8px 0 0' }}>
          <strong>{currentCount}</strong> / {targetCount}명 참여 중 ({detail.progressRate ?? Math.round((currentCount / (targetCount || 1)) * 100)}%)
        </p>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>{remainingLabel}</p>
      </div>

      {isRecruiting && !isFull && (
        <div>
          <label>
            참여 수량:{' '}
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              style={{ width: 60 }}
            />
          </label>
          <button
            onClick={handleParticipate}
            disabled={submitting || participateSuccess}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 12,
              padding: 14,
              background: '#e0522f',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              opacity: submitting || participateSuccess ? 0.6 : 1,
            }}
          >
            {participateSuccess ? '참여 완료' : submitting ? '처리중...' : '참여하기'}
          </button>
          {participateError && <p style={{ color: 'crimson', marginTop: 8 }}>{participateError}</p>}
          {participateSuccess && <p style={{ color: '#2f9e44', marginTop: 8 }}>참여가 완료됐어요! 마감 후 결과를 확인해주세요.</p>}
        </div>
      )}

      {(!isRecruiting || isFull) && (
        <p style={{ color: '#888' }}>
          {isFull ? '정원이 마감되었어요.' : `이 공동구매는 ${detail.status} 상태예요.`}
        </p>
      )}
    </div>
  )
}
