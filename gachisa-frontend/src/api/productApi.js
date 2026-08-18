import axiosInstance from './axiosInstance'

export const getProducts = () => axiosInstance.get('/products')

export const getProduct = (productId) => axiosInstance.get(`/products/${productId}`)

export const searchProducts = ({ categoryId, minPrice, maxPrice, keyword } = {}) =>
  axiosInstance.get('/products/search', { params: { categoryId, minPrice, maxPrice, keyword } })

// SELLER 전용 - multipart/form-data (data: JSON part, image: 선택적 파일 part)
export const createProduct = ({ name, description, basePrice, stock, categoryId, imageFile }) => {
  const formData = new FormData()
  formData.append(
    'data',
    new Blob([JSON.stringify({ name, description, basePrice, stock, categoryId })], {
      type: 'application/json',
    }),
  )
  if (imageFile) formData.append('image', imageFile)
  return axiosInstance.post('/products', formData)
}

// SELLER 전용 (소유자만 가능)
export const updateProduct = (productId, { name, description, basePrice, stock, categoryId }) =>
  axiosInstance.patch(`/products/${productId}`, { name, description, basePrice, stock, categoryId })

// SELLER 전용 - 이미지만 별도 교체
export const updateProductImage = (productId, imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  return axiosInstance.patch(`/products/${productId}/image`, formData)
}

// SELLER 전용
export const deleteProduct = (productId) => axiosInstance.delete(`/products/${productId}`)

// SELLER 전용 - 판매중지 상품 재개
export const resumeProduct = (productId) => axiosInstance.patch(`/products/${productId}/resume`)
