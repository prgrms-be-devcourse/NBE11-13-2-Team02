import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Pagination from '@mui/material/Pagination'
import Alert from '@mui/material/Alert'
import { getMyOrders } from '../api/orderApi'
import { getErrorMessage } from '../api/errorMessage'
import { DELIVERY_STATUS, statusMeta, formatDateTime, formatPrice } from '../utils/statusMeta'
import LoadingScreen from '../components/LoadingScreen.jsx'

const PAGE_SIZE = 20

export default function MyOrdersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getMyOrders({ page, size: PAGE_SIZE })
      .then(({ data }) => {
        if (!cancelled) setResult(data)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, '주문 목록을 불러오지 못했습니다.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  if (loading) return <LoadingScreen />

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        내 주문 목록
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!error && result && result.content.length === 0 && (
        <Alert severity="info">주문 내역이 없습니다.</Alert>
      )}

      {!error && result && result.content.length > 0 && (
        <>
          <Stack spacing={2}>
            {result.content.map((order) => {
                  const meta = statusMeta(DELIVERY_STATUS, order.deliveryStatus)
                  return (
                    <Paper
                      key={order.orderId}
                      onClick={() => navigate(`/my/orders/${order.orderId}`)}
                      sx={{ p: 2.5, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        {order.productImageUrl ? <Box component="img" src={order.productImageUrl} alt={order.productName}
                          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2 }} />
                          : <Box sx={{ width: 80, height: 80, bgcolor: 'grey.100', borderRadius: 2,
                            display: 'grid', placeItems: 'center' }}>이미지 없음</Box>}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={800}>{order.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            수량 {order.quantity}개 · {formatPrice(order.amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{formatDateTime(order.createdAt)}</Typography>
                        </Box>
                        <Chip size="small" label={meta.label} color={meta.color} />
                      </Stack>
                    </Paper>
                  )
                })}
          </Stack>

          {result.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                page={page + 1}
                count={result.totalPages}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
