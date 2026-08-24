import axiosInstance from './axiosInstance'

/** local 프로필 전용: 공동구매 정원 동시성 스트레스 테스트 */
export const runConcurrencyStress = (groupBuyId, { mode, threadCount, quantityPerRequest } = {}) =>
  axiosInstance.post(`/dev/group-buys/${groupBuyId}/concurrency-stress`, {
    mode,
    threadCount,
    quantityPerRequest,
  })
