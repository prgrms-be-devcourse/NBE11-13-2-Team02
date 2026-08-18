import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import SearchIcon from '@mui/icons-material/Search'
import Logo from '../Logo.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AppLayout() {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [keyword, setKeyword] = useState('')

  const goTo = (path) => {
    setAnchorEl(null)
    navigate(path)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    navigate(`/${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`)
  }

  const handleLogout = async () => {
    setAnchorEl(null)
    await logout()
    navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="inherit" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ gap: 2, py: 1 }}>
          <Box sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Logo size={32} />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              bgcolor: 'grey.100',
              borderRadius: 999,
              px: 2,
              py: 0.6,
              width: 280,
            }}
          >
            <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="어떤 공동구매를 찾으세요?"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              fullWidth
              sx={{ fontSize: 14 }}
            />
          </Box>

          {isAuthenticated ? (
            <>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.light', color: 'primary.main' }}>
                  {user?.name?.[0] ?? '?'}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                <MenuItem disabled>
                  <Typography variant="body2" fontWeight={700}>
                    {user?.name} 님
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => goTo('/my/participations')}>내 참여내역</MenuItem>
                <MenuItem onClick={() => goTo('/my/orders')}>내 주문</MenuItem>
                <MenuItem onClick={() => goTo('/my/page')}>마이페이지</MenuItem>
                {isSeller && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => goTo('/products/new')}>상품 등록</MenuItem>
                    <MenuItem onClick={() => goTo('/group-buys/new')}>공동구매 등록</MenuItem>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => goTo('/admin/categories')}>카테고리 관리</MenuItem>
                    <MenuItem onClick={() => goTo('/admin/deliveries')}>배송 관리</MenuItem>
                  </>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
              </Menu>
            </>
          ) : (
            <Button variant="contained" onClick={() => navigate('/login')}>
              로그인
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
