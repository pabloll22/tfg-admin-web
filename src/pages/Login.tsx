import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, User, ShieldAlert, Navigation } from "lucide-react"

export default function Login() {
  const [idUsuario, setIdUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!idUsuario || !password) {
      return setError("Por favor, rellena todos los campos.")
    }

    setCargando(true)

    try {
      // Ajusta la URL base según cómo hayas montado tus rutas en el index.js del backend
      // Suponiendo que las rutas de auth cuelgan de /api/auth
      const respuesta = await axios.post("https://tfg-controluma.onrender.com/api/auth/login", {
        idUsuario,
        password
      })

      const { token, usuario } = respuesta.data

      // VALIDACIÓN CRÍTICA: Solo permitimos el paso a administradores
      if (usuario.rol !== "ADMIN") {
        setError("Acceso denegado. No tienes permisos de administrador.")
        setCargando(false)
        return
      }

      // Si es admin, guardamos el token y los datos en el navegador
      localStorage.setItem("adminToken", token)
      localStorage.setItem("adminInfo", JSON.stringify(usuario))

      // Redirigimos al panel de control
      navigate("/usuarios")

    } catch (err: any) {
      console.error("Error en login:", err)
      if (err.response?.status === 401 || err.response?.status === 404) {
        setError("Credenciales incorrectas. Revisa tu ID y contraseña.")
      } else {
        setError("Error de conexión con el servidor.")
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Cabecera del Login */}
        <div className="bg-slate-900 p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-4 transform -rotate-6">
            <Navigation className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Control UMA Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Panel de Administración Central</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2 font-medium">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">ID de Administrador</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <Input 
                  type="text" 
                  value={idUsuario}
                  onChange={(e) => setIdUsuario(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-blue-500" 
                  placeholder="Ej: admin_01"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Contraseña</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-blue-500" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base shadow-md mt-4"
              disabled={cargando}
            >
              {cargando ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verificando credenciales...</>
              ) : (
                "Acceder al Panel"
              )}
            </Button>
          </form>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
          Sistema de gestión exclusivo para personal autorizado.
        </div>
      </div>
    </div>
  )
}