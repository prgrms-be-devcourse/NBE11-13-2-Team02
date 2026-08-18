import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import StorefrontIcon from '@mui/icons-material/Storefront'
import PersonIcon from '@mui/icons-material/Person'
import { getMyParticipations } from '../api/participationApi'
import { getErrorMessage } from '../api/errorMessage'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { PARTICIPATION_STATUS, formatDateTime, statusMeta } from '../utils/statusMeta'

const TABS = [
  { value: 'PARTICIPATING', label: '참여중' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'REFUNDED', label: '환불됨' },
  { value: 'CANCELLED', label: '취소됨' },
]

export default function MyParticipationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('PARTICIPATING')
  const [participations, setParticipations] = useState([])
  const [stats, setStats] = useState({ total: null, confirmed: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    return getMyParticipations({ status: tab, page: 0, size: 50 })
      .then(({ data }) => setParticipations(data.content ?? []))
      .catch((err) => setError(getErrorMessage(err, '참여 이력을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    Promise.all([
      getMyParticipations({ page: 0, size: 1 }),
      getMyParticipations({ status: 'CONFIRMED', page: 0, size: 1 }),
    ])
      .then(([totalRes, confirmedRes]) => {
        setStats({ total: totalRes.data.totalElements, confirmed: confirmedRes.data.totalElements })
      })
      .catch(() => {})
  }, [])

  const goToDetail = (participation) => {
    navigate(`/my/participations/${participation.participationId}`, { state: { participation } })
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Paper sx={{ p: 3 }} variant="outlined">
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.light', color: 'primary.main' }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography fontWeight={800}>{user?.name} 님</Typography>
            <Typography variant="body2" color="text.secondary">
              참여 {stats.total ?? '-'}회 · 성사 {stats.confirmed ?? '-'}회
            </Typography>
          </Box>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ minHeight: 36, mb: 1, borderBottom: '1px solid #ECEEF5' }}
        >
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} sx={{ minHeight: 36, fontWeight: 700 }} />
          ))}
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <LoadingScreen />
        ) : participations.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            해당 상태의 참여 내역이 없습니다.
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {participations.map((p) => {
              const meta = statusMeta(PARTICIPATION_STATUS, p.status)
              return (
                <Stack
                  key={p.participationId}
                  direction="row"
                  alignItems="center"
                  onClick={() => goToDetail(p)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: tab === 'PARTICIPATING' ? 'primary.main' : '#ECEEF5',
                    bgcolor: tab === 'PARTICIPATING' ? 'primary.light' : 'transparent',
                    cursor: 'pointer',
                    gap: 2,
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid #ECEEF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <StorefrontIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>
                      {p.productName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.quantity}개 · {formatDateTime(p.participatedAt)}
                    </Typography>
                  </Box>
                  <Chip size="small" label={meta.label} color={meta.color} />
                </Stack>
              )
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  )
}
