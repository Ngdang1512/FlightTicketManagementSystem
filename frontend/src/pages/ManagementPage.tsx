import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiRequestError, cancelManagedBooking, clearSession, createAdminStaff, createManagerFlight, getAdminCatalogs, getAdminCustomers, getAdminDashboard, getAdminStaff, getManagerBookings, getManagerCatalogs, getManagerFlights, refundManagedBooking, updateCustomerStatus, updateFlightStatus, updateManagerFlight, updateStaffStatus } from '../api/client'
import type { AdminBooking, AdminCatalog, AdminCustomer, AdminDashboard, AuthUser, Flight, StaffAccount } from '../types'
import AirplaneIcon from '../components/AirplaneIcon'
import AdminCatalogManager from '../components/AdminCatalogManager'

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
const statuses = ['SCHEDULED', 'DELAYED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'CANCELLED']
const flightStatusLabels: Record<string, string> = {
  SCHEDULED: 'Đúng giờ', DELAYED: 'Bị hoãn', BOARDING: 'Đang lên máy bay',
  DEPARTED: 'Đã khởi hành', ARRIVED: 'Đã đến', CANCELLED: 'Đã hủy',
}
const bookingStatusLabels: Record<string, string> = {
  PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', REFUND_REQUESTED: 'Yêu cầu hoàn tiền', REFUNDED: 'Đã hoàn tiền', CANCELLED: 'Đã hủy', EXPIRED: 'Đã hết hạn',
}
const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date(value))

type PortalIconName = 'overview' | 'flight' | 'booking' | 'customer' | 'payment' | 'revenue' | 'logout'

