import { Routes, Route } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import RoleRoute from '../components/RoleRoute.jsx'

import LoginPage from '../pages/LoginPage.jsx'
import SignUpPage from '../pages/SignUpPage.jsx'

import GroupBuyListPage from '../pages/GroupBuyListPage.jsx'
import GroupBuyDetailPage from '../pages/GroupBuyDetailPage.jsx'
import GroupBuyCreatePage from '../pages/GroupBuyCreatePage.jsx'
import GroupBuyCheckoutPage from '../pages/GroupBuyCheckoutPage.jsx'
import MyParticipationsPage from '../pages/MyParticipationsPage.jsx'
import ParticipationDetailPage from '../pages/ParticipationDetailPage.jsx'
import DeliveryAddressPage from '../pages/DeliveryAddressPage.jsx'
import DeliveryTrackingPage from '../pages/DeliveryTrackingPage.jsx'
import AdminDeliveryPage from '../pages/AdminDeliveryPage.jsx'
import PaymentSuccessPage from '../pages/PaymentSuccessPage.jsx'
import PaymentFailPage from '../pages/PaymentFailPage.jsx'

import ProductListPage from '../pages/ProductListPage.jsx'
import ProductDetailPage from '../pages/ProductDetailPage.jsx'
import ProductCreatePage from '../pages/ProductCreatePage.jsx'
import ProductEditPage from '../pages/ProductEditPage.jsx'
import CategoryManagePage from '../pages/CategoryManagePage.jsx'

import MyOrdersPage from '../pages/MyOrdersPage.jsx'
import OrderDetailPage from '../pages/OrderDetailPage.jsx'
import MyPage from '../pages/MyPage.jsx'

import ForbiddenPage from '../pages/ForbiddenPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/payments/success" element={<PaymentSuccessPage />} />
      <Route path="/payments/fail" element={<PaymentFailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<GroupBuyListPage />} />
          <Route path="/group-buys/:groupBuyId" element={<GroupBuyDetailPage />} />
          <Route path="/group-buys/:groupBuyId/checkout" element={<GroupBuyCheckoutPage />} />
          <Route path="/my/participations" element={<MyParticipationsPage />} />
          <Route path="/my/participations/:participationId" element={<ParticipationDetailPage />} />

          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />

          <Route path="/my/orders" element={<MyOrdersPage />} />
          <Route path="/my/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/my/page" element={<MyPage />} />
          <Route path="/orders/:orderId/delivery-address" element={<DeliveryAddressPage />} />
          <Route path="/orders/:orderId/delivery" element={<DeliveryTrackingPage />} />

          <Route element={<RoleRoute roles={['ROLE_SELLER']} />}>
            <Route path="/group-buys/new" element={<GroupBuyCreatePage />} />
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/products/:productId/edit" element={<ProductEditPage />} />
          </Route>

          <Route element={<RoleRoute roles={['ROLE_ADMIN']} />}>
            <Route path="/admin/categories" element={<CategoryManagePage />} />
            <Route path="/admin/deliveries" element={<AdminDeliveryPage />} />
          </Route>

          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
