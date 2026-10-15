import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createBooking, getFlight, getOccupiedSeats, payBooking } from '../api/client'
import type { Flight } from '../types'
import AirplaneIcon from '../components/AirplaneIcon'

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const flightId = Number(params.get('flightId'))
  const fareId = Number(params.get('fareId'))
  const legacyCount = Math.min(9, Math.max(1, Number(params.get('passengers')) || 1))
  const requestedAdults = Number(params.get('adults'))
  const requestedSeniors = Math.max(0, Number(params.get('seniors')) || 0)
  const requestedChildren = Math.max(0, Number(params.get('children')) || 0)
  const requestedInfants = Math.max(0, Number(params.get('infants')) || 0)
  const adults = Math.min(9, requestedAdults >= 1 ? requestedAdults : legacyCount)
  const seniors = Math.min(9 - adults, requestedSeniors)
  const children = Math.min(9 - adults - seniors, requestedChildren)
  const infants = Math.min(adults + seniors, 9 - adults - seniors - children, requestedInfants)
  const seniorEnd = adults + seniors
  const seatedCount = seniorEnd + children
  const count = seatedCount + infants
  const [flight, setFlight] = useState<Flight | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingFlight, setLoadingFlight] = useState(true)
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>(Array(count).fill(''))
  const [selectedBaggage, setSelectedBaggage] = useState<string[]>(Array(count).fill(''))
  const [activePassenger, setActivePassenger] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER' | 'E_WALLET'>('CARD')

  const passengerTypeAt = (index: number): 'ADULT' | 'SENIOR' | 'CHILD' | 'INFANT' =>
    index < adults ? 'ADULT' : index < seniorEnd ? 'SENIOR' : index < seatedCount ? 'CHILD' : 'INFANT'
  const passengerLabelAt = (index: number) => {
    if (index < adults) return `Người lớn ${index + 1}`
    if (index < seniorEnd) return `Người cao tuổi ${index - adults + 1}`
    if (index < seatedCount) return `Trẻ em ${index - seniorEnd + 1}`
    return `Em bé ${index - seatedCount + 1}`
  }

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
      seatNumber: index < seatedCount ? String(data.get(`seat-${index}`)) : undefined,
      baggageOptionId: index < seatedCount && data.get(`baggage-${index}`) ? Number(data.get(`baggage-${index}`)) : undefined,
      passengerType: passengerTypeAt(index),
      dateOfBirth: String(data.get(`birth-${index}`)),
      gender: String(data.get(`gender-${index}`)) as 'MALE' | 'FEMALE' | 'OTHER',
    }))
    try {
      const booking = await createBooking({ flightId, fareId, contactEmail: String(data.get('contactEmail')), contactPhone: String(data.get('contactPhone')), passengers })
      await payBooking(booking.id, paymentMethod)
      navigate('/bookings', { state: { created: booking.bookingCode, paid: true } })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể đặt vé') }
    finally { setLoading(false) }
  }

  const fare = flight?.fares.find((item) => item.id === fareId)
  const baggageTotal = flight ? selectedBaggage.reduce((sum, id) =>
    sum + (flight.baggageOptions.find(option => option.id === Number(id))?.price ?? 0), 0) : 0
  const adultFareTotal = fare ? fare.price * adults : 0
  const seniorFareTotal = fare ? fare.price * 0.85 * seniors : 0
  const childFareTotal = fare ? fare.price * 0.75 * children : 0
  const infantFareTotal = fare ? fare.price * 0.10 * infants : 0
  const ticketTotal = adultFareTotal + seniorFareTotal + childFareTotal + infantFareTotal
  const seatRowCount = flight ? Math.ceil(flight.aircraftSeatCapacity / 6) : 0
  const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F']
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
        <div className="passenger-form-intro"><div><strong>Danh sách hành khách</strong><span>{adults} người lớn · {seniors} người cao tuổi · {children} trẻ em · {infants} em bé</span></div><p>Thông tin phải trùng khớp với giấy tờ dùng khi làm thủ tục.</p></div>
        {Array.from({ length: count }, (_, index) => <fieldset key={index}>
          <legend><span>{index + 1}</span> {passengerLabelAt(index)}</legend>
          <label><span>Họ và tên (không dấu)</span><input name={`fullName-${index}`} placeholder="VD: NGUYEN VAN AN" required maxLength={150} pattern="[A-Za-z ]+" title="Chỉ nhập chữ cái không dấu và khoảng trắng" /></label>
          <label><span>Ngày sinh</span><input type="date" name={`birth-${index}`} required /></label>
          <label><span>Giới tính</span><select name={`gender-${index}`} required defaultValue=""><option value="" disabled>Chọn giới tính</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label>
          <label><span>CCCD / Hộ chiếu</span><input name={`document-${index}`} placeholder="Số giấy tờ tùy thân" maxLength={30} /></label>
          {index < seatedCount ? <><label><span>Ghế ngồi</span><input type="hidden" name={`seat-${index}`} value={selectedSeats[index]} required /><button className={`seat-picker-trigger${activePassenger === index ? ' active' : ''}`} type="button" onClick={() => setActivePassenger(index)}>{selectedSeats[index] || 'Chọn trên sơ đồ máy bay'}</button></label><label className="passenger-baggage"><span>Hành lý ký gửi mua thêm</span><select name={`baggage-${index}`} value={selectedBaggage[index]} onChange={event => setSelectedBaggage(current => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}><option value="">Không mua thêm</option>{flight.baggageOptions.map(option => <option key={option.id} value={option.id}>{option.weightKg} kg · {formatMoney(option.price)}</option>)}</select><small>Xách tay miễn phí {flight.cabinBaggageKg} kg{flight.includedCheckedBaggageKg > 0 ? ` · Ký gửi kèm vé ${flight.includedCheckedBaggageKg} kg` : ''}</small></label></> : <div className="infant-seat-note">Em bé đi cùng người lớn và không sử dụng ghế riêng.</div>}
        </fieldset>)}
        <section className="booking-detail-section contact-information">
          <header><div><strong>Thông tin liên lạc</strong><span>Thông báo vé và thay đổi chuyến bay sẽ được gửi tới đây.</span></div></header>
          <div className="contact-fields"><label><span>Email *</span><input name="contactEmail" type="email" placeholder="email@example.com" required maxLength={150} /></label><label><span>Số điện thoại *</span><input name="contactPhone" type="tel" placeholder="0912345678" required pattern="[0-9+]{9,15}" title="Nhập 9–15 chữ số, có thể bắt đầu bằng dấu +" /></label></div>
        </section>
        <section className="aircraft-seat-picker">
          <header><div><strong>Sơ đồ ghế trên máy bay</strong><span>Đang chọn cho {passengerLabelAt(activePassenger).toLowerCase()}</span></div><div className="seat-legend"><i className="available" />Trống <i className="selected" />Đã chọn <i className="occupied" />Đã có người</div></header>
          <div className="aircraft-cabin"><div className="cockpit"><AirplaneIcon /><span>Đầu máy bay</span></div><div className="seat-chart"><div className="seat-number-row"><i />{Array.from({ length: seatRowCount }, (_, row) => <span key={row}>{row + 1}</span>)}</div>{seatLetters.map((letter, letterIndex) => <div className={`seat-letter-row${letterIndex === 3 ? ' aisle-start' : ''}`} key={letter}><b>{letter}</b>{Array.from({ length: seatRowCount }, (_, row) => { const seat = `${row + 1}${letter}`; const exists = row * 6 + letterIndex < (flight?.aircraftSeatCapacity ?? 0); const occupied = occupiedSeats.includes(seat); const chosenBy = selectedSeats.indexOf(seat); const selected = chosenBy >= 0; return exists ? <button key={seat} type="button" disabled={occupied} className={`${occupied ? 'occupied' : ''}${selected ? ' selected' : ''}`} aria-label={`Ghế ${seat}`} title={occupied ? `${seat} đã có người` : `Ghế ${seat}`} onClick={() => { if (selected && chosenBy !== activePassenger) return; const clearing = selectedSeats[activePassenger] === seat; const nextSeats = selectedSeats.map((value, index) => index === activePassenger ? (clearing ? '' : seat) : value); setSelectedSeats(nextSeats); if (!clearing) { const nextPassenger = nextSeats.findIndex((value, index) => index > activePassenger && index < seatedCount && !value); const firstEmpty = nextSeats.findIndex((value, index) => index < seatedCount && !value); if (nextPassenger >= 0) setActivePassenger(nextPassenger); else if (firstEmpty >= 0) setActivePassenger(firstEmpty) } }} /> : <i key={seat} /> })}</div>)}</div><div className="aircraft-tail">Lối đi · 3–3</div></div>
        </section>
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
          <div className="checkout-fare-lines"><span><small>Người lớn · 100%</small><strong>{formatMoney(fare.price)} × {adults}</strong></span>{seniors > 0 && <span><small>Người cao tuổi · 85%</small><strong>{formatMoney(fare.price * 0.85)} × {seniors}</strong></span>}{children > 0 && <span><small>Trẻ em · 75%</small><strong>{formatMoney(fare.price * 0.75)} × {children}</strong></span>}{infants > 0 && <span><small>Em bé không ghế · 10%</small><strong>{formatMoney(fare.price * 0.10)} × {infants}</strong></span>}<span><small>Hành lý mua thêm</small><strong>{formatMoney(baggageTotal)}</strong></span><span><small>Thuế và phí</small><strong>Đã bao gồm</strong></span></div>
          <fieldset className="payment-methods"><legend>Hình thức thanh toán</legend>{([['CARD', 'Thẻ ngân hàng', 'Visa, Mastercard, NAPAS'], ['BANK_TRANSFER', 'Chuyển khoản', 'Chuyển khoản ngân hàng'], ['E_WALLET', 'Ví điện tử', 'Ví điện tử nội địa']] as const).map(([value, title, caption]) => <label key={value} className={paymentMethod === value ? 'selected' : ''}><input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} /><span><b>{title}</b><small>{caption}</small></span></label>)}</fieldset>
          <div className="checkout-total"><span>Tổng cộng</span><strong>{formatMoney(ticketTotal + baggageTotal)}</strong></div>
          <button className="button primary full" form="booking-passengers" disabled={loading || !flight || !fare}>{loading ? 'Đang thanh toán…' : 'Đặt vé và thanh toán'}</button>
          <Link to="/flights">← Chọn chuyến bay khác</Link>
        </>
      </aside>
    </div>}
    {!loadingFlight && (!flight || !fare) && <div className="customer-empty-state checkout-unavailable">
      <span><AirplaneIcon /></span><h2>Chưa thể tiếp tục đặt vé</h2><p>Chuyến bay hoặc hạng vé không còn hợp lệ. Hãy quay lại danh sách để chọn hành trình khác.</p><Link className="button primary" to="/flights">Chọn lại chuyến bay</Link>
    </div>}
  </section>
}
