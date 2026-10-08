import { Link } from 'react-router-dom'
import AirplaneIcon from '../components/AirplaneIcon'

export default function NotFoundPage() {
  return <section className="not-found-page">
    <div className="not-found-card">
      <div className="not-found-route" aria-hidden="true"><span>SGN</span><i /><b><AirplaneIcon /></b><span>?</span></div>
      <strong className="not-found-code">404</strong>
      <h1>Chuyến bay này không tồn tại</h1>
      <p>Đường dẫn bạn vừa mở không thuộc hành trình nào trong hệ thống SkyWay.</p>
      <div><Link className="button primary" to="/">Về trang chủ</Link><Link className="button secondary" to="/flights">Tìm chuyến bay</Link></div>
    </div>
  </section>
}
