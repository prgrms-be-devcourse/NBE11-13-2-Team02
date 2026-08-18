import { Link, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import CancelIcon from '@mui/icons-material/Cancel'

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams()
  const message = searchParams.get('message') || '결제가 취소되었거나 인증에 실패했습니다.'

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', px: 2 }}>
      <Paper sx={{ p: 5, width: 420, textAlign: 'center' }} variant="outlined">
        <Stack spacing={2.5} alignItems="center">
          <CancelIcon sx={{ fontSize: 48, color: 'error.main' }} />
          <Typography variant="h6" fontWeight={800}>
            결제 실패
          </Typography>
          <Typography color="text.secondary">{message}</Typography>
          <Button component={Link} to="/" variant="contained" fullWidth sx={{ mt: 1 }}>
            공동구매 목록으로
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
