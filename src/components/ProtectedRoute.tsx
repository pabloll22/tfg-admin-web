import { Navigate, Outlet } from "react-router-dom"

export default function ProtectedRoute() {
  // Comprobamos si hay un token guardado en el navegador
  const token = localStorage.getItem("adminToken")

  // Si no hay token, lo echamos a la página de login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Si hay token, renderizamos las rutas hijas (el Dashboard)
  return <Outlet />
}