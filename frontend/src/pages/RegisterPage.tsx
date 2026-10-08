import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, saveSession } from '../api/client'
import { AuthShell } from './LoginPage'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const auth = await register({
        fullName: String(data.get('fullName')),
        username: String(data.get('username')),
        password: String(data.get('password')),
        email: String(data.get('email')),
        phone: String(data.get('phone')) || undefined,
      })
      saveSession(auth)
      navigate('/flights')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Đăng ký thất bại')
    } finally { setLoading(false) }
  }

  return <AuthShell title="Tạo tài khoản" subtitle="Thông tin của bạn được bảo vệ và chỉ dùng cho hành trình.">
    <form className="auth-form two-columns" onSubmit={handleSubmit}>
      <label><span>Họ và tên</span><input name="fullName" placeholder="Nguyễn Văn An" required maxLength={150} /></label>
      <label><span>Tên đăng nhập</span><input name="username" placeholder="nguyenvanan" required minLength={4} maxLength={50} pattern="[A-Za-z0-9._-]+" /></label>
      <label><span>Email</span><input name="email" type="email" placeholder="ban@example.com" required /></label>
      <label><span>Số điện thoại</span><input name="phone" type="tel" placeholder="09xx xxx xxx" pattern="(\+84|0)[0-9]{9,10}" /></label>
      <label className="span-two"><span>Mật khẩu</span><input name="password" type="password" placeholder="Tối thiểu 8 ký tự" minLength={8} maxLength={72} required /></label>
      {error && <div className="notice error span-two">{error}</div>}
      <button className="button primary full span-two" disabled={loading}>{loading ? 'Đang tạo…' : 'Tạo tài khoản'}</button>
      <p className="span-two">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </form>
  </AuthShell>
}
