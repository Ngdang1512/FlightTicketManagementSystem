import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUpcomingDomesticFlights, searchFlights } from '../api/client'
import type { Flight } from '../types'
import AirplaneIcon from '../components/AirplaneIcon'

const defaultDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
const defaultReturnDate = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10)
const domesticAirports = [
  { code: 'SGN', city: 'TP. Hồ Chí Minh', name: 'Tân Sơn Nhất' },
  { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài' },
  { code: 'DAD', city: 'Đà Nẵng', name: 'Đà Nẵng' },
  { code: 'CXR', city: 'Nha Trang', name: 'Cam Ranh' },
  { code: 'PQC', city: 'Phú Quốc', name: 'Phú Quốc' },
  { code: 'HUI', city: 'Huế', name: 'Phú Bài' },
]

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date(value))

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(value)

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date(value))

const duration = (departure: string, arrival: string) => {
  const minutes = Math.round((new Date(arrival).getTime() - new Date(departure).getTime()) / 60_000)
  return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`
}

const domesticCityLabel = (code: string, fallback: string) =>
  domesticAirports.find(airport => airport.code === code)?.city ?? fallback

type IconName = 'airport' | 'calendar' | 'passengers' | 'swap' | 'filter' | 'luggage' | 'cabin' | 'plane' | 'chevron'

function UiIcon({ name }: { name: IconName }) {
  const common = { className: 'ui-icon', viewBox: '0 0 24 24', 'aria-hidden': true }

  if (name === 'airport') return <svg {...common}><path d="m3.5 14.5 7.2 1.6 8.8-7.4c.9-.8 1.2-2 .6-2.6-.6-.6-1.8-.3-2.6.5l-3.1 2.7-6.1-2.2-1.4 1.2 4.5 3.5-3.1 2.6-2.5-.8-2.3.9Z" /><path d="M4 20h16" /></svg>
  if (name === 'calendar') return <svg {...common}><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" /></svg>
  if (name === 'passengers') return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.3c0-2.6 2.4-4.7 5.5-4.7s5.5 2.1 5.5 4.7V19M16 11a2.5 2.5 0 1 0 0-5M16 13.5c2.6 0 4.5 1.7 4.5 3.8V19" /></svg>
  if (name === 'swap') return <svg {...common}><path d="m7 7-3 3 3 3M4 10h14M17 17l3-3-3-3M20 14H6" /></svg>
  if (name === 'filter') return <svg {...common}><path d="M4 5h16l-6.3 7.1V18l-3.4 1.7v-7.6L4 5Z" /></svg>
  if (name === 'luggage') return <svg {...common}><rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V4.5h6V7M9 11v5M15 11v5M8 22h.01M16 22h.01" /></svg>
  if (name === 'cabin') return <svg {...common}><path d="M7 8V5.5A2.5 2.5 0 0 1 9.5 3h5A2.5 2.5 0 0 1 17 5.5V8M5 8h14v12H5zM9 12v4M15 12v4" /></svg>
  if (name === 'plane') return <svg {...common}><path fill="currentColor" stroke="none" d="M12 2.5c-.8 0-1.35.7-1.35 1.5v5.3L4 13.2v1.9l6.65-2.1v4.5l-1.8 1.35v1.4L12 19.4l3.15.85v-1.4l-1.8-1.35V13L20 15.1v-1.9l-6.65-3.9V4c0-.8-.55-1.5-1.35-1.5Z" /></svg>
  return <svg {...common}><path d="m7.5 14.5 4.5-4 4.5 4" /></svg>
}

function AirlineMark({ code }: { code: string }) {
  const normalizedCode = code.toUpperCase()

  if (normalizedCode === 'VN') {
    return (
      <span className="airline-mark vietnam-airlines" aria-label="Vietnam Airlines">
        <svg viewBox="0 0 48 30" aria-hidden="true">
          <path className="lotus-petal lotus-left" d="M23.7 25.4C15.8 23.4 11.6 18 11 9.3c5.8 2.6 10.1 7.9 12.7 16.1Z" />
          <path className="lotus-petal lotus-right" d="M24.3 25.4C32.2 23.4 36.4 18 37 9.3c-5.8 2.6-10.1 7.9-12.7 16.1Z" />
          <path className="lotus-petal lotus-center" d="M24 24.1c-4.5-5.7-4.5-12 0-18.8 4.5 6.8 4.5 13.1 0 18.8Z" />
          <path className="lotus-base" d="M8.2 17.2c4.2 5.2 9.5 8.2 15.8 9.1-7.7 1.2-13-.9-15.8-6.3v-2.8Zm31.6 0c-4.2 5.2-9.5 8.2-15.8 9.1 7.7 1.2 13-.9 15.8-6.3v-2.8Z" />
        </svg>
      </span>
    )
  }

  if (normalizedCode === 'QH') {
    return (
      <span className="airline-mark bamboo-airways" aria-label="Bamboo Airways">
        <svg viewBox="0 0 48 30" aria-hidden="true">
          <path className="bamboo-stem" d="M5 23.8C14.6 12.2 27.2 6.6 42.8 7c-12 3.1-22.9 9.5-32.5 19.1L5 23.8Z" />
          <path className="bamboo-leaf bamboo-leaf-one" d="M10.4 21.2c5.3-6.4 11.5-9.5 18.7-9.2-4.6 2.1-8.9 5.8-12.9 11.1l-5.8-1.9Z" />
          <path className="bamboo-leaf bamboo-leaf-two" d="M23.7 14.3c5.1-4.2 10.9-6.1 17.5-5.7-4 1.8-7.9 4.5-11.5 8.1l-6-2.4Z" />
        </svg>
      </span>
    )
  }

  if (normalizedCode === 'VJ') {
    return (
      <span className="airline-mark vietjet-air" aria-label="VietJet Air">
        <svg viewBox="0 0 48 32" aria-hidden="true">
          <path d="M4 21.7c10.5-8.7 23-11.7 37.5-9-8.6 2.3-16.5 6.4-23.8 12.4-5.3.2-9.8-1-13.7-3.4Z" />
          <path d="M17.8 20.8c6.6-4.7 14.4-7.1 23.4-7.2-5.6 2.7-10.4 6.4-14.5 11.2-3.4-.2-6.4-1.5-8.9-4Z" />
        </svg>
      </span>
    )
  }

  return <span className="airline-mark airline-code-mark" aria-label={normalizedCode}>{normalizedCode}</span>
}

export default function FlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [passengerCount, setPassengerCount] = useState(1)
  const [departure, setDeparture] = useState('SGN')
  const [arrival, setArrival] = useState('HAN')
  const [date, setDate] = useState(defaultDate)
  const [returnDate, setReturnDate] = useState(defaultReturnDate)
  const [fareClass, setFareClass] = useState('ECONOMY')
  const [minPrice, setMinPrice] = useState(500_000)
  const [maxPrice, setMaxPrice] = useState(5_000_000)
  const [airline, setAirline] = useState('ALL')
  const [sort, setSort] = useState('PRICE')
  const [stops, setStops] = useState('ALL')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [collapsedFlights, setCollapsedFlights] = useState<Set<number>>(() => new Set())

  async function loadFlights() {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ departure, arrival, date, passengers: String(passengerCount) })
    try {
      setFlights(await searchFlights(params))
    } catch (reason) {
      setFlights([])
      setError(reason instanceof Error ? reason.message : 'Không thể tải chuyến bay')
    } finally {
      setSearched(true)
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    loadFlights()
  }

  useEffect(() => {
    setLoading(true)
    getUpcomingDomesticFlights(1).then(items => {
      if (items[0]) {
        const first = items[0]
        setFlights(items.filter(item => item.departureAirport.iataCode === first.departureAirport.iataCode
          && item.arrivalAirport.iataCode === first.arrivalAirport.iataCode))
        setDeparture(first.departureAirport.iataCode)
        setArrival(first.arrivalAirport.iataCode)
        const firstDepartureDate = new Date(first.departureTime)
        setDate(firstDepartureDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }))
        setReturnDate(new Date(firstDepartureDate.getTime() + 2 * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }))
      } else {
        setFlights([])
      }
      setSearched(true)
    }).catch(reason => setError(reason instanceof Error ? reason.message : 'Không thể tải chuyến bay'))
      .finally(() => setLoading(false))
  }, [])

  const airlines = useMemo(() => Array.from(new Set(flights.map(flight => flight.airlineName))), [flights])
  const visibleFlights = useMemo(() => flights
    .map(flight => ({ ...flight, fares: flight.fares.filter(fare =>
      (fareClass === 'ALL' || fare.classCode === fareClass) && fare.price >= minPrice && fare.price <= maxPrice) }))
    .filter(flight => flight.fares.length > 0 && (airline === 'ALL' || flight.airlineName === airline))
    .sort((first, second) => sort === 'TIME'
      ? new Date(first.departureTime).getTime() - new Date(second.departureTime).getTime()
      : Math.min(...first.fares.map(fare => fare.price)) - Math.min(...second.fares.map(fare => fare.price))),
  [flights, fareClass, minPrice, maxPrice, airline, sort])

  const flightOptions = useMemo(() => visibleFlights.map(flight => ({
    flight,
    fare: [...flight.fares].sort((first, second) => first.price - second.price)[0],
  })), [visibleFlights])

  function swapAirports() {
    setDeparture(arrival)
    setArrival(departure)
  }

  function toggleFlight(flightId: number) {
    setCollapsedFlights(current => {
      const next = new Set(current)
      if (next.has(flightId)) next.delete(flightId)
      else next.add(flightId)
      return next
    })
  }

  return (
    <section className="domestic-flights">
      <div className="flight-search-strip">
        <form className="domestic-search" onSubmit={handleSubmit}>
          <label className="origin-search-control">
            <span>Điểm khởi hành</span>
            <div className="search-field"><UiIcon name="airport" /><select aria-label="Điểm khởi hành" value={departure} onChange={event => setDeparture(event.target.value)}>{domesticAirports.map(airport => <option key={airport.code} value={airport.code}>{airport.city} ({airport.code})</option>)}</select></div>
          </label>
          <button className="airport-swap" type="button" onClick={swapAirports} aria-label="Đổi điểm đi và điểm đến"><UiIcon name="swap" /></button>
          <label className="destination-search-control">
            <span>Điểm đến</span>
            <div className="search-field"><UiIcon name="airport" /><select aria-label="Điểm đến" value={arrival} onChange={event => setArrival(event.target.value)}>{domesticAirports.map(airport => <option key={airport.code} value={airport.code}>{airport.city} ({airport.code})</option>)}</select></div>
          </label>
          <label className="date-search-control">
            <span>Ngày bay <i className="date-toggle" aria-hidden="true" /></span>
            <div className="search-field date-range-field"><UiIcon name="calendar" /><input aria-label="Ngày khởi hành" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={event => { const value = event.target.value; setDate(value); if (returnDate < value) setReturnDate(value) }} required /><b aria-hidden="true">–</b><input aria-label="Ngày trở về" type="date" value={returnDate} min={date} onChange={event => setReturnDate(event.target.value)} required /></div>
          </label>
          <label className="passenger-search-control">
            <span>Hành khách</span>
            <div className="passenger-stepper"><UiIcon name="passengers" /><button type="button" onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}>−</button><strong>{passengerCount}</strong><button type="button" onClick={() => setPassengerCount(Math.min(9, passengerCount + 1))}>+</button></div>
          </label>
          <button className="button primary search-ticket" disabled={loading}>{loading ? 'Đang tìm…' : 'Tìm chuyến bay'}</button>
        </form>
      </div>
      {error && <div className="notice error customer-notice">{error}</div>}
      <div className="flight-browser">
        <aside className={`flight-filters${mobileFiltersOpen ? ' mobile-open' : ''}`} id="flight-filters">
          <div className="filter-heading"><strong>Bộ lọc</strong><button type="button" onClick={() => { setFareClass('ECONOMY'); setMinPrice(500_000); setMaxPrice(5_000_000); setAirline('ALL'); setStops('ALL') }}>Đặt lại</button></div>
          <fieldset><legend>Điểm dừng</legend><label><input type="radio" name="stops" checked={stops === 'ALL'} onChange={() => setStops('ALL')} /> Tất cả</label><label><input type="radio" name="stops" checked={stops === 'DIRECT'} onChange={() => setStops('DIRECT')} /> Bay thẳng</label><label className="disabled-filter"><input type="radio" disabled /> 1 điểm dừng</label><label className="disabled-filter"><input type="radio" disabled /> 2 điểm dừng</label></fieldset>
          <fieldset><legend>Khoảng giá</legend><div className="price-slider" style={{ background: `linear-gradient(to right, #d8dcdf 0%, #d8dcdf ${minPrice / 60_000}%, #176df5 ${minPrice / 60_000}%, #176df5 ${maxPrice / 60_000}%, #d8dcdf ${maxPrice / 60_000}%, #d8dcdf 100%)` }}><input className="price-min" aria-label="Giá tối thiểu" type="range" min={0} max={6_000_000} step={100_000} value={minPrice} onChange={event => setMinPrice(Math.min(Number(event.target.value), maxPrice - 100_000))} /><input className="price-max" aria-label="Giá tối đa" type="range" min={0} max={6_000_000} step={100_000} value={maxPrice} onChange={event => setMaxPrice(Math.max(Number(event.target.value), minPrice + 100_000))} /></div><div className="range-label"><span>{formatMoney(minPrice)}</span><strong>{formatMoney(maxPrice)}</strong></div></fieldset>
          <fieldset><legend>Hạng vé</legend>{[['ALL', 'Tất cả'], ['ECONOMY', 'Phổ thông'], ['BUSINESS', 'Thương gia']].map(([value, label]) => <label key={value}><input type="radio" name="fareClass" value={value} checked={fareClass === value} onChange={() => setFareClass(value)} /> {label}</label>)}<label className="disabled-filter"><input type="radio" disabled /> Hạng nhất</label><label className="disabled-filter"><input type="radio" disabled /> Hạng riêng</label></fieldset>
          {airlines.length > 0 && <fieldset><legend>Hãng hàng không</legend><label><input type="radio" name="airline" checked={airline === 'ALL'} onChange={() => setAirline('ALL')} /> Tất cả</label>{airlines.map(item => <label key={item}><input type="radio" name="airline" checked={airline === item} onChange={() => setAirline(item)} /> {item}</label>)}</fieldset>}
          <button className="filter-apply" type="button" onClick={() => { setMobileFiltersOpen(false); document.querySelector('.results-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Áp dụng bộ lọc</button>
        </aside>
        <div className="flight-results" aria-live="polite">
          <div className="results-toolbar">
            <div className="result-title"><strong>Kết quả</strong><span>{flightOptions.length} chuyến bay nội địa</span></div>
            <div className="result-actions"><label>Sắp xếp<select value={sort} onChange={event => setSort(event.target.value)}><option value="PRICE">Giá thấp nhất</option><option value="TIME">Khởi hành sớm nhất</option></select></label><button type="button" aria-label="Mở bộ lọc" aria-controls="flight-filters" aria-expanded={mobileFiltersOpen} onClick={() => setMobileFiltersOpen(open => !open)}><UiIcon name="filter" /></button></div>
          </div>
          {flightOptions.map(({ flight, fare }) => {
            const collapsed = collapsedFlights.has(flight.id)
            return <article className={`domestic-flight-card${collapsed ? ' collapsed' : ''}`} key={flight.id}>
            <header>
              <AirlineMark code={flight.airlineCode} />
              <div className="airline-copy"><strong>{flight.airlineName}</strong><small>{flight.flightNumber} <b>·</b> {duration(flight.departureTime, flight.arrivalTime)}</small></div>
              <div className="flight-tags"><span>{fare.classCode === 'BUSINESS' ? 'Hạng thương gia' : 'Hạng phổ thông'}</span><span>Bay thẳng</span><button type="button" aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'} aria-expanded={!collapsed} onClick={() => toggleFlight(flight.id)}><UiIcon name="chevron" /></button></div>
            </header>
            <div className="baggage-line"><span>{flight.includedCheckedBaggageKg > 0 ? 'Bao gồm hành lý ký gửi và hành lý xách tay' : 'Có thể mua thêm hành lý ký gửi'}</span><div><span><UiIcon name="luggage" />{flight.includedCheckedBaggageKg} kg</span><span><UiIcon name="cabin" />{flight.cabinBaggageKg} kg</span></div></div>
            <div className="domestic-route">
              <div className="route-endpoint route-departure"><small>{formatDate(flight.departureTime)}</small><strong>{formatTime(flight.departureTime)}</strong><span><UiIcon name="airport" />{domesticCityLabel(flight.departureAirport.iataCode, flight.departureAirport.city)} ({flight.departureAirport.iataCode})</span></div>
              <div className="route-track"><i /><span><AirplaneIcon /></span><small>Thời gian bay: {duration(flight.departureTime, flight.arrivalTime)}</small></div>
              <div className="route-endpoint route-arrival"><small>{formatDate(flight.arrivalTime)}</small><strong>{formatTime(flight.arrivalTime)}</strong><span><UiIcon name="airport" />{domesticCityLabel(flight.arrivalAirport.iataCode, flight.arrivalAirport.city)} ({flight.arrivalAirport.iataCode})</span></div>
            </div>
            <footer className="flight-card-footer"><div className="domestic-fare"><div><small>VND</small><strong>{formatMoney(fare.price).replace('₫', '').trim()}</strong><small>/ hành khách</small></div><Link className="button primary" to={`/bookings/new?flightId=${flight.id}&fareId=${fare.id}&passengers=${passengerCount}`}>Chọn chuyến bay</Link></div></footer>
          </article>})}
          {searched && !loading && !error && flightOptions.length === 0 && <div className="empty-flights"><AirplaneIcon /><strong>Chưa có chuyến bay phù hợp</strong><p>Hãy thử đổi ngày bay, hành trình hoặc bộ lọc.</p></div>}
        </div>
      </div>
    </section>
  )
}
