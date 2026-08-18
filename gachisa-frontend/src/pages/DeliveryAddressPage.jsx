import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { registerDeliveryAddress } from '../api/orderApi.js'

const initialForm = {
  recipientName: '',
  recipientPhone: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  deliveryRequest: '',
}

export default function DeliveryAddressPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const changeForm = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await registerDeliveryAddress(orderId, form)
      navigate(`/orders/${orderId}/delivery`)
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? '배송지를 등록하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={styles.page}>
      <form onSubmit={submit} style={styles.card}>
        <h1>배송지 입력</h1>
        <p>배송지를 입력하면 자체배송이 시작됩니다.</p>

        <label>받는 사람<input required name="recipientName" value={form.recipientName} onChange={changeForm} /></label>
        <label>연락처<input required name="recipientPhone" placeholder="010-1234-5678" value={form.recipientPhone} onChange={changeForm} /></label>
        <label>우편번호<input required name="zipCode" placeholder="06234" value={form.zipCode} onChange={changeForm} /></label>
        <label>주소<input required name="address" value={form.address} onChange={changeForm} /></label>
        <label>상세 주소<input required name="addressDetail" value={form.addressDetail} onChange={changeForm} /></label>
        <label>배송 요청사항<input name="deliveryRequest" value={form.deliveryRequest} onChange={changeForm} /></label>

        {error && <p style={styles.error}>{error}</p>}
        <button disabled={submitting} style={styles.button}>
          {submitting ? '등록 중...' : '배송지 입력 완료'}
        </button>
      </form>
    </main>
  )
}

const styles = {
  page: { maxWidth: 680, margin: '40px auto', padding: 20 },
  card: { display: 'grid', gap: 14, padding: 28, border: '1px solid #ddd', borderRadius: 12 },
  button: { padding: 14, border: 0, borderRadius: 8, color: 'white', background: '#3478f6', fontWeight: 700 },
  error: { color: '#d32f2f' },
}
