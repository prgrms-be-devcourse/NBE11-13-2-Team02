import axiosInstance from './axiosInstance'

export const signUp = ({ email, password, name, role }) =>
  axiosInstance.post('/auth/signup', { email, password, name, role })

export const login = (email, password) =>
  axiosInstance.post('/auth/login', { email, password })

export const logout = () => axiosInstance.post('/auth/logout')
