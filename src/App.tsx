import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from './pages/Home'
import { Admin } from './pages/Admin'
import { Login } from './pages/Login'
import { Pay } from './pages/Pay'
import { PaymentsAdmin } from './pages/PaymentsAdmin'
import { BookingsAdmin } from './pages/BookingsAdmin'
import { InquiriesAdmin } from './pages/InquiriesAdmin'
import { BookingStatus } from './pages/BookingStatus'
import { Policy } from './pages/Policy'
import { Navigate } from 'react-router-dom'
import { useAdminSession } from './lib/useAdminSession'
import { trackPageView } from './lib/metaPixel'

// Fires a Meta Pixel PageView on first load and on every route change.
// Admin and login pages are skipped so staff visits don't pollute ad data.
// Only a real Supabase session of an allowed admin email gets into /admin pages.
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, ready } = useAdminSession()
  if (!ready) return <div className="grid min-h-screen place-items-center bg-[#2a0611] text-[#f5d891]">Loading...</div>
  if (!isAdmin) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PixelRouteTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/pay') || pathname.startsWith('/booking/')) return
    trackPageView()
  }, [pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <PixelRouteTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="/admin/payments" element={<RequireAdmin><PaymentsAdmin /></RequireAdmin>} />
        <Route path="/admin/bookings" element={<RequireAdmin><BookingsAdmin /></RequireAdmin>} />
        <Route path="/admin/inquiries" element={<RequireAdmin><InquiriesAdmin /></RequireAdmin>} />
        <Route path="/pay/:token" element={<Pay />} />
        <Route path="/booking/:ref" element={<BookingStatus />} />
        <Route path="/privacy" element={<Policy kind="privacy" />} />
        <Route path="/terms" element={<Policy kind="terms" />} />
        <Route path="/refund-policy" element={<Policy kind="refund" />} />
        <Route path="/contact" element={<Policy kind="contact" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
