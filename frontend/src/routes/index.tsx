import type { ReactNode } from 'react'
import FlightsPage from '../pages/FlightsPage'
import BookingsPage from '../pages/BookingsPage'
import CheckoutPage from '../pages/CheckoutPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import RegisterPage from '../pages/RegisterPage'
import ManagementPage from '../pages/ManagementPage'
import PortalLoginPage from '../pages/PortalLoginPage'

export type AppRoute = {
  path: string
  element: ReactNode
}

export const routes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/flights', element: <FlightsPage /> },
  { path: '/bookings', element: <BookingsPage /> },
  { path: '/bookings/new', element: <CheckoutPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/admin', element: <ManagementPage mode="ADMIN" /> },
  { path: '/admin/login', element: <PortalLoginPage portal="admin" /> },
  { path: '/manager', element: <ManagementPage mode="STAFF" /> },
  { path: '/manager/login', element: <PortalLoginPage portal="manager" /> },
  { path: '*', element: <NotFoundPage /> },
]

const concretePaths = routes.filter((route) => route.path !== '*').map((route) => route.path)
if (new Set(concretePaths).size !== concretePaths.length) {
  throw new Error('Duplicate frontend route detected')
}
