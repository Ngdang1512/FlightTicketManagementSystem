import type { AdminBooking, AdminCatalog, AdminCustomer, AdminDashboard, AuthResponse, Booking, Flight, StaffAccount } from '../types'

type ApiError = {
  message?: string
  details?: Record<string, string>
}

export class ApiRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    const details = error.details ? Object.values(error.details).join(', ') : ''
    const fallbackMessage = response.status >= 500
      ? 'Máy chủ API chưa sẵn sàng, vui lòng thử lại sau vài giây'
      : `Yêu cầu thất bại (HTTP ${response.status})`
    throw new ApiRequestError(response.status, [error.message ?? fallbackMessage, details].filter(Boolean).join(': '))
  }

  const body = await response.text()
  return (body ? JSON.parse(body) : undefined) as T
}

async function authorizedRequest<T>(url: string, options?: RequestInit) {
  const token = localStorage.getItem('flightticket.accessToken')
  if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục')
  try {
    return await request<T>(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options?.headers },
    })
  } catch (reason) {
    if (!(reason instanceof ApiRequestError) || reason.status !== 401) throw reason
    const refreshToken = localStorage.getItem('flightticket.refreshToken')
    if (!refreshToken) { clearSession(); throw reason }
    try {
      const auth = await refreshSession(refreshToken)
      if (auth.user.role !== 'USER') { clearSession(); throw reason }
      saveSession(auth)
      return await request<T>(url, {
        ...options,
        headers: { Authorization: `Bearer ${auth.accessToken}`, ...options?.headers },
      })
    } catch (refreshError) {
      clearSession()
      throw refreshError
    }
  }
}

async function portalRequest<T>(url: string, portal: 'admin' | 'manager', options?: RequestInit) {
  const token = localStorage.getItem(`flightticket.${portal}.accessToken`)
  if (!token) throw new Error(`Vui lòng đăng nhập cổng ${portal}`)
  try {
    return await request<T>(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options?.headers },
    })
  } catch (reason) {
    if (!(reason instanceof ApiRequestError) || reason.status !== 401) throw reason
    const refreshToken = localStorage.getItem(`flightticket.${portal}.refreshToken`)
    if (!refreshToken) { clearSession(portal); throw reason }
    try {
      const auth = await refreshSession(refreshToken)
      saveSession(auth, portal)
      return await request<T>(url, {
        ...options,
        headers: { Authorization: `Bearer ${auth.accessToken}`, ...options?.headers },
      })
    } catch (refreshError) {
      clearSession(portal)
      throw refreshError
    }
  }
}

export function searchFlights(params: URLSearchParams) {
  return request<Flight[]>(`/api/flights/search?${params.toString()}`)
}

export function getUpcomingDomesticFlights(passengers = 1) {
  return request<Flight[]>(`/api/flights/upcoming?passengers=${passengers}`)
}

export function getFlight(id: number) { return request<Flight>(`/api/flights/${id}`) }
export function getOccupiedSeats(id: number) { return request<string[]>(`/api/flights/${id}/occupied-seats`) }

export function createBooking(payload: {
  flightId: number
  fareId: number
  passengers: { fullName: string; documentNumber?: string; seatNumber: string; baggageOptionId?: number }[]
}) {
  return authorizedRequest<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(payload) })
}

export function getMyBookings() {
  return authorizedRequest<Booking[]>('/api/bookings/my-bookings')
}

export function payBooking(bookingId: number, method: 'BANK_TRANSFER' | 'CARD' | 'E_WALLET') {
  return authorizedRequest<{ status: string }>('/api/payments', {
    method: 'POST', body: JSON.stringify({ bookingId, method }),
  })
}

export function cancelBooking(id: number) {
  return authorizedRequest<Booking>(`/api/bookings/${id}/cancel`, { method: 'POST' })
}
export function requestBookingRefund(id: number) {
  return authorizedRequest<Booking>(`/api/bookings/${id}/request-refund`, { method: 'POST' })
}

