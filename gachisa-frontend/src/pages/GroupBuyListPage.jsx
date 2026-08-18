// 참고: GroupBuyResponse에는 productId/categoryId/원가/이미지 필드가 없어 카드에 이런 정보를
// 정확히 표시하거나 카테고리/키워드/가격으로 필터링할 수 없다. 상품명이 겹치지 않는다는 전제로
// 상품 목록(GET /products, /products/search)을 불러와 이름으로 매칭해 best-effort로 채운다.
// 또한 필터가 걸리면 백엔드 페이지네이션과 클라이언트 필터링이 어긋나므로, 필터가 있을 때는
// 큰 사이즈로 한 번에 가져와 클라이언트에서 걸러서 보여준다(페이지네이션 숨김).
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
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
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Collapse from '@mui/material/Collapse'
import StorefrontIcon from '@mui/icons-material/Storefront'
import TuneIcon from '@mui/icons-material/Tune'
import { getGroupBuyList } from '../api/groupBuyApi'
import { getProducts, searchProducts } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import { getErrorMessage } from '../api/errorMessage'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { GROUP_BUY_STATUS, formatPrice, statusMeta } from '../utils/statusMeta'

const PAGE_SIZE = 9
const FILTERED_SIZE = 100
const emptyForm = { keyword: '', categoryId: '', minPrice: '', maxPrice: '' }

export default function GroupBuyListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryId = searchParams.get('categoryId') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const hasFilter = Boolean(categoryId || keyword || minPrice || maxPrice)

  const [form, setForm] = useState({ keyword, categoryId, minPrice, maxPrice })
  const [filterError, setFilterError] = useState('')
  const [filterOpen, setFilterOpen] = useState(hasFilter)

  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0 })
  const [productsByName, setProductsByName] = useState({})
  const [allowedNames, setAllowedNames] = useState(null) // null: 필터 없음(전체 허용)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState('deadline') // deadline: 마감임박순, popular: 인기순

  // 사이드바 카테고리 클릭 등 URL이 바깥에서 바뀌면 필터 입력폼도 맞춰준다.
  useEffect(() => {
    setForm({ keyword, categoryId, minPrice, maxPrice })
  }, [keyword, categoryId, minPrice, maxPrice])

  // 네비바 검색 등으로 필터가 걸린 채 들어오면 상세검색 패널을 자동으로 펼쳐 보여준다.
  useEffect(() => {
    if (hasFilter) setFilterOpen(true)
  }, [hasFilter])

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

  // 필터가 걸리면 검색 결과 상품명 집합을 구해 공동구매 목록을 걸러낸다.
  useEffect(() => {
    if (!hasFilter) {
      setAllowedNames(null)
      return
    }
    let cancelled = false
    searchProducts({
      categoryId: categoryId || undefined,
      keyword: keyword || undefined,
      minPrice: minPrice === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
    })
      .then(({ data }) => {
        if (cancelled) return
        setAllowedNames(new Set((data ?? []).map((p) => p.name)))
      })
      .catch(() => {
        if (!cancelled) setAllowedNames(new Set())
      })
    return () => {
      cancelled = true
    }
  }, [hasFilter, categoryId, keyword, minPrice, maxPrice])

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

  const sorted = useMemo(() => {
    const content = result.content ?? []
    const filtered = allowedNames ? content.filter((gb) => allowedNames.has(gb.productName)) : content
    const copy = [...filtered]
    if (sort === 'popular') {
      copy.sort((a, b) => (b.currentCount ?? 0) - (a.currentCount ?? 0))
    } else {
      copy.sort((a, b) => new Date(a.deadline ?? 0) - new Date(b.deadline ?? 0))
    }
    return copy
  }, [result, sort, allowedNames])

  const activeCategory = categories.find((c) => String(c.id) === categoryId)
  const heading = keyword
    ? `'${keyword}' 검색 결과`
    : activeCategory
      ? `${activeCategory.name} 공동구매`
      : '진행중인 공동구매'

  const handleFormChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  // 가격 필드는 음수 입력 자체를 막는다 (타이핑/붙여넣기 모두 무시)
  const handlePriceChange = (field) => (e) => {
    const value = e.target.value
    if (value !== '' && Number(value) < 0) return
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    setFilterError('')

    const min = form.minPrice === '' ? null : Number(form.minPrice)
    const max = form.maxPrice === '' ? null : Number(form.maxPrice)

    if ((min !== null && min < 0) || (max !== null && max < 0)) {
      setFilterError('가격은 0원 이상으로 입력해주세요.')
      return
    }
    if (min !== null && max !== null && min > max) {
      setFilterError('최소 가격이 최대 가격보다 클 수 없습니다.')
      return
    }

    const next = {}
    if (form.keyword) next.keyword = form.keyword
    if (form.categoryId) next.categoryId = form.categoryId
    if (form.minPrice !== '') next.minPrice = form.minPrice
    if (form.maxPrice !== '') next.maxPrice = form.maxPrice
    setSearchParams(next)
  }

  const handleResetFilter = () => {
    setFilterError('')
    setForm(emptyForm)
    setSearchParams({})
  }

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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800}>
            {heading}
          </Typography>
          <Button
            size="small"
            startIcon={<TuneIcon fontSize="small" />}
            onClick={() => setFilterOpen((v) => !v)}
            sx={{ color: hasFilter ? 'primary.main' : 'text.secondary', whiteSpace: 'nowrap' }}
          >
            상세검색{hasFilter && ' · 적용중'}
          </Button>
        </Stack>

        <Collapse in={filterOpen}>
          <Paper component="form" onSubmit={handleFilterSubmit} sx={{ p: 2, mb: 3 }}>
            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              spacing={2}
              alignItems="center"
            >
              <TextField
                label="키워드"
                value={form.keyword}
                onChange={handleFormChange('keyword')}
                size="small"
                sx={{ flex: '1 1 200px' }}
              />
              <FormControl size="small" sx={{ width: 160, flexShrink: 0 }}>
                <InputLabel id="groupbuy-category-filter-label">카테고리</InputLabel>
                <Select
                  labelId="groupbuy-category-filter-label"
                  label="카테고리"
                  value={form.categoryId}
                  onChange={handleFormChange('categoryId')}
                >
                  <MenuItem value="">전체</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="최소 가격"
                type="number"
                value={form.minPrice}
                onChange={handlePriceChange('minPrice')}
                inputProps={{ min: 0 }}
                size="small"
                sx={{ width: 160, flexShrink: 0 }}
              />
              <TextField
                label="최대 가격"
                type="number"
                value={form.maxPrice}
                onChange={handlePriceChange('maxPrice')}
                inputProps={{ min: 0 }}
                size="small"
                sx={{ width: 160, flexShrink: 0 }}
              />
              <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                검색
              </Button>
              {hasFilter && (
                <Button onClick={handleResetFilter} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  초기화
                </Button>
              )}
            </Stack>
            {filterError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {filterError}
              </Alert>
            )}
          </Paper>
        </Collapse>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading || (hasFilter && allowedNames === null) ? (
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
