import { useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import { runConcurrencyStress } from '../api/concurrencyApi'
import { getParticipationCount } from '../api/participationApi'
import { getErrorMessage } from '../api/errorMessage'

const MODES = [
  {
    value: 'UNSAFE',
    label: 'UNSAFE (락 없음)',
    hint: 'read-check-write. 초과 모집(oversell)이 날 수 있음',
  },
  {
    value: 'DB_LOCK',
    label: 'DB_LOCK (비관적 락)',
    hint: 'SELECT FOR UPDATE만 사용',
  },
  {
    value: 'REDIS_AND_DB',
    label: 'REDIS_AND_DB (권장)',
    hint: 'Redis 원자 예약 + DB 비관적 락',
  },
]

export default function ConcurrencyDemoPage() {
  const [groupBuyId, setGroupBuyId] = useState('')
  const [mode, setMode] = useState('UNSAFE')
  const [threadCount, setThreadCount] = useState(30)
  const [quantityPerRequest, setQuantityPerRequest] = useState(1)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [liveCount, setLiveCount] = useState(null)

  const refreshCount = useCallback(() => {
    if (!groupBuyId) return
    getParticipationCount(groupBuyId)
      .then(({ data }) => setLiveCount(data))
      .catch(() => setLiveCount(null))
  }, [groupBuyId])

  useEffect(() => {
    if (!groupBuyId) {
      setLiveCount(null)
      return undefined
    }
    refreshCount()
    const timer = setInterval(refreshCount, 1000)
    return () => clearInterval(timer)
  }, [groupBuyId, refreshCount])

  const handleRun = async () => {
    setError('')
    setResult(null)
    if (!groupBuyId) {
      setError('공동구매 ID를 입력하세요.')
      return
    }
    setRunning(true)
    try {
      const { data } = await runConcurrencyStress(groupBuyId, {
        mode,
        threadCount: Number(threadCount),
        quantityPerRequest: Number(quantityPerRequest),
      })
      setResult(data)
      refreshCount()
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          '동시성 테스트에 실패했습니다. local 프로필·판매자/관리자 로그인·Redis를 확인하세요.',
        ),
      )
    } finally {
      setRunning(false)
    }
  }

  const progress =
    liveCount && liveCount.targetCount > 0
      ? Math.min(100, (liveCount.currentCount / liveCount.targetCount) * 100)
      : 0

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        공동구매 동시성 검증
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        같은 공동구매에 동시에 예약을 걸어 currentCount가 target을 넘는지 확인합니다. 실행 시 DB/Redis
        currentCount를 0으로 되돌린 뒤 경쟁하므로, 이미 마감된 공동구매여도 테스트할 수 있습니다.
        Participation 레코드는 만들지 않습니다. (local 프로필 전용 API)
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="공동구매 ID"
            value={groupBuyId}
            onChange={(e) => setGroupBuyId(e.target.value.trim())}
            size="small"
            fullWidth
          />
          <TextField
            select
            label="모드"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            size="small"
            fullWidth
            helperText={MODES.find((m) => m.value === mode)?.hint}
          >
            {MODES.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="동시 요청 수"
              type="number"
              value={threadCount}
              onChange={(e) => setThreadCount(e.target.value)}
              inputProps={{ min: 2, max: 80 }}
              size="small"
              fullWidth
            />
            <TextField
              label="요청당 수량"
              type="number"
              value={quantityPerRequest}
              onChange={(e) => setQuantityPerRequest(e.target.value)}
              inputProps={{ min: 1, max: 10 }}
              size="small"
              fullWidth
            />
          </Stack>

          {liveCount && (
            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" fontWeight={700}>
                  실시간 인원 (Redis)
                </Typography>
                <Typography variant="body2">
                  {liveCount.currentCount}/{liveCount.targetCount}
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}

          <Button variant="contained" size="large" disabled={running} onClick={handleRun}>
            {running ? '실행 중…' : '동시성 테스트 실행'}
          </Button>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Paper>

      {result && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>
              결과
            </Typography>
            <Chip
              size="small"
              label={result.oversold ? '초과 모집 발생' : '정원 준수'}
              color={result.oversold ? 'error' : 'success'}
            />
          </Stack>
          <Alert severity={result.oversold ? 'error' : 'success'} sx={{ mb: 2 }}>
            {result.summary}
          </Alert>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={0.8}>
            <Typography variant="body2">모드: {result.mode}</Typography>
            <Typography variant="body2">
              성공 {result.successCount} / 정원초과거절 {result.rejectedAsFull ?? result.failureCount} / 기타실패{' '}
              {result.otherFailures ?? 0} (스레드 {result.threadCount})
            </Typography>
            <Typography variant="body2">
              시작 전 DB currentCount: {result.currentCountBefore} → 테스트는 0부터 다시 채움 (target{' '}
              {result.targetCount})
            </Typography>
            <Typography variant="body2">
              테스트 후 DB currentCount: {result.currentCountAfterDb} / Redis:{' '}
              {result.currentCountAfterRedis ?? '-'}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            권장 확인 순서: ① UNSAFE로 oversold 확인 → ② REDIS_AND_DB로 정원 준수 확인
          </Typography>
        </Paper>
      )}
    </Box>
  )
}
