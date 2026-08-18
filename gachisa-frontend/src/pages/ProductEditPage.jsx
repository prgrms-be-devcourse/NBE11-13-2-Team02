import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../api/errorMessage'
import { getProduct, updateProduct } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import LoadingScreen from '../components/LoadingScreen.jsx'

function flattenCategories(nodes, depth = 0) {
  return (nodes ?? []).flatMap((node) => [
    { id: node.id, label: `${'— '.repeat(depth)}${node.name}` },
    ...flattenCategories(node.children, depth + 1),
  ])
}

export default function ProductEditPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', basePrice: '', categoryId: '', imageUrl: '' })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchProduct = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getProduct(productId)
      setProduct(data)
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        basePrice: data.basePrice ?? '',
        categoryId: data.categoryId ?? '',
        imageUrl: data.imageUrl ?? '',
      })
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
    getCategories()
      .then(({ data }) => setCategories(flattenCategories(data)))
      .catch(() => setCategories([]))
  }, [])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await updateProduct(productId, {
        name: form.name,
        description: form.description,
        basePrice: Number(form.basePrice),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl || undefined,
      })
      navigate(`/products/${productId}`)
    } catch (err) {
      setError(getErrorMessage(err, '상품 수정에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  if (error && !product) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (product && product.sellerId !== user?.id) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
        <Alert severity="warning">본인이 등록한 상품만 수정할 수 있습니다.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          상품 수정
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="상품명" value={form.name} onChange={handleChange('name')} required fullWidth />
            <TextField
              label="설명"
              value={form.description}
              onChange={handleChange('description')}
              required
              fullWidth
              multiline
              minRows={3}
            />
            <TextField
              label="기본 가격"
              type="number"
              value={form.basePrice}
              onChange={handleChange('basePrice')}
              required
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel id="category-select-label">카테고리</InputLabel>
              <Select
                labelId="category-select-label"
                label="카테고리"
                value={form.categoryId}
                onChange={handleChange('categoryId')}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="이미지 URL"
              value={form.imageUrl}
              onChange={handleChange('imageUrl')}
              fullWidth
              placeholder="선택 입력"
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? '수정 중...' : '수정 완료'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
