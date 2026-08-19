// 참고: GroupBuyResponse에는 productId/categoryId/원가/이미지 필드가 없어 카드에 이런 정보를
// 정확히 표시하거나 카테고리/키워드/가격으로 필터링할 수 없다. 상품명이 겹치지 않는다는 전제로
// 상품 목록(GET /products, /products/search)을 불러와 이름으로 매칭해 best-effort로 채운다.
// 또한 필터가 걸리면 백엔드 페이지네이션과 클라이언트 필터링이 어긋나므로, 필터가 있을 때는
// 큰 사이즈로 한 번에 가져와 클라이언트에서 걸러서 보여준다(페이지네이션 숨김).
// 가격(최소/최대) 필터는 백엔드 /products/search에 위임하지 않는다 — 그 API는 Product.basePrice(정가)
// 로만 필터링하는데, 할인율은 Product가 아니라 GroupBuy에 있는 값이라 정가 필터는 사용자가 실제로
// 낼 할인가와 어긋난다. 그래서 카테고리/키워드만 백엔드에 위임하고, 가격은 아래 getDiscountedPrice로
// 계산한 할인가 기준으로 클라이언트에서 직접 걸러낸다.
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Pagination from '@mui/material/Pagination'
import Button from '@mui/material/Button'
import StorefrontIcon from '@mui/icons-material/Storefront'
import { getGroupBuyList } from '../api/groupBuyApi'
import { getProducts, searchProducts } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import { getErrorMessage } from '../api/errorMessage'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { GROUP_BUY_STATUS, formatPrice, statusMeta } from '../utils/statusMeta'

const PAGE_SIZE = 9
const FILTERED_SIZE = 100
const SORT_OPTIONS = [
  { value: 'deadline', label: '마감임박순' },
  { value: 'popular', label: '인기순' },
  { value: 'discount', label: '할인가순' },
  { value: 'priceLow', label: '낮은 가격순' },
  { value: 'priceHigh', label: '높은 가격순' },
]

