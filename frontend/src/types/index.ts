export type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

export type Airport = {
  id: number
  iataCode: string
  name: string
  city: string
  country: string
  timezone: string
}

export type Fare = {
  id: number
  classCode: string
  className: string
  price: number
  seatQuota: number
  availableSeats: number
}

export type Flight = {
  id: number
  flightNumber: string
  airlineName: string
  airlineCode: string
  aircraftModel: string
  aircraftSeatCapacity: number
  departureAirport: Airport
  arrivalAirport: Airport
  departureTime: string
  arrivalTime: string
  status: string
  fares: Fare[]
  cabinBaggageKg: number
  includedCheckedBaggageKg: number
  baggageOptions: { id: number; weightKg: number; price: number }[]
}

export type AuthUser = {
  accountId: number
  customerId: number | null
  username: string
  fullName: string | null
  email: string | null
  role: string
}

export type AuthResponse = {
  tokenType: string
  accessToken: string
  accessTokenExpiresIn: number
  refreshToken: string
  refreshTokenExpiresIn: number
  user: AuthUser
}

export type Booking = {
  id: number
  bookingCode: string
  status: 'PENDING' | 'PAID' | 'REFUND_REQUESTED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED'
  bookedAt: string
  expiresAt: string | null
  flightNumber: string
  airlineName: string
  departureCode: string
  arrivalCode: string
  departureTime: string
  arrivalTime: string
  fareClass: string
  passengerCount: number
  totalAmount: number
  passengers: { fullName: string; documentNumber?: string; seatNumber: string; checkedBaggageKg: number; baggagePrice: number }[]
  tickets: { id: number; passengerName: string; electronicTicketCode: string; status: string }[]
}

export type AdminDashboard = {
  flights: number
  bookings: number
  customers: number
  successfulPayments: number
  revenue: number
}

export type AdminBooking = {
  id: number
  bookingCode: string
  customerName: string
  customerEmail: string
  route: string
  flightNumber: string
  passengerCount: number
  totalAmount: number
  status: string
  bookedAt: string
}

export type AdminCustomer = {
  accountId: number
  customerId: number
  username: string
  fullName: string
  email: string | null
  phone: string | null
  status: 'ACTIVE' | 'LOCKED'
  bookingCount: number
  createdAt: string
}

export type StaffAccount = {
  accountId: number
  username: string
  fullName: string
  email: string | null
  status: 'ACTIVE' | 'LOCKED'
  createdAt: string
}

export type AdminCatalog = {
  airlines: { id: number; name: string; iataCode: string; country: string | null; cabinBaggageKg: number; includedCheckedBaggageKg: number }[]
  airports: { id: number; name: string; iataCode: string; city: string; country: string; timezone: string }[]
  aircraft: { id: number; registrationNumber: string; model: string; seatCapacity: number; airlineId: number; airlineName: string }[]
  fareClasses: { id: number; code: string; name: string; description: string | null }[]
  baggageOptions: { id: number; airlineId: number; airlineName: string; weightKg: number; price: number; active: boolean }[]
}
