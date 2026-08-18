import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import { getDelivery } from '../api/orderApi.js'
import LoadingScreen from '../components/LoadingScreen.jsx'

const statusText = {
  PREPARING: '배송지 입력 대기',
  SHIPPING: '배송 중',
  DELIVERED: '도착 완료',
}

export default function DeliveryTrackingPage() {
  const { orderId } = useParams()
  const [delivery, setDelivery] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDelivery(orderId)
      .then(({ data }) => setDelivery(data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message ?? '배송 정보를 조회하지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return <LoadingScreen />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!delivery) return null

  const completedDate = delivery.deliveredAt
    ? new Date(delivery.deliveredAt).toLocaleDateString('ko-KR')
    : null

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        배송 조회
      </Typography>

      <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }} variant="outlined">
        <Typography variant="h5" fontWeight={800} color="primary.main">
          {completedDate ? `${completedDate} 도착 완료` : statusText[delivery.deliveryStatus]}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {delivery.deliveryStatus === 'DELIVERED'
            ? '고객님이 주문하신 상품이 배송완료 되었습니다.'
            : '고객님이 주문하신 상품을 자체배송 중입니다.'}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Stack spacing={0.5}>
            <Typography fontWeight={700}>{delivery.carrier}</Typography>
            <Typography variant="body2" color="text.secondary">
              송장번호: 없음
            </Typography>
            {delivery.expectedDeliveryAt && (
              <Typography variant="body2" color="text.secondary">
                배송 예정: {new Date(delivery.expectedDeliveryAt).toLocaleString('ko-KR')}
              </Typography>
            )}
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Stack spacing={0.5}>
            <Typography variant="body2">받는 사람: {delivery.recipientName ?? '-'}</Typography>
            <Typography variant="body2">
              받는 주소: {delivery.address ?? '-'} {delivery.addressDetail ?? ''}
            </Typography>
            <Typography variant="body2">배송 요청사항: {delivery.deliveryRequest || '없음'}</Typography>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
