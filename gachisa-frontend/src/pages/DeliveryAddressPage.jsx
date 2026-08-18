import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import { registerDeliveryAddress } from '../api/orderApi.js'

const initialForm = {
  recipientName: '',
  recipientPhone: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  deliveryRequest: '',
}

const FIELDS = [
  { name: 'recipientName', label: '받는 사람' },
  { name: 'recipientPhone', label: '연락처', placeholder: '010-1234-5678' },
  { name: 'zipCode', label: '우편번호', placeholder: '06234' },
  { name: 'address', label: '주소' },
  { name: 'addressDetail', label: '상세 주소' },
  { name: 'deliveryRequest', label: '배송 요청사항', required: false },
]

export default function DeliveryAddressPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const changeForm = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await registerDeliveryAddress(orderId, form)
      navigate(`/orders/${orderId}/delivery`)
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? '배송지를 등록하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      <Paper component="form" onSubmit={submit} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          배송지 입력
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          배송지를 입력하면 자체배송이 시작됩니다.
        </Typography>

        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {FIELDS.map((field) => (
            <TextField
              key={field.name}
              name={field.name}
              label={field.label}
              placeholder={field.placeholder}
              value={form[field.name]}
              onChange={changeForm}
              required={field.required !== false}
              fullWidth
            />
          ))}
          <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ py: 1.4 }}>
            {submitting ? '등록 중...' : '배송지 입력 완료'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
