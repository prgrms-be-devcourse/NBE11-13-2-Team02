import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import { confirmPayment, getPayment } from '../api/paymentApi.js'
import { useAuth } from '../context/AuthContext.jsx'

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
  const { initializing, isAuthenticated } = useAuth()
  const [message, setMessage] = useState('결제를 승인하고 있습니다.')

  useEffect(() => {
    if (initializing) {
      setMessage('로그인 정보를 확인하고 있습니다.')
      return
    }
    if (!isAuthenticated) {
      setMessage('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.')
      return
    }

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
  }, [initializing, isAuthenticated, navigate, searchParams])

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', px: 2 }}>
      <Paper sx={{ p: 5, width: 420, textAlign: 'center' }} variant="outlined">
        <Stack spacing={2.5} alignItems="center">
          <CircularProgress color="primary" />
          <Typography variant="h6" fontWeight={800}>
            결제 확인 중
          </Typography>
          <Typography color="text.secondary">{message}</Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
