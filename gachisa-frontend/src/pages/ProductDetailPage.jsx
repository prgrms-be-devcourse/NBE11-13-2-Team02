import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../api/errorMessage'
import {
  getProduct,
  deleteProduct,
  resumeProduct,
  addProductOption,
  adjustProductOptionStock,
} from '../api/productApi'
import { fetchActiveGroupBuyIdsByProductName } from '../utils/groupBuyLookup'
import { PRODUCT_STATUS, statusMeta, formatPrice, formatDateTime } from '../utils/statusMeta'
import LoadingScreen from '../components/LoadingScreen.jsx'

const emptyOption = { optionName: '', optionValue: '', stock: '' }

export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user, isSeller } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeGroupBuyId, setActiveGroupBuyId] = useState(undefined)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resuming, setResuming] = useState(false)

  const [newOption, setNewOption] = useState(emptyOption)
  const [optionSubmitting, setOptionSubmitting] = useState(false)
  const [optionError, setOptionError] = useState('')

  const [stockDeltas, setStockDeltas] = useState({})
  const [adjustingId, setAdjustingId] = useState(null)
  const [stockError, setStockError] = useState('')

  const fetchProduct = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getProduct(productId)
      setProduct(data)
    } catch (err) {
      setError(getErrorMessage(err, '상품 정보를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  useEffect(() => {
    if (!product?.name) return
    fetchActiveGroupBuyIdsByProductName()
      .then((map) => setActiveGroupBuyId(map[product.name] ?? null))
      .catch(() => setActiveGroupBuyId(null))
  }, [product?.name])

  if (loading) return <LoadingScreen />
  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }
  if (!product) return null

  const status = statusMeta(PRODUCT_STATUS, product.status)
  const isOwner = isSeller && user?.id === product.sellerId

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProduct(productId)
      navigate('/products')
    } catch (err) {
      setError(getErrorMessage(err, '상품 삭제에 실패했습니다.'))
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleResume = async () => {
    setResuming(true)
    try {
      await resumeProduct(productId)
      await fetchProduct()
    } catch (err) {
      setError(getErrorMessage(err, '판매 재개에 실패했습니다.'))
    } finally {
      setResuming(false)
    }
  }

  const handleAddOption = async (e) => {
    e.preventDefault()
    setOptionError('')
    setOptionSubmitting(true)
    try {
      await addProductOption(productId, {
        optionName: newOption.optionName,
        optionValue: newOption.optionValue,
        stock: Number(newOption.stock),
      })
      setNewOption(emptyOption)
      await fetchProduct()
    } catch (err) {
      setOptionError(getErrorMessage(err, '옵션 추가에 실패했습니다.'))
    } finally {
      setOptionSubmitting(false)
    }
  }

  const handleAdjustStock = async (optionId) => {
    const delta = Number(stockDeltas[optionId])
    if (!delta) return
    setStockError('')
    setAdjustingId(optionId)
    try {
      await adjustProductOptionStock(productId, optionId, delta)
      setStockDeltas((prev) => ({ ...prev, [optionId]: '' }))
      await fetchProduct()
    } catch (err) {
      setStockError(getErrorMessage(err, '재고 조정에 실패했습니다.'))
    } finally {
      setAdjustingId(null)
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h5" fontWeight={700}>
            {product.name}
          </Typography>
          <Chip label={status.label} color={status.color} />
        </Stack>

        {activeGroupBuyId && (
          <Alert
            severity="info"
            sx={{ mt: 2, bgcolor: 'primary.light', color: 'primary.main' }}
            action={
              <Button
                component={Link}
                to={`/group-buys/${activeGroupBuyId}`}
                variant="contained"
                size="small"
                sx={{ whiteSpace: 'nowrap' }}
              >
                참여하러 가기
              </Button>
            }
          >
            이 상품은 공동구매가 진행 중이에요
          </Alert>
        )}

        {product.imageUrl ? (
          <Box
            component="img"
            src={product.imageUrl}
            alt={product.name}
            sx={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 1, my: 2 }}
          />
        ) : (
          <Box
            sx={{
              height: 200,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              my: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              이미지 없음
            </Typography>
          </Box>
        )}

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            카테고리: {product.categoryName ?? '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            판매자: {product.sellerName ?? '-'}
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {formatPrice(product.basePrice)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            등록일: {formatDateTime(product.createdAt)}
          </Typography>
        </Stack>

        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
          {product.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          옵션
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>옵션명</TableCell>
              <TableCell>옵션값</TableCell>
              <TableCell align="right">재고</TableCell>
              {isOwner && <TableCell align="right">재고 조정</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {(product.options ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 4 : 3} align="center">
                  등록된 옵션이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              product.options.map((option) => (
                <TableRow key={option.id}>
                  <TableCell>{option.optionName}</TableCell>
                  <TableCell>{option.optionValue}</TableCell>
                  <TableCell align="right">{option.stock}</TableCell>
                  {isOwner && (
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <TextField
                          type="number"
                          size="small"
                          label="증감 (+/-)"
                          sx={{ width: 120 }}
                          value={stockDeltas[option.id] ?? ''}
                          onChange={(e) =>
                            setStockDeltas((prev) => ({ ...prev, [option.id]: e.target.value }))
                          }
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={adjustingId === option.id}
                          onClick={() => handleAdjustStock(option.id)}
                        >
                          적용
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {stockError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {stockError}
          </Alert>
        )}

        {isOwner && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              옵션 추가
            </Typography>
            <Box component="form" onSubmit={handleAddOption}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                {optionError && <Alert severity="error">{optionError}</Alert>}
                <TextField
                  label="옵션명"
                  size="small"
                  value={newOption.optionName}
                  onChange={(e) => setNewOption((prev) => ({ ...prev, optionName: e.target.value }))}
                  required
                />
                <TextField
                  label="옵션값"
                  size="small"
                  value={newOption.optionValue}
                  onChange={(e) => setNewOption((prev) => ({ ...prev, optionValue: e.target.value }))}
                  required
                />
                <TextField
                  label="재고"
                  type="number"
                  size="small"
                  value={newOption.stock}
                  onChange={(e) => setNewOption((prev) => ({ ...prev, stock: e.target.value }))}
                  required
                />
                <Button type="submit" variant="contained" disabled={optionSubmitting}>
                  옵션 추가
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={2}>
              <Button component={Link} to={`/products/${productId}/edit`} variant="outlined">
                수정
              </Button>
              {product.status === 'STOPPED' && (
                <Button variant="outlined" onClick={handleResume} disabled={resuming}>
                  판매 재개
                </Button>
              )}
              <Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)}>
                삭제
              </Button>
            </Stack>
          </>
        )}
      </Paper>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>상품 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>취소</Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
