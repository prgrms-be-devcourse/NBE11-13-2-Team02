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

// TODO: 응답 인터셉터에서 401 발생 시 /api/auth/reissue 호출 후 재시도 로직 추가

export default axiosInstance
