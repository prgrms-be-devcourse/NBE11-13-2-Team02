import { useState } from 'react'
import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk'
import {
  createPayment,
  getQueueStatus,
  issueQueueToken,
} from '../api/paymentApi.js'
import './payment.css'

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY

function getErrorMessage(error) {
  if (error.response?.status === 401) return '로그인이 필요합니다.'
  if (!error.response) return error.message || '토스 결제창을 열지 못했습니다.'
  return error.response.data?.message || error.message || '결제 요청에 실패했습니다.'
}

function getRequestStorageKey(participationId, paymentMethod) {
  return `payment-request:${participationId}:${paymentMethod}`
}

function getRequestKey(participationId, paymentMethod) {
  const storageKey = getRequestStorageKey(participationId, paymentMethod)
  const savedKey = sessionStorage.getItem(storageKey)
  if (savedKey) return savedKey

  const newKey = crypto.randomUUID()
  sessionStorage.setItem(storageKey, newKey)
  return newKey
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function waitForAdmission(groupBuyId, queueToken, firstStatus, onWaiting) {
  let queueStatus = firstStatus
  for (let count = 0; count < 120; count += 1) {
    if (queueStatus.status === 'ADMITTED') return
    if (queueStatus.status !== 'WAITING') {
      throw new Error('결제 대기열 상태를 확인할 수 없습니다.')
    }

    onWaiting(queueStatus.position)
    await wait(1000)
    queueStatus = (await getQueueStatus(groupBuyId, queueToken)).data
  }
  throw new Error('결제 대기 시간이 초과되었습니다. 다시 시도해주세요.')
}

export default function PaymentButton({
  groupBuyId,
  participationId,
  productName,
  paymentMethod = 'CARD',
  demoMode = false,
}) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [queueMessage, setQueueMessage] = useState('')

  const requestPayment = async () => {
    if ((!participationId && !demoMode) || loading) return

    setLoading(true)
    setErrorMessage('')
    setQueueMessage('')

    try {
      if (!TOSS_CLIENT_KEY) {
        throw new Error('VITE_TOSS_CLIENT_KEY에 API 개별 연동 클라이언트 키(test_ck_...)를 설정해주세요.')
      }

      let paymentData
      let requestStorageKey = null
      if (demoMode) {
        paymentData = {
          paymentId: null,
          paymentAttemptId: null,
          participationId: null,
          pgOrderId: `demo_${crypto.randomUUID().replaceAll('-', '')}`,
          amount: 1000,
        }
      } else {
        requestStorageKey = getRequestStorageKey(participationId, paymentMethod)
        const idempotencyKey = getRequestKey(participationId, paymentMethod)
        const queueResponse = await issueQueueToken(groupBuyId)
        const queueToken = queueResponse.data.queueToken
        await waitForAdmission(
          groupBuyId,
          queueToken,
          queueResponse.data,
          (position) => setQueueMessage(`결제 대기 ${position}번째입니다.`),
        )
        setQueueMessage('결제 차례가 도착했습니다.')
        const response = await createPayment(
          participationId,
          paymentMethod,
          idempotencyKey,
          queueToken,
        )
        paymentData = response.data
      }

      sessionStorage.setItem(
        `payment-attempt:${paymentData.pgOrderId}`,
        JSON.stringify({
          paymentId: paymentData.paymentId,
          paymentAttemptId: paymentData.paymentAttemptId,
          participationId: paymentData.participationId,
          requestStorageKey,
          demoMode,
          productName: productName || '같이사 공동구매 상품',
          amount: paymentData.amount,
        }),
      )

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: ANONYMOUS })

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: paymentData.amount },
        orderId: paymentData.pgOrderId,
        orderName: productName || '같이사 공동구매 상품',
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      setLoading(false)
    }
  }

  return (
    <div className="payment-action">
      <button
        className="payment-button"
        type="button"
        onClick={requestPayment}
        disabled={(!participationId && !demoMode) || loading}
      >
        {loading ? '결제창 여는 중...' : '결제하기'}
      </button>
      {!participationId && !demoMode && (
        <p className="payment-help">공동구매에 참여한 뒤 결제할 수 있습니다.</p>
      )}
      {demoMode && <p className="payment-help">토스 테스트 결제 · 1,000원</p>}
      {queueMessage && <p className="payment-help">{queueMessage}</p>}
      {errorMessage && <p className="payment-error">{errorMessage}</p>}
    </div>
  )
}
