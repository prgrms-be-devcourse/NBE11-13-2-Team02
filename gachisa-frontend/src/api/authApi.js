import axiosInstance from './axiosInstance'

export const login = (email, password) =>
  axiosInstance.post('/auth/login', { email, password })

export const signUp = (payload) =>
  axiosInstance.post('/users', payload)
