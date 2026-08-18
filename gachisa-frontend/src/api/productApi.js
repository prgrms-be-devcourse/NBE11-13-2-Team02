import axiosInstance from './axiosInstance'

export const getProducts = () => axiosInstance.get('/products')

export const getProduct = (productId) => axiosInstance.get(`/products/${productId}`)

export const searchProducts = ({ categoryId, minPrice, maxPrice, keyword } = {}) =>
  axiosInstance.get('/products/search', { params: { categoryId, minPrice, maxPrice, keyword } })

// SELLER 전용
export const createProduct = ({ name, description, basePrice, categoryId, imageUrl, options }) =>
  axiosInstance.post('/products', { name, description, basePrice, categoryId, imageUrl, options })

// SELLER 전용 (소유자만 가능)
export const updateProduct = (productId, { name, description, basePrice, categoryId, imageUrl }) =>
  axiosInstance.patch(`/products/${productId}`, { name, description, basePrice, categoryId, imageUrl })

// SELLER 전용
export const deleteProduct = (productId) => axiosInstance.delete(`/products/${productId}`)

// SELLER 전용 - 판매중지 상품 재개
export const resumeProduct = (productId) => axiosInstance.patch(`/products/${productId}/resume`)

// SELLER 전용
export const addProductOption = (productId, { optionName, optionValue, stock }) =>
  axiosInstance.post(`/products/${productId}/options`, { optionName, optionValue, stock })

// SELLER 전용 - quantity는 증감분(delta)
export const adjustProductOptionStock = (productId, optionId, quantity) =>
  axiosInstance.patch(`/products/${productId}/options/${optionId}`, { quantity })
