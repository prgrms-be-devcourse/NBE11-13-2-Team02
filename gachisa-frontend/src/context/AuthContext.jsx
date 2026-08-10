import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // TODO: login/logout 시 accessToken을 localStorage에 저장/삭제,
  //       앱 진입 시 토큰 존재 여부로 로그인 상태 복원

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
