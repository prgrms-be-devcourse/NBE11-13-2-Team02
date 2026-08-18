import axiosInstance from './axiosInstance'

// GB-02. 목록 조회
export const getGroupBuyList = ({ status, page = 0, size = 20 } = {}) =>
  axiosInstance.get('/group-buys', { params: { status, page, size } })

// GB-03. 상세 조회
export const getGroupBuyDetail = (groupBuyId) =>
  axiosInstance.get(`/group-buys/${groupBuyId}`)

// GB-01. 생성 (판매자)
export const createGroupBuy = (payload) =>
  axiosInstance.post('/group-buys', payload)

// GB-05. 취소 (판매자)
export const cancelGroupBuy = (groupBuyId) =>
  axiosInstance.patch(`/group-buys/${groupBuyId}/cancel`)
