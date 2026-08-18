import { Link, useSearchParams } from 'react-router-dom'
import '../components/payment.css'

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams()
  const message = searchParams.get('message') || '결제가 취소되었거나 인증에 실패했습니다.'

  return (
    <main className="payment-result">
      <h1>결제 실패</h1>
      <p>{message}</p>
      <Link to="/">공동구매 목록으로</Link>
    </main>
  )
}
