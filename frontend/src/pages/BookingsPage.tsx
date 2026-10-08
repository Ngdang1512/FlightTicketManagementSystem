import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cancelBooking, getMyBookings, payBooking, requestBookingRefund } from '../api/client'
import type { Booking } from '../types'
import AirplaneIcon from '../components/AirplaneIcon'

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
const time = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date(value))
const date = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date(value))
const statusLabels: Record<Booking['status'], string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  REFUND_REQUESTED: 'Đang chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Đã hết hạn',
}

export default function BookingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await getMyBookings())
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Không thể tải đơn đặt vé'
      setError(message)
      if (message.toLowerCase().includes('đăng nhập') || message.includes('401')) navigate('/login')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { load() }, [load])

  async function pay(id: number) {
    setBusy(id); setError('')
    try { await payBooking(id, 'CARD'); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Thanh toán thất bại') }
    finally { setBusy(null) }
  }

  async function cancel(id: number) {
    setBusy(id); setError('')
    try { await cancelBooking(id); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Hủy thất bại') }
    finally { setBusy(null) }
  }

  async function requestRefund(id: number) {
    setBusy(id); setError('')
    try { await requestBookingRefund(id); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể gửi yêu cầu hoàn tiền') }
    finally { setBusy(null) }
  }

  const summary = useMemo(() => ({
    total: items.length,
    pending: items.filter(item => item.status === 'PENDING').length,
    completed: items.filter(item => item.status === 'PAID').length,
  }), [items])

  return <section className="customer-page bookings-page" id="history">
    <div className="customer-page-heading">
      <div><p className="eyebrow">Hành trình cá nhân</p><h1>Đơn đặt vé của tôi</h1><p>Theo dõi trạng thái, thanh toán và vé điện tử của mọi hành trình.</p></div>
      <Link className="button primary" to="/flights">Tìm chuyến bay mới</Link>
    </div>

    {!loading && items.length > 0 && <div className="booking-overview" aria-label="Tổng quan đặt vé">
      <div><span>Tất cả hành trình</span><strong>{summary.total}</strong></div>
      <div><span>Chờ thanh toán</span><strong>{summary.pending}</strong></div>
      <div><span>Đã xuất vé</span><strong>{summary.completed}</strong></div>
    </div>}

    {location.state?.created && <div className="notice success">Đã giữ chỗ thành công · Mã đặt chỗ <strong>{location.state.created}</strong></div>}
    {error && <div className="notice error">{error}</div>}
    {loading && <div className="booking-loading" aria-label="Đang tải đơn đặt vé"><i /><i /><i /></div>}

    {!loading && <div className="booking-list">{items.map(item => <article className="booking-card" key={item.id}>
      <header className="booking-card-head">
        <div><span>Mã đặt chỗ</span><strong>{item.bookingCode}</strong></div>
        <span className={`status ${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span>
      </header>
      <div className="booking-route">
        <div><small>{date(item.departureTime)}</small><strong>{time(item.departureTime)}</strong><span>{item.departureCode}</span></div>
        <div className="booking-route-line"><i /><b><AirplaneIcon /></b><small>{item.airlineName} · {item.flightNumber}</small></div>
        <div><small>Điểm đến</small><strong>{time(item.arrivalTime)}</strong><span>{item.arrivalCode}</span></div>
      </div>
      <div className="booking-meta">
        <span><small>Hạng vé</small><strong>{item.fareClass}</strong></span>
        <span><small>Hành khách</small><strong>{item.passengerCount} người</strong></span>
        <span><small>Ngày đặt</small><strong>{date(item.bookedAt)}</strong></span>
        <span><small>Hành lý ký gửi</small><strong>{item.passengers.reduce((sum, passenger) => sum + passenger.checkedBaggageKg, 0)} kg</strong></span>
      </div>
      {item.tickets.length > 0 && <div className="tickets"><strong>Vé điện tử</strong><div>{item.tickets.map(ticket => <span key={ticket.id}><b>{ticket.electronicTicketCode}</b><small>{ticket.passengerName}</small></span>)}</div></div>}
      <footer className="booking-card-foot">
        <div><small>Tổng thanh toán</small><strong>{money(item.totalAmount)}</strong></div>
        {item.status === 'PENDING' && <div className="booking-actions"><button className="button secondary" disabled={busy === item.id} onClick={() => cancel(item.id)}>Hủy đặt chỗ</button><button className="button primary" disabled={busy === item.id} onClick={() => pay(item.id)}>{busy === item.id ? 'Đang xử lý…' : 'Thanh toán thẻ'}</button></div>}
        {item.status === 'PAID' && <div className="booking-actions"><button className="button secondary" disabled={busy === item.id} onClick={() => requestRefund(item.id)}>{busy === item.id ? 'Đang gửi…' : 'Yêu cầu hoàn vé'}</button></div>}
      </footer>
    </article>)}</div>}

    {!loading && !error && items.length === 0 && <div className="customer-empty-state">
      <span><AirplaneIcon /></span><h2>Chưa có hành trình nào</h2><p>Chuyến bay bạn đặt sẽ xuất hiện tại đây để tiện theo dõi.</p><Link className="button primary" to="/flights">Tìm chuyến bay</Link>
    </div>}
  </section>
}
