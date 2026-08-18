import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // 리프레시 토큰(httpOnly 쿠키) 송수신을 위해 필요
})

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

async function reissueAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/reissue', null, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.accessToken)
        return res.data.accessToken
      })
      .catch((err) => {
        clearAccessToken()
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// 응답 인터셉터: 백엔드 공통 응답 포맷 { status, code, message, result } 에서
// result만 꺼내서 반환 -> 컴포넌트에서는 response.data 로 바로 원하는 값에 접근 가능
// + 401 응답 시 accessToken 재발급 후 원래 요청 재시도
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'result')) {
      return { ...response, data: response.data.result }
    }
    return response
  },
  async (error) => {
    const { config, response } = error
    const isAuthEndpoint = config?.url?.startsWith('/auth/')

    if (response?.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true
      try {
        const newToken = await reissueAccessToken()
        config.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(config)
      } catch (reissueError) {
        window.dispatchEvent(new CustomEvent('auth:sessionExpired'))
        return Promise.reject(reissueError)
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
export { reissueAccessToken }
