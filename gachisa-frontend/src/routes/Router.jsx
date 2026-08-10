import { Routes, Route } from 'react-router-dom'
import GroupBuyListPage from '../pages/GroupBuyListPage.jsx'
import GroupBuyDetailPage from '../pages/GroupBuyDetailPage.jsx'
import MyParticipationsPage from '../pages/MyParticipationsPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<GroupBuyListPage />} />
      <Route path="/group-buys/:groupBuyId" element={<GroupBuyDetailPage />} />
      <Route path="/my/participations" element={<MyParticipationsPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}
