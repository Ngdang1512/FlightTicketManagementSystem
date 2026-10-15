import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUpcomingDomesticFlights } from '../api/client'
import type { Flight } from '../types'
import AirplaneIcon from '../components/AirplaneIcon'

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
const localDate = (value: string) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
const duration = (departure: string, arrival: string) => {
  const minutes = Math.round((new Date(arrival).getTime() - new Date(departure).getTime()) / 60_000)
  return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`
}
const flightUrl = (flight: Flight) => `/flights?${new URLSearchParams({ departure: flight.departureAirport.iataCode, arrival: flight.arrivalAirport.iataCode, date: localDate(flight.departureTime), passengers: '1' })}`

export default function HomePage() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUpcomingDomesticFlights(1).then(setFlights)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu chuyến bay'))
      .finally(() => setLoading(false))
  }, [])

  const featured = flights[0]
  const routes = useMemo(() => {
    const unique = new Map<string, Flight>()
    flights.forEach(flight => {
      const key = `${flight.departureAirport.iataCode}-${flight.arrivalAirport.iataCode}`
      if (!unique.has(key)) unique.set(key, flight)
    })
    return [...unique.values()].slice(0, 6)
  }, [flights])
  const airportCount = new Set(flights.flatMap(item => [item.departureAirport.id, item.arrivalAirport.id])).size
  const airlineCount = new Set(flights.map(item => item.airlineCode)).size
  const lowestFare = featured ? Math.min(...featured.fares.map(item => item.price)) : 0

  return <section className="sky-home">
    <div className="home-hero page">
      <div className="home-copy">
        <span className="home-badge"><i /> Bay nội địa · Khám phá Việt Nam</span>
        <h1>Mỗi miền đất,<br /><em>một hành trình</em> đáng nhớ.</h1>
        <p>Tìm chuyến bay giữa các thành phố Việt Nam, so sánh hạng vé và quản lý hành trình trong một trải nghiệm thật gọn gàng.</p>
        <div className="home-actions"><Link className="button primary" to="/flights">Tìm chuyến bay <span aria-hidden="true">→</span></Link><Link className="button secondary" to="/register">Tạo tài khoản</Link></div>
        <div className="home-stats" aria-label="Dữ liệu hệ thống">
          <div><strong>{loading ? '—' : String(airportCount).padStart(2, '0')}</strong><span>Điểm đến đang khai thác</span></div>
          <div><strong>{loading ? '—' : String(airlineCount).padStart(2, '0')}</strong><span>Hãng hàng không</span></div>
          <div><strong>{loading ? '—' : String(flights.length).padStart(2, '0')}</strong><span>Chuyến sắp khởi hành</span></div>
        </div>
      </div>

      {loading && <aside className="home-ticket home-ticket-loading" aria-label="Đang tải chuyến bay"><i /><i /><i /></aside>}
      {!loading && featured && <aside className="home-ticket" aria-label="Chuyến bay nội địa nổi bật">
        <div className="home-ticket-head"><div><span>Chuyến bay nổi bật</span><strong>{featured.airlineName} · {featured.flightNumber}</strong></div><span className="home-direct">Bay thẳng</span></div>
        <div className="home-ticket-note"><span>Hành lý ký gửi</span><strong>{featured.includedCheckedBaggageKg} kg</strong><span>Hành lý xách tay</span><strong>{featured.cabinBaggageKg} kg</strong></div>
        <div className="home-ticket-route"><div><small>Khởi hành</small><strong>{featured.departureAirport.iataCode}</strong><span>{featured.departureAirport.city}</span></div><div className="home-flight-path"><i /><b><AirplaneIcon /></b><small>{duration(featured.departureTime, featured.arrivalTime)}</small></div><div><small>Điểm đến</small><strong>{featured.arrivalAirport.iataCode}</strong><span>{featured.arrivalAirport.city}</span></div></div>
        <div className="home-ticket-foot"><div><small>Giá từ</small><strong>{money(lowestFare)}</strong></div><Link to={flightUrl(featured)}>Chọn chuyến bay</Link></div>
      </aside>}
      {!loading && !featured && <aside className="home-ticket home-ticket-empty"><AirplaneIcon /><strong>Chưa có chuyến sắp khởi hành</strong><span>{error || 'Lịch bay mới sẽ được cập nhật tại đây.'}</span></aside>}
    </div>

    <div className="home-feature-wrap"><div className="home-features page">
      <article><span>01</span><div><h2>Tìm nhanh</h2><p>Lọc theo hành trình, ngày bay và số hành khách chỉ trong vài bước.</p></div></article>
      <article><span>02</span><div><h2>Giá rõ ràng</h2><p>Xem đúng hạng vé, số ghế còn lại và tổng chi phí trước khi đặt.</p></div></article>
      <article><span>03</span><div><h2>Quản lý dễ</h2><p>Lưu trữ đơn đặt chỗ, vé điện tử và trạng thái thanh toán tại một nơi.</p></div></article>
    </div></div>

    <div className="home-routes page">
      <div className="home-section-heading"><div><p className="eyebrow">Lịch bay đang mở bán</p><h2>Bay khắp Việt Nam</h2></div><Link to="/flights">Xem tất cả chuyến bay →</Link></div>
      {routes.length > 0 && <div className="home-route-grid">{routes.map(flight => <Link key={flight.id} to={flightUrl(flight)} className="home-route-card"><span>{flight.departureAirport.iataCode}</span><i>→</i><span>{flight.arrivalAirport.iataCode}</span><small>{flight.departureAirport.city} · {flight.arrivalAirport.city}</small><b>Từ {money(Math.min(...flight.fares.map(item => item.price)))}</b></Link>)}</div>}
      {!loading && routes.length === 0 && <div className="home-routes-empty">Chưa có đường bay nào đang mở bán.</div>}
    </div>
  </section>
}
