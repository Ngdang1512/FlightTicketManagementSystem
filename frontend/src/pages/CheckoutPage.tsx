import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createBooking, getFlight, getOccupiedSeats } from '../api/client'
import type { Flight } from '../types'
import AirplaneIcon from '../components/AirplaneIcon'

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const flightId = Number(params.get('flightId'))
  const fareId = Number(params.get('fareId'))
  const count = Math.min(9, Math.max(1, Number(params.get('passengers')) || 1))
  const [flight, setFlight] = useState<Flight | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingFlight, setLoadingFlight] = useState(true)
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>(Array(count).fill(''))
  const [selectedBaggage, setSelectedBaggage] = useState<string[]>(Array(count).fill(''))

  useEffect(() => {
    setError('')
    setFlight(null)
    if (!flightId || !fareId) { setError('Thông tin chuyến bay không hợp lệ'); setLoadingFlight(false); return }
    setLoadingFlight(true)
    Promise.all([getFlight(flightId), getOccupiedSeats(flightId)])
      .then(([item, seats]) => { setFlight(item); setOccupiedSeats(seats) })
      .catch((reason) => setError(reason.message)).finally(() => setLoadingFlight(false))
  }, [flightId, fareId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const data = new FormData(event.currentTarget)
    const passengers = Array.from({ length: count }, (_, index) => ({
      fullName: String(data.get(`fullName-${index}`)),
      documentNumber: String(data.get(`document-${index}`)) || undefined,
      seatNumber: String(data.get(`seat-${index}`)),
      baggageOptionId: data.get(`baggage-${index}`) ? Number(data.get(`baggage-${index}`)) : undefined,
    }))
    try {
      const booking = await createBooking({ flightId, fareId, passengers })
      navigate('/bookings', { state: { created: booking.bookingCode } })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể đặt vé') }
    finally { setLoading(false) }
  }

  const fare = flight?.fares.find((item) => item.id === fareId)
  const baggageTotal = flight ? selectedBaggage.reduce((sum, id) =>
    sum + (flight.baggageOptions.find(option => option.id === Number(id))?.price ?? 0), 0) : 0
  const seatOptions = flight ? Array.from({ length: flight.aircraftSeatCapacity }, (_, index) => {
    const row = Math.floor(index / 6) + 1
    return `${row}${String.fromCharCode(65 + index % 6)}`
  }) : []
  const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
  const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
  const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))

  return <section className="customer-page checkout-page">
    <div className="customer-page-heading checkout-heading">
      <div><p className="eyebrow">Xác nhận hành trình</p><h1>Thông tin hành khách</h1><p>Kiểm tra chuyến bay và điền chính xác thông tin giấy tờ của từng hành khách.</p></div>
      <div className="checkout-steps" aria-label="Tiến trình đặt vé"><span className="done">1</span><i /><span className="active">2</span><i /><span>3</span></div>
    </div>

    {error && <div className="notice error">{error}</div>}
    {!loadingFlight && flight && !fare && <div className="notice error">Hạng vé không còn hợp lệ. Vui lòng chọn lại chuyến bay.</div>}
    {loadingFlight && <div className="checkout-loading"><i /><span>Đang tải thông tin chuyến bay…</span></div>}

    {!loadingFlight && flight && fare && <div className="checkout-layout">
      <form id="booking-passengers" className="passenger-form" onSubmit={submit}>
        <div className="passenger-form-intro"><div><strong>Danh sách hành khách</strong><span>{count} hành khách</span></div><p>Thông tin phải trùng khớp với CCCD hoặc hộ chiếu dùng khi làm thủ tục.</p></div>
        {Array.from({ length: count }, (_, index) => <fieldset key={index}>
          <legend><span>{index + 1}</span> Hành khách {index + 1}</legend>
          <label><span>Họ và tên</span><input name={`fullName-${index}`} placeholder="Nhập họ và tên đầy đủ" required maxLength={150} /></label>
          <label><span>CCCD / Hộ chiếu</span><input name={`document-${index}`} placeholder="Số giấy tờ tùy thân" maxLength={30} /></label>
          <label><span>Ghế ngồi</span><select name={`seat-${index}`} required value={selectedSeats[index]} onChange={event => setSelectedSeats(current => current.map((seat, seatIndex) => seatIndex === index ? event.target.value : seat))}><option value="">Chọn ghế</option>{seatOptions.map(seat => <option key={seat} value={seat} disabled={occupiedSeats.includes(seat) || selectedSeats.some((selected, selectedIndex) => selectedIndex !== index && selected === seat)}>{seat}{occupiedSeats.includes(seat) ? ' · Đã có người chọn' : ''}</option>)}</select></label>
          <label className="passenger-baggage"><span>Hành lý ký gửi mua thêm</span><select name={`baggage-${index}`} value={selectedBaggage[index]} onChange={event => setSelectedBaggage(current => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}><option value="">Không mua thêm</option>{flight.baggageOptions.map(option => <option key={option.id} value={option.id}>{option.weightKg} kg · {formatMoney(option.price)}</option>)}</select><small>Xách tay miễn phí {flight.cabinBaggageKg} kg{flight.includedCheckedBaggageKg > 0 ? ` · Ký gửi kèm vé ${flight.includedCheckedBaggageKg} kg` : ''}</small></label>
        </fieldset>)}
        <div className="checkout-assurance"><span>✓</span><p><strong>Thông tin được bảo mật</strong>Dữ liệu chỉ được sử dụng để phát hành vé và phục vụ chuyến bay.</p></div>
      </form>

      <aside className="checkout-summary-card">
        <>
          <header><div><span>{flight.airlineName}</span><strong>{flight.flightNumber}</strong></div><span>{fare.className}</span></header>
          <div className="checkout-route">
            <div><small>{formatDate(flight.departureTime)}</small><strong>{formatTime(flight.departureTime)}</strong><span>{flight.departureAirport.iataCode}</span></div>
            <div><i /><b><AirplaneIcon /></b><small>Bay thẳng</small></div>
            <div><small>Điểm đến</small><strong>{formatTime(flight.arrivalTime)}</strong><span>{flight.arrivalAirport.iataCode}</span></div>
          </div>
          <div className="checkout-fare-lines"><span><small>Giá vé</small><strong>{formatMoney(fare.price)} × {count}</strong></span><span><small>Hành lý mua thêm</small><strong>{formatMoney(baggageTotal)}</strong></span><span><small>Thuế và phí</small><strong>Đã bao gồm</strong></span></div>
          <div className="checkout-total"><span>Tổng cộng</span><strong>{formatMoney(fare.price * count + baggageTotal)}</strong></div>
          <button className="button primary full" form="booking-passengers" disabled={loading || !flight || !fare}>{loading ? 'Đang giữ chỗ…' : 'Xác nhận đặt vé'}</button>
          <Link to="/flights">← Chọn chuyến bay khác</Link>
        </>
      </aside>
    </div>}
    {!loadingFlight && (!flight || !fare) && <div className="customer-empty-state checkout-unavailable">
      <span><AirplaneIcon /></span><h2>Chưa thể tiếp tục đặt vé</h2><p>Chuyến bay hoặc hạng vé không còn hợp lệ. Hãy quay lại danh sách để chọn hành trình khác.</p><Link className="button primary" to="/flights">Chọn lại chuyến bay</Link>
    </div>}
  </section>
}
