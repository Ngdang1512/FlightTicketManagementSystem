import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, saveSession } from '../api/client'
import AirplaneIcon from '../components/AirplaneIcon'

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const auth = await login(String(data.get('username')), String(data.get('password')))
      if (auth.user.role !== 'USER') {
        throw new Error('Tài khoản này cần đăng nhập tại cổng quản trị hoặc điều hành riêng.')
      }
      saveSession(auth)
      navigate('/flights')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Đăng nhập thất bại')
    } finally { setLoading(false) }
  }

  return <AuthShell title="Chào mừng trở lại" subtitle="Đăng nhập để quản lý hành trình của bạn.">
    <form className="auth-form" onSubmit={handleSubmit}>
      <label><span>Tên đăng nhập</span><input name="username" autoComplete="username" placeholder="Nhập tên đăng nhập" required /></label>
      <label><span>Mật khẩu</span><input name="password" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" required /></label>
      {error && <div className="notice error">{error}</div>}
      <button className="button primary full" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </form>
  </AuthShell>
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="auth-page page">
    <div className="auth-visual">
      <p className="eyebrow">SkyWay Member</p>
      <h1>Mỗi hành trình đều có một câu chuyện.</h1>
      <p className="auth-visual-copy">Đặt vé nội địa, theo dõi hành trình và lưu vé điện tử trong một tài khoản.</p>
      <div className="auth-route-visual" aria-hidden="true">
        <div><strong>SGN</strong><span>TP. Hồ Chí Minh</span></div>
        <div><i /><b><AirplaneIcon /></b></div>
        <div><strong>HAN</strong><span>Hà Nội</span></div>
      </div>
      <div className="auth-benefits"><span>✓ Giá vé rõ ràng</span><span>✓ Quản lý tập trung</span></div>
    </div>
    <div className="auth-card"><div className="auth-card-heading"><span>SkyWay account</span><h2>{title}</h2><p>{subtitle}</p></div>{children}</div>
  </section>
}
