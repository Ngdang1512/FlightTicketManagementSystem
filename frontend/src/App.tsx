import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { routes } from './routes'

export default function App() {
  const portal = import.meta.env.VITE_PORTAL ?? 'customer'

  if (portal === 'admin') {
    return <Routes>
      <Route path="/admin" element={routes.find((route) => route.path === '/admin')?.element} />
      <Route path="/admin/login" element={routes.find((route) => route.path === '/admin/login')?.element} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  }

  if (portal === 'manager') {
    return <Routes>
      <Route path="/manager" element={routes.find((route) => route.path === '/manager')?.element} />
      <Route path="/manager/login" element={routes.find((route) => route.path === '/manager/login')?.element} />
      <Route path="*" element={<Navigate to="/manager/login" replace />} />
    </Routes>
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {routes.filter((route) => !route.path.startsWith('/admin') && !route.path.startsWith('/manager')).map((route) => <Route key={route.path} path={route.path} element={route.element} />)}
      </Route>
    </Routes>
  )
}
