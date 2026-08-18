import { createContext, useContext, useState, useCallback } from 'react'
import { login as loginApi } from '../api/authApi'
import { parseJwt } from '../utils/jwt'

const AuthContext = createContext(null)

function buildUserFromToken(token) {
  if (!token) return null
  const payload = parseJwt(token)
  if (!payload) return null
  // 백엔드 JwtTokenProvider가 토큰 발급 시 sub(userId), role 클레임을 넣는다고 가정
  return { userId: payload.sub, role: payload.role }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    buildUserFromToken(localStorage.getItem('accessToken'))
  )

  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password) // 인터셉터가 이미 result만 반환
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    setUser(buildUserFromToken(data.accessToken))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