function PortalIcon({ name }: { name: PortalIconName }) {
  return <svg className={`portal-icon portal-icon-${name}`} viewBox="0 0 24 24" aria-hidden="true">
    {name === 'overview' && <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>}
    {name === 'flight' && <path d="M21.8 11.6c-.2-.7-.8-1.1-1.5-1.1h-5.4l-4.7-7H7.8l2.3 7H5.4L3.8 8H2.2l.8 4-.8 4h1.6l1.6-2.5h4.7l-2.3 7h2.4l4.7-7h5.4c.7 0 1.3-.4 1.5-1.1.1-.3.1-.5 0-.8Z" />}
    {name === 'booking' && <><path d="M5 4h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 1 2-2Z" /><path d="M9 8h6M9 12h6M9 16h4" /></>}
    {name === 'customer' && <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>}
    {name === 'payment' && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>}
    {name === 'revenue' && <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5c-.7-.6-1.8-1-3-1-1.7 0-3 1-3 2.3 0 1.4 1.2 2 3 2.4 1.8.4 3 1 3 2.5 0 1.3-1.3 2.3-3 2.3-1.3 0-2.5-.4-3.3-1.2M12.5 5v14" /></>}
    {name === 'logout' && <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M8 12h10" /></>}
  </svg>
}

export default function ManagementPage({ mode }: { mode: 'ADMIN' | 'STAFF' }) {
  const navigate = useNavigate()
  const portal = mode === 'ADMIN' ? 'admin' : 'manager'
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [staff, setStaff] = useState<StaffAccount[]>([])
  const [catalogs, setCatalogs] = useState<AdminCatalog | null>(null)
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const load = useCallback(async () => {
    const rawUser = localStorage.getItem(`flightticket.${portal}.user`)
    const user = rawUser ? JSON.parse(rawUser) as AuthUser : null
    const allowed = mode === 'ADMIN' ? user?.role === 'ADMIN' : ['ADMIN', 'STAFF'].includes(user?.role ?? '')
    if (!allowed) { navigate(`/${portal}/login`); return }
    setCurrentUser(user)
    try {
      if (mode === 'ADMIN') {
        const [metrics, customerItems, staffItems, catalogItems] = await Promise.all([
          getAdminDashboard('admin'), getAdminCustomers(), getAdminStaff(), getAdminCatalogs(),
        ])
        setDashboard(metrics); setCustomers(customerItems); setStaff(staffItems); setCatalogs(catalogItems)
      } else {
        const [metrics, flightItems, bookingItems, catalogItems] = await Promise.all([
          getAdminDashboard('manager'), getManagerFlights(), getManagerBookings(), getManagerCatalogs(),
        ])
        setDashboard(metrics); setFlights(flightItems); setBookings(bookingItems); setCatalogs(catalogItems)
      }
    } catch (reason) {
      if (reason instanceof ApiRequestError && reason.status === 401) {
        clearSession(portal); navigate(`/${portal}/login`, { replace: true }); return
      }
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu quản trị')
    }
  }, [mode, navigate, portal])

  useEffect(() => { load() }, [load])

  async function changeStatus(id: number, status: string) {
    try { await updateFlightStatus(id, status); setSuccess('Đã cập nhật trạng thái chuyến bay.'); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cập nhật') }
  }

  async function changeCustomerStatus(accountId: number, status: 'ACTIVE' | 'LOCKED') {
    try { await updateCustomerStatus(accountId, status); setSuccess('Đã cập nhật trạng thái khách hàng.'); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cập nhật khách hàng') }
  }

  async function changeStaffStatus(accountId: number, status: 'ACTIVE' | 'LOCKED') {
    try { await updateStaffStatus(accountId, status); setSuccess('Đã cập nhật tài khoản Manager.'); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cập nhật Manager') }
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('')
    const form = event.currentTarget
    const data = new FormData(form)
    try {
      await createAdminStaff({
        fullName: String(data.get('fullName')), username: String(data.get('username')),
        email: String(data.get('email')), password: String(data.get('password')),
      })
      form.reset(); setSuccess('Đã tạo tài khoản Manager mới.'); await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo Manager') }
  }

  async function cancelBooking(id: number) {
    try { await cancelManagedBooking(id); setSuccess('Đã hủy đơn và hoàn lại số ghế.'); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể hủy đơn') }
  }

  async function refundBooking(id: number) {
    if (!window.confirm('Xác nhận hoàn tiền, hủy vé điện tử và trả lại tồn ghế?')) return
    try { await refundManagedBooking(id); setSuccess('Đã hoàn tiền, hủy vé điện tử và hoàn lại số ghế.'); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể hoàn tiền') }
  }

  async function saveFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('')
    const form = event.currentTarget
    const data = new FormData(form)
    const selectedFares = (catalogs?.fareClasses ?? []).filter(item => data.get(`fareEnabled-${item.id}`)).map(item => ({
      fareClassId: item.id, price: Number(data.get(`farePrice-${item.id}`)), seatQuota: Number(data.get(`fareQuota-${item.id}`)),
    }))
    if (selectedFares.length === 0) { setError('Chọn ít nhất một hạng vé.'); return }
    const payload = {
      flightNumber: String(data.get('flightNumber')),
      aircraftId: Number(data.get('aircraftId')),
      departureAirportId: Number(data.get('departureAirportId')),
      arrivalAirportId: Number(data.get('arrivalAirportId')),
      departureTime: new Date(String(data.get('departureTime'))).toISOString(),
      arrivalTime: new Date(String(data.get('arrivalTime'))).toISOString(),
      fares: selectedFares,
    }
    try {
      if (editingFlight) await updateManagerFlight(editingFlight.id, payload)
      else await createManagerFlight(payload)
      form.reset(); setEditingFlight(null); setSuccess(editingFlight ? 'Đã cập nhật lịch bay.' : 'Đã tạo chuyến bay mới.'); await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu chuyến bay') }
  }

  const localDateTime = (value?: string) => value
    ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    : ''

  function logout() {
    clearSession(portal)
    navigate(`/${portal}/login`)
  }

  const displayName = currentUser?.fullName || currentUser?.username || (mode === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên điều hành')
  const initials = displayName.split(' ').slice(-2).map(part => part[0]).join('').toUpperCase()

  return <section className={`management-page ${portal}-portal`}>
    <aside className="management-sidebar">
      <div className="management-brand"><span className="management-brand-mark" aria-hidden="true"><i /><i /><i /></span><span>{mode === 'ADMIN' ? 'SkyWay Admin' : 'SkyWay Manager'}</span></div>
      <span className="portal-role">{mode === 'ADMIN' ? 'Quản trị hệ thống' : 'Điều hành chuyến bay'}</span>
      <div className="sidebar-route" aria-hidden="true"><span>SGN</span><i /><b><AirplaneIcon /></b><span>HAN</span></div>
      <p className="sidebar-caption">Không gian làm việc</p>
      <nav aria-label="Điều hướng quản trị">
        <a className="active" href="#dashboard"><PortalIcon name="overview" />Tổng quan</a>
        {mode === 'STAFF' && <><a href="#flights"><PortalIcon name="flight" />Chuyến bay</a><a href="#bookings"><PortalIcon name="booking" />Đặt vé</a></>}
        {mode === 'ADMIN' && <><a href="#customers"><PortalIcon name="customer" />Khách hàng</a><a href="#staff"><PortalIcon name="customer" />Manager</a><a href="#catalogs"><PortalIcon name="flight" />Danh mục bay</a></>}
      </nav>
      <div className="sidebar-system"><i /><div><strong>SkyWay Domestic</strong><span>Hệ thống nội địa</span></div></div>
      <div className="management-sidebar-actions"><button onClick={logout}><PortalIcon name="logout" />Đăng xuất</button></div>
    </aside>

    <div className="management-content">
      <header className="management-header">
        <div><p className="eyebrow">{mode === 'ADMIN' ? 'Administrator portal' : 'Operations portal'}</p><h1>Bảng điều hành</h1><p className="management-subtitle">{mode === 'ADMIN' ? 'Theo dõi toàn bộ hoạt động và dữ liệu của hệ thống.' : 'Theo dõi chuyến bay, đặt chỗ và tình hình khai thác.'}</p></div>
        <div className="management-header-actions">
          {dashboard && <span className="live-dot"><i /> Hệ thống trực tuyến</span>}
          <div className="portal-user"><span>{initials || 'SW'}</span><div><strong>{displayName}</strong><small>{mode === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên vận hành'}</small></div></div>
        </div>
      </header>

      {error && <div className="notice error">{error}</div>}
      {success && <div className="notice success">{success}</div>}
      {!dashboard && !error && <div className="metric-grid metric-skeleton" aria-label="Đang tải dữ liệu"><article /><article /><article /><article /></div>}
      {dashboard && <div className="metric-grid" id="dashboard">
        <article><span className="metric-icon"><PortalIcon name="flight" /></span><div><small>Chuyến bay</small><strong>{dashboard.flights}</strong><em>{mode === 'ADMIN' ? 'Quy mô toàn hệ thống' : 'Đang được vận hành'}</em></div></article>
        <article><span className="metric-icon"><PortalIcon name="booking" /></span><div><small>Đơn đặt vé</small><strong>{dashboard.bookings}</strong><em>{mode === 'ADMIN' ? 'Dữ liệu báo cáo' : 'Cần theo dõi xử lý'}</em></div></article>
        <article><span className="metric-icon"><PortalIcon name={mode === 'ADMIN' ? 'customer' : 'payment'} /></span><div><small>{mode === 'ADMIN' ? 'Khách hàng' : 'Thanh toán'}</small><strong>{mode === 'ADMIN' ? dashboard.customers : dashboard.successfulPayments}</strong><em>{mode === 'ADMIN' ? 'Tài khoản hành khách' : 'Giao dịch thành công'}</em></div></article>
        <article className="revenue-metric"><span className="metric-icon"><PortalIcon name="revenue" /></span><div><small>Doanh thu</small><strong>{money(dashboard.revenue)}</strong><em>Tổng giá trị thanh toán</em></div></article>
      </div>}

      {mode === 'STAFF' && <section className="admin-panel" id="flights">
        <div className="panel-title"><div><span>Flight operations</span><h2>Điều hành chuyến bay</h2></div><b>{flights.length} chuyến</b></div>
        {catalogs && <form className="flight-manage-form" key={editingFlight?.id ?? 'new'} onSubmit={saveFlight}>
          <div className="flight-form-heading"><strong>{editingFlight ? `Sửa chuyến ${editingFlight.flightNumber}` : 'Tạo chuyến bay mới'}</strong>{editingFlight && <button type="button" onClick={() => setEditingFlight(null)}>Hủy sửa</button>}</div>
          <label>Số hiệu<input name="flightNumber" required defaultValue={editingFlight?.flightNumber ?? ''} placeholder="VN210" /></label>
          <label>Máy bay<select name="aircraftId" required defaultValue={catalogs.aircraft.find(item => item.model === editingFlight?.aircraftModel && item.airlineName === editingFlight?.airlineName)?.id ?? ''}><option value="" disabled>Chọn máy bay</option>{catalogs.aircraft.map(item => <option key={item.id} value={item.id}>{item.registrationNumber} · {item.model}</option>)}</select></label>
          <label>Sân bay đi<select name="departureAirportId" required defaultValue={editingFlight?.departureAirport.id ?? ''}><option value="" disabled>Chọn điểm đi</option>{catalogs.airports.map(item => <option key={item.id} value={item.id}>{item.iataCode} · {item.city}</option>)}</select></label>
          <label>Sân bay đến<select name="arrivalAirportId" required defaultValue={editingFlight?.arrivalAirport.id ?? ''}><option value="" disabled>Chọn điểm đến</option>{catalogs.airports.map(item => <option key={item.id} value={item.id}>{item.iataCode} · {item.city}</option>)}</select></label>
          <label>Khởi hành<input name="departureTime" type="datetime-local" required defaultValue={localDateTime(editingFlight?.departureTime)} /></label>
          <label>Hạ cánh<input name="arrivalTime" type="datetime-local" required defaultValue={localDateTime(editingFlight?.arrivalTime)} /></label>
          <div className="flight-fare-editor"><strong>Giá và hạn mức theo hạng vé</strong>{catalogs.fareClasses.map(item => { const currentFare = editingFlight?.fares.find(fare => fare.classCode === item.code); return <label key={item.id}><input type="checkbox" name={`fareEnabled-${item.id}`} defaultChecked={Boolean(currentFare) || (!editingFlight && item === catalogs.fareClasses[0])} /><span>{item.code}</span><input name={`farePrice-${item.id}`} type="number" min="0" placeholder="Giá vé" defaultValue={currentFare?.price ?? ''} /><input name={`fareQuota-${item.id}`} type="number" min="1" placeholder="Số ghế" defaultValue={currentFare?.seatQuota ?? ''} /></label> })}</div>
          <button className="button primary" type="submit">{editingFlight ? 'Lưu thay đổi' : 'Tạo chuyến bay'}</button>
        </form>}
        <div className="table-wrap"><table><thead><tr><th>Chuyến</th><th>Hành trình</th><th>Khởi hành</th><th>Ghế còn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
          {flights.map(flight => <tr key={flight.id}><td><strong>{flight.flightNumber}</strong><small>{flight.airlineName}</small></td><td><span className="route-chip"><b>{flight.departureAirport.iataCode}</b><i>→</i><b>{flight.arrivalAirport.iataCode}</b></span></td><td>{dateTime(flight.departureTime)}</td><td><span className="seat-count">{flight.fares.reduce((sum, fare) => sum + fare.availableSeats, 0)} ghế</span></td><td><select value={flight.status} onChange={event => changeStatus(flight.id, event.target.value)}>{statuses.map(status => <option key={status} value={status}>{flightStatusLabels[status]}</option>)}</select></td><td><button className="table-action" type="button" disabled={!['SCHEDULED', 'DELAYED'].includes(flight.status)} onClick={() => { setEditingFlight(flight); document.querySelector('#flights')?.scrollIntoView({ behavior: 'smooth' }) }}>Sửa lịch</button></td></tr>)}
          {flights.length === 0 && <tr><td className="table-empty" colSpan={6}>Chưa có chuyến bay để hiển thị.</td></tr>}
        </tbody></table></div>
      </section>}

      {mode === 'STAFF' && <section className="admin-panel" id="bookings">
        <div className="panel-title"><div><span>Recent activity</span><h2>Đặt vé gần đây</h2></div><b>{bookings.length} đơn</b></div>
        <div className="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Chuyến</th><th>Hành khách</th><th>Giá trị</th><th>Trạng thái</th></tr></thead><tbody>
          {bookings.map(item => <tr key={item.id}><td><strong>{item.bookingCode}</strong></td><td>{item.customerName}<small>{item.customerEmail}</small></td><td><strong>{item.flightNumber}</strong><small>{item.route}</small></td><td>{item.passengerCount} người</td><td><strong>{money(item.totalAmount)}</strong></td><td><div className="manager-booking-status"><span className={`status ${item.status.toLowerCase()}`}>{bookingStatusLabels[item.status] ?? item.status}</span>{item.status === 'PENDING' && <button type="button" onClick={() => cancelBooking(item.id)}>Hủy đơn</button>}{['PAID', 'REFUND_REQUESTED'].includes(item.status) && <button className="refund" type="button" onClick={() => refundBooking(item.id)}>{item.status === 'REFUND_REQUESTED' ? 'Duyệt hoàn' : 'Hoàn tiền'}</button>}</div></td></tr>)}
          {bookings.length === 0 && <tr><td className="table-empty" colSpan={6}>Chưa có đơn đặt vé gần đây.</td></tr>}
        </tbody></table></div>
      </section>}

      {mode === 'ADMIN' && <section className="admin-panel" id="customers">
        <div className="panel-title"><div><span>Customer accounts</span><h2>Quản lý khách hàng</h2></div><b>{customers.length} tài khoản</b></div>
        <div className="table-wrap"><table><thead><tr><th>Khách hàng</th><th>Tài khoản</th><th>Liên hệ</th><th>Đơn đã đặt</th><th>Ngày tạo</th><th>Trạng thái</th></tr></thead><tbody>
          {customers.map(customer => <tr key={customer.accountId}><td><strong>{customer.fullName}</strong><small>Khách hàng #{customer.customerId}</small></td><td>{customer.username}</td><td>{customer.email ?? '—'}<small>{customer.phone ?? '—'}</small></td><td>{customer.bookingCount} đơn</td><td>{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</td><td><select value={customer.status} onChange={event => changeCustomerStatus(customer.accountId, event.target.value as 'ACTIVE' | 'LOCKED')}><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đã khóa</option></select></td></tr>)}
          {customers.length === 0 && <tr><td className="table-empty" colSpan={6}>Chưa có tài khoản khách hàng.</td></tr>}
        </tbody></table></div>
      </section>}

      {mode === 'ADMIN' && <section className="admin-panel" id="staff">
        <div className="panel-title"><div><span>Operations accounts</span><h2>Quản lý Manager</h2></div><b>{staff.length} tài khoản</b></div>
        <form className="staff-create-form" onSubmit={createStaff}>
          <label>Họ và tên<input name="fullName" required maxLength={150} /></label>
          <label>Tên đăng nhập<input name="username" required minLength={4} maxLength={50} /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Mật khẩu<input name="password" type="password" required minLength={8} /></label>
          <button className="button primary" type="submit">Tạo Manager</button>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Manager</th><th>Tài khoản</th><th>Email</th><th>Ngày tạo</th><th>Trạng thái</th></tr></thead><tbody>
          {staff.map(item => <tr key={item.accountId}><td><strong>{item.fullName}</strong></td><td>{item.username}</td><td>{item.email ?? '—'}</td><td>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td><td><select value={item.status} onChange={event => changeStaffStatus(item.accountId, event.target.value as 'ACTIVE' | 'LOCKED')}><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đã khóa</option></select></td></tr>)}
          {staff.length === 0 && <tr><td className="table-empty" colSpan={5}>Chưa có tài khoản Manager.</td></tr>}
        </tbody></table></div>
      </section>}

      {mode === 'ADMIN' && catalogs && <section className="admin-panel catalog-panel" id="catalogs">
        <div className="panel-title"><div><span>System catalogs</span><h2>Danh mục khai thác bay</h2></div><b>{catalogs.airports.length} sân bay</b></div>
        <AdminCatalogManager catalogs={catalogs} reload={load} notify={(message, failed) => { setError(failed ? message : ''); setSuccess(failed ? '' : message) }} />
      </section>}
    </div>
  </section>
}
