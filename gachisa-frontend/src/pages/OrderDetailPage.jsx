import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import { getMyOrder } from '../api/orderApi'
import { getErrorMessage } from '../api/errorMessage'
import { DELIVERY_STATUS, statusMeta, formatDateTime } from '../utils/statusMeta'
import LoadingScreen from '../components/LoadingScreen.jsx'

const DELIVERY_STEPS = ['PREPARING', 'SHIPPING', 'DELIVERED']

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  )
}

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getMyOrder(orderId)
      .then(({ data }) => {
        if (!cancelled) setOrder(data)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, '주문 정보를 불러오지 못했습니다.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  if (loading) return <LoadingScreen />

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Link to="/my/orders">내 주문 목록으로</Link>
      </Box>
    )
  }

  if (!order) return null

  const meta = statusMeta(DELIVERY_STATUS, order.deliveryStatus)
  const activeStep = DELIVERY_STEPS.indexOf(order.deliveryStatus)

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        주문 상세
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {DELIVERY_STEPS.map((step) => (
            <Step key={step} completed={DELIVERY_STEPS.indexOf(step) <= activeStep}>
              <StepLabel>{statusMeta(DELIVERY_STATUS, step).label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={1}>
        <Stack spacing={1.5}>
          <InfoRow label="주문 ID" value={order.orderId} />
          <InfoRow label="참여 ID" value={order.participationId} />
          <InfoRow label="결제 ID" value={order.paymentId} />
          <InfoRow label="배송 상태" value={<Chip size="small" label={meta.label} color={meta.color} />} />
          <Divider />
          <InfoRow label="주문일시" value={formatDateTime(order.createdAt)} />
          <InfoRow label="수정일시" value={formatDateTime(order.updatedAt)} />
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button
          component={Link}
          to={order.deliveryStatus === 'PREPARING' ? `/orders/${order.orderId}/delivery-address` : `/orders/${order.orderId}/delivery`}
          variant="contained"
        >
          {order.deliveryStatus === 'PREPARING' ? '배송지 입력' : '배송 조회'}
        </Button>
        <Button component={Link} to="/my/orders">
          내 주문 목록으로
        </Button>
      </Stack>
    </Box>
  )
}
