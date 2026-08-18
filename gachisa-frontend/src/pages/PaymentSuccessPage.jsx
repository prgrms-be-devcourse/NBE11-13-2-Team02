import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPayment, getPayment } from '../api/paymentApi.js'

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const responseData = (response) => response.data?.data ?? response.data
const confirmationRequests = new Map()

async function waitForFinalPayment(paymentId) {
  for (let count = 0; count < 5; count += 1) {
    const payment = responseData(await getPayment(paymentId))
    if (payment.paymentStatus === 'PAID' || payment.attemptStatus !== 'PROCESSING') {
      return payment
    }
    await wait(1000)
  }
  return null
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('결제를 승인하고 있습니다.')

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const pgOrderId = searchParams.get('orderId')
    const amount = Number(searchParams.get('amount'))
    const savedAttempt = sessionStorage.getItem(`payment-attempt:${pgOrderId}`)

    if (!paymentKey || !pgOrderId || !amount || !savedAttempt) {
      setMessage('결제 승인에 필요한 정보가 없습니다.')
      return
    }

    const paymentAttempt = JSON.parse(savedAttempt)
    let confirmationRequest = confirmationRequests.get(paymentAttempt.paymentAttemptId)
    if (!confirmationRequest) {
      confirmationRequest = confirmPayment(
        paymentAttempt.paymentAttemptId,
        paymentKey,
        pgOrderId,
        amount,
      )
      confirmationRequests.set(paymentAttempt.paymentAttemptId, confirmationRequest)
    }

    confirmationRequest
      .then(async (response) => {
        let payment = responseData(response)
        if (payment.attemptStatus === 'PROCESSING') {
          payment = await waitForFinalPayment(paymentAttempt.paymentId)
        }

        if (payment?.paymentStatus === 'PAID' && payment.orderId) {
          sessionStorage.removeItem(`payment-attempt:${pgOrderId}`)
          navigate(`/orders/${payment.orderId}/delivery-address`, { replace: true })
          return
        }
        setMessage('결제 결과를 확인하고 있습니다. 잠시 후 다시 시도해주세요.')
      })
      .catch((error) => {
        setMessage(error.response?.data?.message ?? '결제 승인에 실패했습니다.')
      })
  }, [navigate, searchParams])

  return (
    <main style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
      <h1>결제 확인</h1>
      <p>{message}</p>
    </main>
  )
}
