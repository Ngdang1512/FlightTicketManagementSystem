import { Link } from 'react-router-dom'
import AirplaneIcon from '../components/AirplaneIcon'

export default function HomePage() {
  return (
    <section className="sky-home">
      <div className="home-hero page">
        <div className="home-copy">
          <span className="home-badge"><i /> Bay nội địa · Khám phá Việt Nam</span>
          <h1>Mỗi miền đất,<br /><em>một hành trình</em> đáng nhớ.</h1>
          <p>Tìm chuyến bay giữa các thành phố Việt Nam, so sánh hạng vé và quản lý hành trình trong một trải nghiệm thật gọn gàng.</p>
          <div className="home-actions">
            <Link className="button primary" to="/flights">Tìm chuyến bay <span aria-hidden="true">→</span></Link>
            <Link className="button secondary" to="/register">Tạo tài khoản</Link>
          </div>
          <div className="home-stats" aria-label="Thông tin hệ thống">
            <div><strong>03</strong><span>Điểm đến nội địa</span></div>
            <div><strong>03</strong><span>Hãng hàng không</span></div>
            <div><strong>24/7</strong><span>Quản lý hành trình</span></div>
          </div>
        </div>
        <aside className="home-ticket" aria-label="Hành trình nội địa nổi bật">
          <div className="home-ticket-head">
            <div><span>Chuyến bay nội địa</span><strong>SkyWay Journey</strong></div>
            <span className="home-direct">Bay thẳng</span>
          </div>
          <div className="home-ticket-note"><span>Hành lý ký gửi</span><strong>20 kg</strong><span>Hành lý xách tay</span><strong>7 kg</strong></div>
          <div className="home-ticket-route">
            <div><small>Khởi hành</small><strong>SGN</strong><span>TP. Hồ Chí Minh</span></div>
            <div className="home-flight-path"><i /><b><AirplaneIcon /></b><small>2 giờ 10 phút</small></div>
            <div><small>Điểm đến</small><strong>HAN</strong><span>Hà Nội</span></div>
          </div>
          <div className="home-ticket-foot"><div><small>Hành trình linh hoạt</small><strong>Khắp Việt Nam</strong></div><Link to="/flights">Khám phá chuyến bay</Link></div>
        </aside>
      </div>

      <div className="home-feature-wrap">
        <div className="home-features page">
          <article><span>01</span><div><h2>Tìm nhanh</h2><p>Lọc theo hành trình, ngày bay và số hành khách chỉ trong vài bước.</p></div></article>
          <article><span>02</span><div><h2>Giá rõ ràng</h2><p>Xem đúng hạng vé, số ghế còn lại và tổng chi phí trước khi đặt.</p></div></article>
          <article><span>03</span><div><h2>Quản lý dễ</h2><p>Lưu trữ đơn đặt chỗ, vé điện tử và trạng thái thanh toán tại một nơi.</p></div></article>
        </div>
      </div>

      <div className="home-routes page">
        <div className="home-section-heading"><div><p className="eyebrow">Điểm đến nổi bật</p><h2>Bay khắp Việt Nam</h2></div><Link to="/flights">Xem tất cả chuyến bay →</Link></div>
        <div className="home-route-grid">
          <Link to="/flights" className="home-route-card"><span>SGN</span><i>→</i><span>HAN</span><small>TP. Hồ Chí Minh · Hà Nội</small></Link>
          <Link to="/flights" className="home-route-card"><span>HAN</span><i>→</i><span>DAD</span><small>Hà Nội · Đà Nẵng</small></Link>
          <Link to="/flights" className="home-route-card"><span>SGN</span><i>→</i><span>DAD</span><small>TP. Hồ Chí Minh · Đà Nẵng</small></Link>
        </div>
      </div>
    </section>
  )
}
