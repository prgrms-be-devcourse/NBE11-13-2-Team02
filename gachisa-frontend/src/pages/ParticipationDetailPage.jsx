import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import StorefrontIcon from '@mui/icons-material/Storefront'
import { getGroupBuyDetail } from '../api/groupBuyApi'
import { getProduct } from '../api/productApi'
import { cancelParticipation } from '../api/participationApi'
import { getErrorMessage } from '../api/errorMessage'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { PARTICIPATION_STATUS, formatPrice, formatDateTime, statusMeta } from '../utils/statusMeta'

export default function ParticipationDetailPage() {
  const { participationId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const participation = location.state?.participation

  const [groupBuy, setGroupBuy] = useState(null)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!participation) {
      setLoading(false)
      return
    }
    let cancelled = false
    getGroupBuyDetail(participation.groupBuyId)
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
  }, [participation])

  if (!participation) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto' }}>
        <Alert severity="warning">
          참여 정보를 찾을 수 없습니다. 내 참여 이력 목록에서 다시 접속해주세요.
        </Alert>
        <Button component={Link} to="/my/participations" sx={{ mt: 2 }}>
          내 참여 이력으로
        </Button>
      </Box>
    )
  }

  if (loading) return <LoadingScreen />

  const meta = statusMeta(PARTICIPATION_STATUS, participation.status)
  const canCancel = participation.status === '참여중'

  const handleCancel = async () => {
    if (!window.confirm('참여를 취소하고 전액 환불받으시겠습니까?')) return
    setCancelling(true)
    setError('')
    try {
      await cancelParticipation(participationId)
      navigate('/my/participations', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, '참여 취소에 실패했습니다.'))
    } finally {
      setCancelling(false)
    }
  }

  const target = groupBuy?.targetCount ?? 0
  const current = groupBuy?.currentCount ?? 0
  const progress = groupBuy?.progressRate ?? (target > 0 ? (current / target) * 100 : 0)
  const daysLeft = groupBuy ? Math.ceil((new Date(groupBuy.deadline) - Date.now()) / 86400000) : null
  const amount =
    product && groupBuy && typeof groupBuy.discountRate === 'number'
      ? Math.round(product.basePrice * (1 - groupBuy.discountRate)) * participation.quantity
      : null

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={800}>
            참여 상세
          </Typography>
          <Chip size="small" label={meta.label} color={meta.color} />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={2} alignItems="center" sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1.5, mb: 2.5 }}>
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
            <Typography fontWeight={700}>{participation.productName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {product ? `${formatPrice(product.basePrice)} · ` : ''}수량 {participation.quantity}개
            </Typography>
          </Box>
        </Stack>

        {groupBuy && (
          <Box sx={{ mb: 2.5 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, progress)}
              color={progress >= 100 ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
              <Typography variant="body2" fontWeight={700}>
                {current}/{target}명 참여
              </Typography>
              {groupBuy.status === '모집중' && (
                <Typography variant="body2" fontWeight={700} color="secondary.dark">
                  마감까지 {daysLeft > 0 ? `D-${daysLeft}` : '마감임박'}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1} sx={{ mb: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">참여 신청일</Typography>
            <Typography>{formatDateTime(participation.participatedAt)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">결제 금액</Typography>
            <Typography fontWeight={700}>{formatPrice(amount)}</Typography>
          </Stack>
        </Stack>

        {canCancel && (
          <>
            <Alert severity="info" icon={false} sx={{ bgcolor: 'grey.100', color: 'text.secondary', mb: 2 }}>
              마감 전까지는 언제든 취소하고 전액 환불받을 수 있어요
            </Alert>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="large"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? '취소 처리 중...' : '참여 취소하기'}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  )
}
