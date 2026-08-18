// 참고: GroupBuyResponse에는 productId/원가 필드가 없어 카드에 정가·할인가를 정확히 표시할 수
// 없다. 상품명이 겹치지 않는다는 전제로 상품 목록(GET /products)을 한 번 불러와 이름으로 매칭해
// best-effort로 가격을 보여주고, 매칭 실패 시 가격 없이 할인율/진행률만 보여준다.
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Pagination from '@mui/material/Pagination'
import StorefrontIcon from '@mui/icons-material/Storefront'
import { getGroupBuyList } from '../api/groupBuyApi'
import { getProducts } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import { getErrorMessage } from '../api/errorMessage'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { GROUP_BUY_STATUS, formatPrice, statusMeta } from '../utils/statusMeta'

const PAGE_SIZE = 9

export default function GroupBuyListPage() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0 })
  const [productsByName, setProductsByName] = useState({})
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState('deadline') // deadline: 마감임박순, popular: 인기순

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data ?? []))
      .catch(() => setCategories([]))
    getProducts()
      .then(({ data }) => {
        const map = {}
        ;(data ?? []).forEach((p) => {
          map[p.name] = p
        })
        setProductsByName(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getGroupBuyList({ status: 'RECRUITING', page, size: PAGE_SIZE })
      .then(({ data }) => {
        if (!cancelled) setResult(data)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, '공동구매 목록을 불러오지 못했습니다.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  const sorted = useMemo(() => {
    const copy = [...(result.content ?? [])]
    if (sort === 'popular') {
      copy.sort((a, b) => (b.currentCount ?? 0) - (a.currentCount ?? 0))
    } else {
      copy.sort((a, b) => new Date(a.deadline ?? 0) - new Date(b.deadline ?? 0))
    }
    return copy
  }, [result, sort])

  const activeKeyword = searchParams.get('keyword')

  return (
    <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
      <Box sx={{ width: 180, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
        <Typography variant="overline" color="text.secondary">
          카테고리
        </Typography>
        <Stack spacing={1} sx={{ mt: 1, mb: 3 }}>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            전체
          </Typography>
          {categories.map((c) => (
            <Typography
              key={c.id}
              component={Link}
              to={`/products?categoryId=${c.id}`}
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {c.name}
            </Typography>
          ))}
        </Stack>

        <Typography variant="overline" color="text.secondary">
          정렬
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Typography
            variant="body2"
            fontWeight={sort === 'deadline' ? 700 : 400}
            color={sort === 'deadline' ? 'primary.main' : 'text.secondary'}
            onClick={() => setSort('deadline')}
            sx={{ cursor: 'pointer' }}
          >
            마감임박순
          </Typography>
          <Typography
            variant="body2"
            fontWeight={sort === 'popular' ? 700 : 400}
            color={sort === 'popular' ? 'primary.main' : 'text.secondary'}
            onClick={() => setSort('popular')}
            sx={{ cursor: 'pointer' }}
          >
            인기순
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
          진행중인 공동구매
        </Typography>

        {activeKeyword && (
          <Alert severity="info" sx={{ mb: 2 }}>
            &apos;{activeKeyword}&apos; 검색은 상품 탭에서 확인해주세요.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <LoadingScreen />
        ) : sorted.length === 0 ? (
          <Typography color="text.secondary">진행 중인 공동구매가 없습니다.</Typography>
        ) : (
          <>
            <Grid container spacing={2.5}>
              {sorted.map((gb) => {
                const meta = statusMeta(GROUP_BUY_STATUS, gb.status)
                const target = gb.targetCount ?? 0
                const current = gb.currentCount ?? 0
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0
                const product = productsByName[gb.productName]
                const discounted =
                  product && typeof gb.discountRate === 'number'
                    ? Math.round(product.basePrice * (1 - gb.discountRate))
                    : null

                const daysLeft = Math.ceil((new Date(gb.deadline) - Date.now()) / 86400000)
                const isRecruiting = gb.status === '모집중'
                const isFull = target > 0 && current >= target
                // 정산 배치가 아직 안 돌아서 백엔드 status가 '모집중'으로 남아있어도
                // 목표 인원에 도달했으면 프론트에서 선제적으로 "모집완료"로 보여준다.
                const displayLabel = isRecruiting && isFull ? '모집완료' : isRecruiting ? null : meta.label
                const displayColor = isRecruiting && isFull ? 'success' : meta.color

                return (
                  <Grid item xs={12} sm={6} lg={4} key={gb.groupBuyId}>
                    <Card sx={isFull ? { filter: 'grayscale(0.4)', opacity: 0.85 } : undefined}>
                      <CardActionArea component={Link} to={`/group-buys/${gb.groupBuyId}`}>
                        <Box
                          sx={{
                            position: 'relative',
                            height: 110,
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <StorefrontIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                          {isFull && (
                            <Chip
                              size="small"
                              label="모집완료"
                              color="success"
                              sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 700, color: '#fff' }}
                            />
                          )}
                        </Box>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={700} noWrap gutterBottom>
                            {gb.productName}
                          </Typography>

                          <Stack direction="row" spacing={1} alignItems="baseline">
                            {discounted != null && (
                              <Typography variant="h6" fontWeight={800}>
                                {formatPrice(discounted)}
                              </Typography>
                            )}
                            {product && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textDecoration: 'line-through' }}
                              >
                                {formatPrice(product.basePrice)}
                              </Typography>
                            )}
                            {typeof gb.discountRate === 'number' && (
                              <Chip
                                size="small"
                                label={`${Math.round(gb.discountRate * 100)}%`}
                                sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', fontWeight: 700 }}
                              />
                            )}
                          </Stack>

                          <Box sx={{ mt: 1.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              color={progress >= 100 ? 'success' : 'primary'}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>

                          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {current}/{target}명 참여
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color={`${displayColor}.main`}>
                              {displayLabel ?? (daysLeft > 0 ? `D-${daysLeft}` : '마감임박')}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>

            {result.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
    </Box>
  )
}
