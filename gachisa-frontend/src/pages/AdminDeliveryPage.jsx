import { useState } from 'react'
import { updateDeliveryStatusByAdmin } from '../api/orderApi.js'

export default function AdminDeliveryPage() {
  const [orderId, setOrderId] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState('SHIPPING')
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    try {
      await updateDeliveryStatusByAdmin(orderId, deliveryStatus)
      setMessage('배송 상태를 변경했습니다.')
    } catch (requestError) {
      setMessage(requestError.response?.data?.message ?? '배송 상태를 변경하지 못했습니다.')
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: '40px auto' }}>
      <h1>관리자 배송 상태 관리</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label>주문 ID<input required value={orderId} onChange={(event) => setOrderId(event.target.value)} /></label>
        <label>배송 상태
          <select value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value)}>
            <option value="PREPARING">배송 준비</option>
            <option value="SHIPPING">배송 중</option>
            <option value="DELIVERED">배송 완료</option>
          </select>
        </label>
        <button>상태 변경</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  )
}