export default function GroupBuyListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryId = searchParams.get('categoryId') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const hasFilter = Boolean(categoryId || keyword || minPrice || maxPrice)

  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0 })
  const [productsByName, setProductsByName] = useState({})
  const [allowedNames, setAllowedNames] = useState(null) // null: 카테고리/키워드 필터 없음(전체 허용)
  const [namesLoading, setNamesLoading] = useState(false)
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

  // 카테고리/키워드가 걸리면 검색 결과 상품명 집합을 구해 공동구매 목록을 걸러낸다.
  // 가격은 여기서 백엔드에 넘기지 않는다 (정가 기준이라 할인가와 어긋남) — sorted에서 직접 필터링한다.
  useEffect(() => {
    if (!categoryId && !keyword) {
      setAllowedNames(null)
      setNamesLoading(false)
      return
    }
    let cancelled = false
    setNamesLoading(true)
    searchProducts({
      categoryId: categoryId || undefined,
      keyword: keyword || undefined,
    })
      .then(({ data }) => {
        if (cancelled) return
        setAllowedNames(new Set((data ?? []).map((p) => p.name)))
      })
      .catch(() => {
        if (!cancelled) setAllowedNames(new Set())
      })
      .finally(() => {
        if (!cancelled) setNamesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [categoryId, keyword])

  useEffect(() => {
    setPage(0)
  }, [categoryId, keyword, minPrice, maxPrice])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getGroupBuyList({ status: 'RECRUITING', page: hasFilter ? 0 : page, size: hasFilter ? FILTERED_SIZE : PAGE_SIZE })
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
  }, [page, hasFilter])

  // GroupBuyResponse에 가격 필드가 없어서, 카드에 이미 표시 중인 best-effort 할인 적용가
  // (상품명 매칭 성공한 경우만 계산됨)를 그대로 가격 정렬 기준으로 재사용한다.
  // 매칭 안 된(가격을 모르는) 항목은 어느 정렬 방향이든 항상 맨 뒤로 보낸다.
  const getDiscountedPrice = (gb) => {
    const product = productsByName[gb.productName]
    if (!product || typeof gb.discountRate !== 'number') return null
    return Math.round(product.basePrice * (1 - gb.discountRate))
  }

  const sorted = useMemo(() => {
    const content = result.content ?? []
    const byNames = allowedNames ? content.filter((gb) => allowedNames.has(gb.productName)) : content
    const hasPriceFilter = minPrice !== '' || maxPrice !== ''
    const filtered = hasPriceFilter
      ? byNames.filter((gb) => {
          const price = getDiscountedPrice(gb)
          if (price == null) return false
          if (minPrice !== '' && price < Number(minPrice)) return false
          if (maxPrice !== '' && price > Number(maxPrice)) return false
          return true
        })
      : byNames
    const copy = [...filtered]
    if (sort === 'popular') {
      copy.sort((a, b) => (b.currentCount ?? 0) - (a.currentCount ?? 0))
    } else if (sort === 'discount') {
      copy.sort((a, b) => (b.discountRate ?? 0) - (a.discountRate ?? 0))
    } else if (sort === 'priceLow' || sort === 'priceHigh') {
      const direction = sort === 'priceLow' ? 1 : -1
      copy.sort((a, b) => {
        const priceA = getDiscountedPrice(a)
        const priceB = getDiscountedPrice(b)
        if (priceA == null && priceB == null) return 0
        if (priceA == null) return 1
        if (priceB == null) return -1
        return (priceA - priceB) * direction
      })
    } else {
      copy.sort((a, b) => new Date(a.deadline ?? 0) - new Date(b.deadline ?? 0))
    }
    return copy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, sort, allowedNames, productsByName, minPrice, maxPrice])

  const activeCategory = categories.find((c) => String(c.id) === categoryId)
  const heading = keyword
    ? `'${keyword}' 검색 결과`
    : activeCategory
      ? `${activeCategory.name} 공동구매`
      : '진행중인 공동구매'

  const handleResetFilter = () => setSearchParams({})

  return (
    <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
      <Box sx={{ width: 180, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
        <Typography variant="overline" color="text.secondary">
          카테고리
        </Typography>
        <Stack spacing={1} sx={{ mt: 1, mb: 3 }}>
          <Typography
            component={Link}
            to="/"
            variant="body2"
            fontWeight={!categoryId ? 700 : 400}
            color={!categoryId ? 'primary.main' : 'text.secondary'}
            sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            전체
          </Typography>
          {categories.map((c) => (
            <Typography
              key={c.id}
              component={Link}
              to={`/?categoryId=${c.id}`}
              variant="body2"
              fontWeight={categoryId === String(c.id) ? 700 : 400}
              color={categoryId === String(c.id) ? 'primary.main' : 'text.secondary'}
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
          {SORT_OPTIONS.map((opt) => (
            <Typography
              key={opt.value}
              variant="body2"
              fontWeight={sort === opt.value ? 700 : 400}
              color={sort === opt.value ? 'primary.main' : 'text.secondary'}
              onClick={() => setSort(opt.value)}
              sx={{ cursor: 'pointer' }}
            >
              {opt.label}
            </Typography>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800}>
            {heading}
          </Typography>
          {hasFilter && (
            <Button size="small" onClick={handleResetFilter} sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
              필터 초기화
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading || namesLoading ? (
          <LoadingScreen />
        ) : sorted.length === 0 ? (
          <Typography color="text.secondary">
            {hasFilter ? '조건에 맞는 진행중인 공동구매가 없습니다.' : '진행 중인 공동구매가 없습니다.'}
          </Typography>
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
                        <Box sx={{ position: 'relative', height: 110 }}>
                          {product?.imageUrl ? (
                            <CardMedia
                              component="img"
                              image={product.imageUrl}
                              alt={gb.productName}
                              sx={{ height: 110, objectFit: 'cover' }}
                            />
                          ) : (
                            <Box
                              sx={{
                                height: 110,
                                bgcolor: 'primary.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <StorefrontIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                            </Box>
                          )}
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

            {!hasFilter && result.totalPages > 1 && (
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
