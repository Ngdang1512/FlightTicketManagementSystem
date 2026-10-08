import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { AuthUser } from '../types'

export default function AppLayout() {
  const { pathname } = useLocation()
  const isTicketPage = pathname === '/flights'
  const rawUser = localStorage.getItem('flightticket.user')
  const accessToken = localStorage.getItem('flightticket.accessToken')
  let user: AuthUser | null = null
  try {
    user = rawUser && accessToken ? JSON.parse(rawUser) as AuthUser : null
    if (user && user.role !== 'USER') {
      localStorage.removeItem('flightticket.accessToken')
      localStorage.removeItem('flightticket.refreshToken')
      localStorage.removeItem('flightticket.user')
      user = null
    }
  } catch {
    localStorage.removeItem('flightticket.user')
  }
  const displayName = user?.fullName ?? 'Khách hàng'
  const initials = displayName.split(' ').slice(-2).map(part => part[0]).join('').toUpperCase()

  return (
    <div className={`app-shell customer-shell${isTicketPage ? ' ticket-shell' : ''}`}>
      <header className={`site-header customer-header${isTicketPage ? ' ticket-header' : ''}`}>
        <div className="site-header-inner">
          <NavLink className="brand" to="/" aria-label="SkyWay trang chủ">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>SkyWay</span>
          </NavLink>
          <nav className="customer-nav" aria-label="Điều hướng chính">
            <NavLink to="/flights" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Vé máy bay</NavLink>
            <NavLink to="/bookings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Đặt chỗ của tôi</NavLink>
            <NavLink className="nav-link" to="/bookings#history">Lịch sử</NavLink>
          </nav>
          <div className="customer-tools">
            <button type="button" aria-label="Tin nhắn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 18.5 4 20l1-3.8A7.5 7.5 0 1 1 7.5 18.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></svg>
            </button>
            <button className="notification" type="button" aria-label="Thông báo">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8ZM10 21h4" /></svg>
            </button>
            <NavLink className="customer-profile" to={user ? '/bookings' : '/login'}>
              <span>{initials || 'KH'}</span>
              <div><strong>{displayName}</strong><small>{user ? 'Thành viên SkyWay' : 'Đăng nhập tài khoản'}</small></div>
            </NavLink>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      {!isTicketPage && <footer className="site-footer">
        <div className="site-footer-inner">
          <span>SkyWay Vietnam · Hành trình nội địa</span>
          <span>SGN · HAN · DAD</span>
        </div>
      </footer>}
    </div>
  )
}
