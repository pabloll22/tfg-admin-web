import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { 
  Users, 
  Map as MapIcon, 
  BookOpen, 
  Calendar, 
  Route as RouteIcon, 
  LogOut,
  Navigation
} from "lucide-react"

export default function DashboardLayout() {
  const navigate = useNavigate()

  // --- FUNCIÓN PARA CERRAR SESIÓN ---
  const handleLogout = () => {
    // 1. Borramos el token y los datos de administrador del navegador
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminInfo")
    
    // 2. Redirigimos forzosamente a la pantalla de login
    navigate("/login")
  }

  // Estilos dinámicos para el menú lateral
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
      isActive 
        ? "bg-blue-600 text-white shadow-md" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* --- BARRA LATERAL --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        
        {/* Cabecera Sidebar */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-sm transform -rotate-6">
            <Navigation className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-800 leading-tight">Control UMA</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admin</p>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8 custom-scrollbar">
          
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Gestión</h2>
            <NavLink to="/usuarios" className={navLinkClass}>
              <Users className="w-5 h-5" />
              <span>Usuarios</span>
            </NavLink>
            <NavLink to="/mapas" className={navLinkClass}>
              <MapIcon className="w-5 h-5" />
              <span>Mapas y Edificios</span>
            </NavLink>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Académico</h2>
            <NavLink to="/asignaturas" className={navLinkClass}>
              <BookOpen className="w-5 h-5" />
              <span>Plan de Estudios</span>
            </NavLink>
            <NavLink to="/calendario" className={navLinkClass}>
              <Calendar className="w-5 h-5" />
              <span>Calendario General</span>
            </NavLink>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Herramientas</h2>
            <NavLink to="/rutas" className={navLinkClass}>
              <RouteIcon className="w-5 h-5" />
              <span>Editor de Rutas</span>
            </NavLink>
          </div>

        </div>

        {/* Botón Logout */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 w-full rounded-xl transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 shrink-0 z-10 sticky top-0">
          <p className="text-sm font-medium text-slate-500">
            Panel de Control <span className="mx-2 text-slate-300">/</span> <span className="text-blue-600 font-semibold">Administración Central</span>
          </p>
        </div>
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  )
}