import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Chip from '@mui/material/Chip'
import Pagination from '@mui/material/Pagination'
import Alert from '@mui/material/Alert'
import { getMyOrders } from '../api/orderApi'
import { getErrorMessage } from '../api/errorMessage'
import { DELIVERY_STATUS, statusMeta, formatDateTime } from '../utils/statusMeta'
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
          <TableContainer component={Paper} elevation={1}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>주문 ID</TableCell>
                  <TableCell>참여 ID</TableCell>
                  <TableCell>결제 ID</TableCell>
                  <TableCell>배송 상태</TableCell>
                  <TableCell>주문일시</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.content.map((order) => {
                  const meta = statusMeta(DELIVERY_STATUS, order.deliveryStatus)
                  return (
                    <TableRow
                      key={order.orderId}
                      hover
                      onClick={() => navigate(`/my/orders/${order.orderId}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{order.orderId}</TableCell>
                      <TableCell>{order.participationId}</TableCell>
                      <TableCell>{order.paymentId}</TableCell>
                      <TableCell>
                        <Chip size="small" label={meta.label} color={meta.color} />
                      </TableCell>
                      <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

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
