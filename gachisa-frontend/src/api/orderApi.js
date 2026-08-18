import axiosInstance from './axiosInstance.js'

export const getMyOrders = ({ page = 0, size = 20 } = {}) =>
  axiosInstance.get('/users/me/orders', { params: { page, size } })

export const getMyOrder = (orderId) => axiosInstance.get(`/users/me/orders/${orderId}`)

export const registerDeliveryAddress = (orderId, request) =>
  axiosInstance.post(`/users/me/orders/${orderId}/delivery-address`, request)

export const getDelivery = (orderId) =>
  axiosInstance.get(`/users/me/orders/${orderId}/delivery`)

export const updateDeliveryStatusByAdmin = (orderId, deliveryStatus) =>
  axiosInstance.patch(`/admin/orders/${orderId}/delivery-status`, { deliveryStatus })