export function getAdminDashboard(portal: 'admin' | 'manager') {
  return portalRequest<AdminDashboard>(`/api/${portal}/dashboard`, portal)
}
export function getManagerFlights() { return portalRequest<Flight[]>('/api/manager/flights', 'manager') }
export function getManagerBookings() { return portalRequest<AdminBooking[]>('/api/manager/bookings', 'manager') }
export function getManagerCatalogs() { return portalRequest<AdminCatalog>('/api/manager/catalogs', 'manager') }
export type ManageFlightPayload = {
  flightNumber: string; aircraftId: number; departureAirportId: number; arrivalAirportId: number
  departureTime: string; arrivalTime: string
  fares: { fareClassId: number; price: number; seatQuota: number }[]
}
export function createManagerFlight(payload: ManageFlightPayload) {
  return portalRequest<Flight>('/api/manager/flights', 'manager', { method: 'POST', body: JSON.stringify(payload) })
}
export function updateManagerFlight(id: number, payload: ManageFlightPayload) {
  return portalRequest<Flight>(`/api/manager/flights/${id}`, 'manager', { method: 'PUT', body: JSON.stringify(payload) })
}
export function updateFlightStatus(id: number, status: string) {
  return portalRequest<Flight>(`/api/manager/flights/${id}/status`, 'manager', {
    method: 'PATCH', body: JSON.stringify({ status }),
  })
}
export function cancelManagedBooking(id: number) {
  return portalRequest<AdminBooking>(`/api/manager/bookings/${id}/cancel`, 'manager', { method: 'POST' })
}
export function refundManagedBooking(id: number) {
  return portalRequest<AdminBooking>(`/api/manager/bookings/${id}/refund`, 'manager', { method: 'POST' })
}
export function getAdminCustomers() { return portalRequest<AdminCustomer[]>('/api/admin/customers', 'admin') }
export function updateCustomerStatus(accountId: number, status: 'ACTIVE' | 'LOCKED') {
  return portalRequest<AdminCustomer>(`/api/admin/customers/${accountId}/status`, 'admin', {
    method: 'PATCH', body: JSON.stringify({ status }),
  })
}
export function getAdminStaff() { return portalRequest<StaffAccount[]>('/api/admin/staff', 'admin') }
export function createAdminStaff(payload: { fullName: string; username: string; password: string; email: string }) {
  return portalRequest<StaffAccount>('/api/admin/staff', 'admin', { method: 'POST', body: JSON.stringify(payload) })
}
export function updateStaffStatus(accountId: number, status: 'ACTIVE' | 'LOCKED') {
  return portalRequest<StaffAccount>(`/api/admin/staff/${accountId}/status`, 'admin', {
    method: 'PATCH', body: JSON.stringify({ status }),
  })
}
export function getAdminCatalogs() { return portalRequest<AdminCatalog>('/api/admin/catalogs', 'admin') }
type CatalogKind = 'airlines' | 'airports' | 'aircraft' | 'fare-classes' | 'baggage-options'
export function saveAdminCatalog<T>(kind: CatalogKind, payload: object, id?: number) {
  return portalRequest<T>(`/api/admin/${kind}${id ? `/${id}` : ''}`, 'admin', {
    method: id ? 'PUT' : 'POST', body: JSON.stringify(payload),
  })
}
export function deleteAdminCatalog(kind: CatalogKind, id: number) {
  return portalRequest<void>(`/api/admin/${kind}/${id}`, 'admin', { method: 'DELETE' })
}

export function login(username: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function register(payload: {
  fullName: string
  username: string
  password: string
  email: string
  phone?: string
}) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function saveSession(auth: AuthResponse, portal?: 'admin' | 'manager') {
  const prefix = portal ? `flightticket.${portal}` : 'flightticket'
  localStorage.setItem(`${prefix}.accessToken`, auth.accessToken)
  localStorage.setItem(`${prefix}.refreshToken`, auth.refreshToken)
  localStorage.setItem(`${prefix}.user`, JSON.stringify(auth.user))
}

export function clearSession(portal?: 'admin' | 'manager') {
  const prefix = portal ? `flightticket.${portal}` : 'flightticket'
  localStorage.removeItem(`${prefix}.accessToken`)
  localStorage.removeItem(`${prefix}.refreshToken`)
  localStorage.removeItem(`${prefix}.user`)
}

function refreshSession(refreshToken: string) {
  return request<AuthResponse>('/api/auth/refresh', {
    method: 'POST', body: JSON.stringify({ refreshToken }),
  })
}
