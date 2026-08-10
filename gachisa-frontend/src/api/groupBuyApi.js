import axiosInstance from './axiosInstance'

// GB-02
export const getGroupBuyList = (params) =>
  axiosInstance.get('/group-buys', { params })

// GB-03
export const getGroupBuyDetail = (groupBuyId) =>
  axiosInstance.get(`/group-buys/${groupBuyId}`)

// GB-01
export const createGroupBuy = (payload) =>
  axiosInstance.post('/group-buys', payload)

// GB-05
export const cancelGroupBuy = (groupBuyId) =>
  axiosInstance.patch(`/group-buys/${groupBuyId}/cancel`)
