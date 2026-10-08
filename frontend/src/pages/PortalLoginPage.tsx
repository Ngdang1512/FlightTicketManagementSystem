import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, saveSession } from '../api/client'
import AirplaneIcon from '../components/AirplaneIcon'

export default function PortalLoginPage({ portal }: { portal: 'admin' | 'manager' }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const expectedRole = portal === 'admin' ? 'ADMIN' : 'STAFF'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const data = new FormData(event.currentTarget)
    try {
      const auth = await login(String(data.get('username')), String(data.get('password')))
      if (auth.user.role !== expectedRole) throw new Error(`Tài khoản không có quyền ${expectedRole}`)
      saveSession(auth, portal)
      navigate(`/${portal}`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Đăng nhập thất bại') }
    finally { setLoading(false) }
  }

  return <main className={`portal-login ${portal}`}>
    <div className="portal-login-shell">
      <div className="portal-login-copy"><div className="portal-login-brand"><span className="management-brand-mark" aria-hidden="true"><i /><i /><i /></span><strong>SkyWay</strong></div><p>{portal === 'admin' ? 'Administration portal' : 'Operations portal'}</p><h1>{portal === 'admin' ? 'Quản trị hệ thống' : 'Điều hành chuyến bay'}</h1><span className="portal-login-description">Cổng làm việc riêng dành cho {portal === 'admin' ? 'quản trị viên hệ thống' : 'nhân viên vận hành chuyến bay'}.</span><div className="portal-login-route" aria-hidden="true"><span>SGN</span><i /><b><AirplaneIcon /></b><span>HAN</span></div></div>
      <form onSubmit={submit}><p className="eyebrow">Cổng {portal === 'admin' ? 'quản trị' : 'điều hành'}</p><h2>Đăng nhập riêng</h2><span className="portal-form-copy">Sử dụng tài khoản được cấp cho đúng vai trò.</span><label><span>Tên đăng nhập</span><input name="username" autoComplete="username" placeholder="Nhập tên đăng nhập" required /></label><label><span>Mật khẩu</span><input name="password" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" required /></label>{error && <div className="notice error">{error}</div>}<button className="button primary full" disabled={loading}>{loading ? 'Đang xác thực…' : 'Đăng nhập'}</button></form>
    </div>
  </main>
}
