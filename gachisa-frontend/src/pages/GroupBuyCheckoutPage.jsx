import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import StorefrontIcon from '@mui/icons-material/Storefront'
import { getGroupBuyDetail } from '../api/groupBuyApi'
import { getProduct } from '../api/productApi'
import { participate } from '../api/participationApi'
import { issueQueueToken, getQueueStatus, createPayment } from '../api/paymentApi'
import { getErrorMessage } from '../api/errorMessage'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { formatPrice } from '../utils/statusMeta'

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
// 정책상 1인당 참여 수량은 항상 1개로 고정한다 (수량 선택 UI 없음).
const PARTICIPATION_QUANTITY = 1

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

export default function GroupBuyCheckoutPage() {
  const { groupBuyId } = useParams()
  const navigate = useNavigate()

  const [groupBuy, setGroupBuy] = useState(null)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CARD')
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  // 결제 단계에서 실패해 재시도하더라도 참여 신청(participate)은 세션당 한 번만 호출한다.
  const participationRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getGroupBuyDetail(groupBuyId)
      .then(async ({ data }) => {
        if (cancelled) return
        setGroupBuy(data)
        if (data.productId) {
          const { data: productData } = await getProduct(data.productId)
          if (!cancelled) setProduct(productData)
        }
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, '공동구매 정보를 불러오지 못했습니다.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [groupBuyId])

  if (loading) return <LoadingScreen />
  if (error && !groupBuy) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }
  if (!groupBuy || !product) return null

  const originalPrice = product.basePrice * PARTICIPATION_QUANTITY
  const discountAmount = Math.round(product.basePrice * groupBuy.discountRate) * PARTICIPATION_QUANTITY
  const totalPrice = originalPrice - discountAmount

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      if (!TOSS_CLIENT_KEY) {
        throw new Error('VITE_TOSS_CLIENT_KEY 환경변수가 설정되어 있지 않습니다.')
      }

      if (!participationRef.current) {
        setStatusMessage('참여 신청 중...')
        const { data } = await participate(groupBuyId, PARTICIPATION_QUANTITY)
        participationRef.current = data
      }
      const participation = participationRef.current

      setStatusMessage('결제 대기열 확인 중...')
      const idempotencyKey = crypto.randomUUID()
      const queueResponse = await issueQueueToken(groupBuyId)
      const queueToken = queueResponse.data.queueToken
      await waitForAdmission(groupBuyId, queueToken, queueResponse.data, (position) =>
        setStatusMessage(`결제 대기 ${position}번째입니다...`),
      )

      setStatusMessage('결제 정보 생성 중...')
      const { data: paymentData } = await createPayment(
        participation.participationId,
        paymentMethod,
        idempotencyKey,
        queueToken,
      )

      sessionStorage.setItem(
        `payment-attempt:${paymentData.pgOrderId}`,
        JSON.stringify({
          paymentId: paymentData.paymentId,
          paymentAttemptId: paymentData.paymentAttemptId,
          participationId: paymentData.participationId,
          demoMode: false,
          productName: groupBuy.productName,
          amount: paymentData.amount,
        }),
      )

      setStatusMessage('결제창 여는 중...')
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: ANONYMOUS })

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: paymentData.amount },
        orderId: paymentData.pgOrderId,
        orderName: groupBuy.productName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
        card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false },
      })
    } catch (err) {
      setError(getErrorMessage(err, err.message || '참여/결제 처리에 실패했습니다.'))
      setSubmitting(false)
      setStatusMessage('')
    }
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        참여 신청 / 결제
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <StorefrontIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography fontWeight={700}>{groupBuy.productName}</Typography>
              <Typography variant="body2" color="text.secondary">
                수량 {PARTICIPATION_QUANTITY}개
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">정가</Typography>
              <Typography color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                {formatPrice(originalPrice)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">할인 금액</Typography>
              <Typography color="secondary.dark" fontWeight={700}>
                -{formatPrice(discountAmount)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">배송비</Typography>
              <Typography>무료</Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={800}>총 결제 금액</Typography>
            <Typography fontWeight={800} variant="h6">
              {formatPrice(totalPrice)}
            </Typography>
          </Stack>

          <Box>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              결제 수단
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={paymentMethod}
              onChange={(_, v) => v && setPaymentMethod(v)}
            >
              <ToggleButton value="CARD">신용카드</ToggleButton>
              <ToggleButton value="EASY_PAY">간편결제</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Alert severity="warning" icon={false} sx={{ bgcolor: '#FFF7ED', color: '#9A3412' }}>
            목표 미달 시 결제 금액은 자동 환불돼요
          </Alert>

          <Button
            variant="contained"
            color="secondary"
            size="large"
            disabled={submitting}
            onClick={handleSubmit}
            sx={{ py: 1.6 }}
          >
            {submitting ? statusMessage || '처리 중...' : `${formatPrice(totalPrice)} 결제하고 참여하기`}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
