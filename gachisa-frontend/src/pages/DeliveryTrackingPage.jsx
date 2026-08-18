import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDelivery } from '../api/orderApi.js'

const statusText = {
  PREPARING: '배송지 입력 대기',
  SHIPPING: '배송 중',
  DELIVERED: '도착 완료',
}

export default function DeliveryTrackingPage() {
  const { orderId } = useParams()
  const [delivery, setDelivery] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDelivery(orderId)
      .then(({ data }) => setDelivery(data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message ?? '배송 정보를 조회하지 못했습니다.'))
  }, [orderId])

  if (error) return <p style={styles.message}>{error}</p>
  if (!delivery) return <p style={styles.message}>배송 정보를 불러오는 중입니다.</p>

  const completedDate = delivery.deliveredAt
    ? new Date(delivery.deliveredAt).toLocaleDateString('ko-KR')
    : null

  return (
    <main style={styles.page}>
      <h1>배송 조회</h1>
      <section style={styles.statusBox}>
        <strong style={styles.status}>
          {completedDate ? `${completedDate} 도착 완료` : statusText[delivery.deliveryStatus]}
        </strong>
        <p>{delivery.deliveryStatus === 'DELIVERED'
          ? '고객님이 주문하신 상품이 배송완료 되었습니다.'
          : '고객님이 주문하신 상품을 자체배송 중입니다.'}</p>
      </section>

      <section style={styles.detail}>
        <div>
          <strong>{delivery.carrier}</strong>
          <p>송장번호: 없음</p>
          {delivery.expectedDeliveryAt &&
            <p>배송 예정: {new Date(delivery.expectedDeliveryAt).toLocaleString('ko-KR')}</p>}
        </div>
        <div>
          <p>받는 사람: {delivery.recipientName ?? '-'}</p>
          <p>받는 주소: {delivery.address ?? '-'} {delivery.addressDetail ?? ''}</p>
          <p>배송 요청사항: {delivery.deliveryRequest || '없음'}</p>
        </div>
      </section>
    </main>
  )
}

const styles = {
  page: { maxWidth: 900, margin: '40px auto', padding: 20 },
  statusBox: { padding: 28, textAlign: 'center', background: '#f3f3f3', border: '1px solid #ddd' },
  status: { fontSize: 28 },
  detail: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, marginTop: 30 },
  message: { margin: 40 },
}
