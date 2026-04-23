import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'

import OrderPage from './pages/order/OrderPage'
import LoginPage from './pages/auth/LoginPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import LandingPage from './pages/landing/LandingPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import KasirPage from './pages/kasir/KasirPage'
import ProdukPage from './pages/produk/ProdukPage'
import LaporanPage from './pages/laporan/LaporanPage'
import TimPage from './pages/tim/TimPage'
import SettingsPage from './pages/settings/SettingsPage'
import BillingPage from './pages/billing/BillingPage'
import Layout from './components/Layout'
import SubscriptionGate from './components/SubscriptionGate'

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Memuat...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { setUser, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/order/:code" element={<OrderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/app" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="dashboard" element={<SubscriptionGate><DashboardPage /></SubscriptionGate>} />
          <Route path="kasir" element={<SubscriptionGate><KasirPage /></SubscriptionGate>} />
          <Route path="produk" element={<SubscriptionGate><ProdukPage /></SubscriptionGate>} />
          <Route path="laporan" element={<SubscriptionGate><LaporanPage /></SubscriptionGate>} />
          <Route path="tim" element={<SubscriptionGate><TimPage /></SubscriptionGate>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        {/* Redirect lama agar tidak broken */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/kasir" element={<Navigate to="/app/kasir" replace />} />
        <Route path="/produk" element={<Navigate to="/app/produk" replace />} />
        <Route path="/laporan" element={<Navigate to="/app/laporan" replace />} />
        <Route path="/tim" element={<Navigate to="/app/tim" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
