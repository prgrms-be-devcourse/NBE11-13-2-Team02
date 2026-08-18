import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { getErrorMessage } from '../api/errorMessage'
import { createProduct } from '../api/productApi'
import { getCategories } from '../api/categoryApi'

function flattenCategories(nodes, depth = 0) {
  return (nodes ?? []).flatMap((node) => [
    { id: node.id, label: `${'— '.repeat(depth)}${node.name}` },
    ...flattenCategories(node.children, depth + 1),
  ])
}

const emptyOptionRow = { optionName: '', optionValue: '', stock: '' }

export default function ProductCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '', basePrice: '', categoryId: '', imageUrl: '' })
  const [options, setOptions] = useState([{ ...emptyOptionRow }])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(flattenCategories(data)))
      .catch(() => setCategories([]))
  }, [])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleOptionChange = (index, field) => (e) => {
    const value = e.target.value
    setOptions((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const handleAddOptionRow = () => setOptions((prev) => [...prev, { ...emptyOptionRow }])

  const handleRemoveOptionRow = (index) => setOptions((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.categoryId) {
      setError('카테고리를 선택해주세요.')
      return
    }
    if (options.some((row) => !row.optionName || !row.optionValue || row.stock === '')) {
      setError('옵션의 모든 항목을 입력해주세요.')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await createProduct({
        name: form.name,
        description: form.description,
        basePrice: Number(form.basePrice),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl || undefined,
        options: options.map((row) => ({
          optionName: row.optionName,
          optionValue: row.optionValue,
          stock: Number(row.stock),
        })),
      })
      navigate(`/products/${data.id}`)
    } catch (err) {
      setError(getErrorMessage(err, '상품 등록에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          상품 등록
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

            <Divider />
            <Typography variant="subtitle1" fontWeight={600}>
              옵션
            </Typography>
            {options.map((row, index) => (
              <Stack direction="row" spacing={1} alignItems="center" key={index}>
                <TextField
                  label="옵션명"
                  size="small"
                  value={row.optionName}
                  onChange={handleOptionChange(index, 'optionName')}
                  required
                  fullWidth
                />
                <TextField
                  label="옵션값"
                  size="small"
                  value={row.optionValue}
                  onChange={handleOptionChange(index, 'optionValue')}
                  required
                  fullWidth
                />
                <TextField
                  label="재고"
                  type="number"
                  size="small"
                  value={row.stock}
                  onChange={handleOptionChange(index, 'stock')}
                  required
                  sx={{ width: 120 }}
                />
                <IconButton
                  aria-label="옵션 삭제"
                  onClick={() => handleRemoveOptionRow(index)}
                  disabled={options.length === 1}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            ))}
            <Button onClick={handleAddOptionRow} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              옵션 추가
            </Button>

            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? '등록 중...' : '상품 등록'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
