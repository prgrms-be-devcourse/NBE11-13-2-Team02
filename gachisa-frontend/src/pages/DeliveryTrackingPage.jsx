import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import { getDelivery } from '../api/orderApi.js'
import LoadingScreen from '../components/LoadingScreen.jsx'

const statusText = {
  WAITING_FOR_GROUP_BUY: '공동구매 마감 대기',
  PREPARING: '상품 준비 중',
  SHIPPING: '배송 중',
  DELIVERED: '도착 완료',
  CANCELLED: '주문 취소',
  RETURNING: '반품 중',
  RETURNED: '반품 완료',
}

const statusDescription = {
  WAITING_FOR_GROUP_BUY: '공동구매가 성공적으로 마감되면 상품 준비가 시작됩니다.',
  PREPARING: '공동구매가 마감되어 상품을 준비하고 있습니다.',
  SHIPPING: '고객님이 주문하신 상품을 자체배송 중입니다.',
  DELIVERED: '고객님이 주문하신 상품이 배송완료 되었습니다.',
  CANCELLED: '환불 처리되어 주문이 취소되었습니다.',
  RETURNING: '환불 처리에 따라 상품을 반품하고 있습니다.',
  RETURNED: '상품 반품이 완료되었습니다.',
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
          {statusDescription[delivery.deliveryStatus]}
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

      <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={800} gutterBottom>주문 상품</Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          {delivery.productImageUrl ? (
            <Box
              component="img"
              src={delivery.productImageUrl}
              alt={delivery.productName}
              sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, bgcolor: 'grey.100' }}
            />
          ) : (
            <Box sx={{ width: 120, height: 120, borderRadius: 2, bgcolor: 'grey.100',
              display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
              이미지 없음
            </Box>
          )}
          <Stack spacing={0.7}>
            <Typography variant="h6" fontWeight={800}>{delivery.productName}</Typography>
            <Typography color="text.secondary">수량 {delivery.quantity}개</Typography>
            <Typography fontWeight={700}>결제 금액 {Number(delivery.amount).toLocaleString('ko-KR')}원</Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
