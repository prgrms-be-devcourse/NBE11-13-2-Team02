import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터: accessToken 자동 첨부
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터: 백엔드 공통 응답 포맷 { status, code, message, result } 에서
// result만 꺼내서 반환 -> 컴포넌트에서는 response.data 로 바로 원하는 값에 접근 가능
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'result')) {
      return { ...response, data: response.data.result }
    }
    return response
  },
  (error) => {
    // 에러 응답 포맷: { status, error, message, timestamp }
    // TODO(인증 담당자): 401이면 /auth/reissue 호출 후 재시도하는 로직 추가
    return Promise.reject(error)
  }
)

export default axiosInstance
