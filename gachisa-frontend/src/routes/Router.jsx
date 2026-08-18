import { Routes, Route } from 'react-router-dom'
import GroupBuyListPage from '../pages/GroupBuyListPage.jsx'
import GroupBuyDetailPage from '../pages/GroupBuyDetailPage.jsx'
import MyParticipationsPage from '../pages/MyParticipationsPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import DeliveryAddressPage from '../pages/DeliveryAddressPage.jsx'
import DeliveryTrackingPage from '../pages/DeliveryTrackingPage.jsx'
import AdminDeliveryPage from '../pages/AdminDeliveryPage.jsx'
import PaymentSuccessPage from '../pages/PaymentSuccessPage.jsx'
import PaymentFailPage from '../pages/PaymentFailPage.jsx'

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<GroupBuyListPage />} />
      <Route path="/group-buys/:groupBuyId" element={<GroupBuyDetailPage />} />
      <Route path="/my/participations" element={<MyParticipationsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/orders/:orderId/delivery-address" element={<DeliveryAddressPage />} />
      <Route path="/orders/:orderId/delivery" element={<DeliveryTrackingPage />} />
      <Route path="/admin/deliveries" element={<AdminDeliveryPage />} />
      <Route path="/payments/success" element={<PaymentSuccessPage />} />
      <Route path="/payments/fail" element={<PaymentFailPage />} />
    </Routes>
  )
}
