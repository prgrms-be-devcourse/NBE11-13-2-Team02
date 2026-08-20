import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import MenuItem from '@mui/material/MenuItem'
import { registerDeliveryAddress } from '../api/orderApi.js'
import { getSavedDeliveryAddresses } from '../api/savedDeliveryAddressApi.js'
import KakaoAddressFields from '../components/KakaoAddressFields.jsx'

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
]

export default function DeliveryAddressPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const changeForm = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  useEffect(() => {
    getSavedDeliveryAddresses()
      .then(({ data }) => setSavedAddresses(data))
      .catch(() => setError('저장된 배송지를 불러오지 못했습니다.'))
  }, [])

  const selectSavedAddress = (event) => {
    const id = event.target.value
    setSelectedAddressId(id)
    const selected = savedAddresses.find((saved) => saved.id === Number(id))
    if (!selected) {
      setForm(initialForm)
      return
    }
    setForm({
      recipientName: selected.recipientName,
      recipientPhone: selected.recipientPhone,
      zipCode: selected.zipCode,
      address: selected.address,
      addressDetail: selected.addressDetail,
      deliveryRequest: selected.deliveryRequest ?? '',
    })
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
          배송지는 미리 등록할 수 있으며, 공동구매가 성공적으로 마감된 후 상품 준비가 시작됩니다.
        </Typography>

        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            select
            label="저장된 배송지 선택"
            value={selectedAddressId}
            onChange={selectSavedAddress}
            helperText="배송지 관리는 마이페이지에서 할 수 있습니다."
          >
            <MenuItem value="">직접 입력</MenuItem>
            {savedAddresses.map((saved) => (
              <MenuItem key={saved.id} value={saved.id}>
                {saved.addressName} · {saved.recipientName} · {saved.address}
              </MenuItem>
            ))}
          </TextField>
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
          <KakaoAddressFields form={form} setForm={setForm} onError={setError} />
          <TextField
            name="deliveryRequest"
            label="배송 요청사항"
            value={form.deliveryRequest}
            onChange={changeForm}
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ py: 1.4 }}>
            {submitting ? '등록 중...' : '배송지 입력 완료'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
