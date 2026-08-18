import { getGroupBuyList } from '../api/groupBuyApi'

// 상품 검색 결과에서 "진행중인 공동구매로 바로 이동"을 지원하기 위한 조회.
// GroupBuyResponse에 productId가 없어 상품명으로 매칭한다(이름 중복 시 첫 매칭 우선).
export async function fetchActiveGroupBuyIdsByProductName() {
  const { data } = await getGroupBuyList({ status: 'RECRUITING', page: 0, size: 100 })
  const map = {}
  ;(data?.content ?? []).forEach((gb) => {
    if (!(gb.productName in map)) map[gb.productName] = gb.groupBuyId
  })
  return map
}
