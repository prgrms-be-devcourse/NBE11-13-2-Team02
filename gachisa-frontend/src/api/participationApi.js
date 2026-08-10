import axiosInstance from './axiosInstance'

// PT-01
export const participate = (groupBuyId, quantity) =>
  axiosInstance.post(`/group-buys/${groupBuyId}/participations`, { quantity })

// PT-02
export const cancelParticipation = (participationId) =>
  axiosInstance.delete(`/participations/${participationId}`)

// PT-03 - 실시간 참여 인원 폴링용
export const getParticipationCount = (groupBuyId) =>
  axiosInstance.get(`/group-buys/${groupBuyId}/participation-count`)

// PT-04
export const getMyParticipations = (params) =>
  axiosInstance.get('/users/me/participations', { params })
