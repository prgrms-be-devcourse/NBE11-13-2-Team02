import axiosInstance from './axiosInstance.js'

export const registerDeliveryAddress = (orderId, request) =>
  axiosInstance.post(`/users/me/orders/${orderId}/delivery-address`, request)

export const getDelivery = (orderId) =>
  axiosInstance.get(`/users/me/orders/${orderId}/delivery`)

export const updateDeliveryStatusByAdmin = (orderId, deliveryStatus) =>
  axiosInstance.patch(`/admin/orders/${orderId}/delivery-status`, { deliveryStatus })
