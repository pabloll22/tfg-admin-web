import { useEffect, useState } from "react"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Search, User, Loader2, ShieldCheck, UserCheck, GraduationCap } from "lucide-react"

interface Usuario {
  idUsuario: string;
  nombre: string;
  rol: string;
  foto_url?: string;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false) // <-- Estado de carga para el botón guardar
  const [filtroBusqueda, setFiltroBusqueda] = useState("") // <-- Buscador

  // --- ESTADOS DEL MODAL ---
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState<"CREAR" | "EDITAR">("CREAR")

  // --- ESTADOS DEL FORMULARIO ---
  const [idUsuario, setIdUsuario] = useState("")
  const [nombre, setNombre] = useState("")
  const [password, setPassword] = useState("")
  const [rol, setRol] = useState("ALUMNO")
  const [fotoUrl, setFotoUrl] = useState("")

  const cargarUsuariosDeMongoDB = async () => {
    try {
      const respuesta = await axios.get("https://tfg-controluma.onrender.com/api/usuario/todos") 
      setUsuarios(respuesta.data)
    } catch (error) {
      console.error("Error al traer usuarios de Mongo:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUsuariosDeMongoDB()
  }, [])

  const handleAbrirCrear = () => {
    setModoModal("CREAR")
    setIdUsuario("")
    setNombre("")
    setPassword("")
    setRol("ALUMNO")
    setFotoUrl("")
    setModalAbierto(true)
  }

  const handleAbrirEditar = (user: Usuario) => {
    setModoModal("EDITAR")
    setIdUsuario(user.idUsuario)
    setNombre(user.nombre)
    setPassword("") 
    setRol(user.rol)
    setFotoUrl(user.foto_url || "")
    setModalAbierto(true)
  }

  const handleGuardarUsuario = async () => {
    if (!idUsuario || !nombre) return alert("El ID y el Nombre son obligatorios.")
    if (modoModal === "CREAR" && !password) return alert("La contraseña es obligatoria para un nuevo usuario.")

    setGuardando(true) // Bloqueamos el botón

    const payload: any = { idUsuario, nombre, rol, foto_url: fotoUrl }
    if (password.trim() !== "") payload.password = password

    try {
      if (modoModal === "CREAR") {
        await axios.post("https://tfg-controluma.onrender.com/api/usuario", payload)
      } else {
        await axios.put(`https://tfg-controluma.onrender.com/api/usuario/${idUsuario}`, payload)
      }
      setModalAbierto(false)
      cargarUsuariosDeMongoDB() 
    } catch (error) {
      console.error("Error al guardar usuario:", error)
      alert("Hubo un error al guardar el usuario. Revisa que el ID no esté duplicado.")
    } finally {
      setGuardando(false) // Desbloqueamos el botón
    }
  }

  const handleEliminarUsuario = async (idUsuarioAEliminar: string) => {
    const confirmacion = window.confirm("⚠️ ¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.")
    if (!confirmacion) return

    try {
      await axios.delete(`https://tfg-controluma.onrender.com/api/usuario/${idUsuarioAEliminar}`)
      setUsuarios(usuariosActuales => usuariosActuales.filter(user => user.idUsuario !== idUsuarioAEliminar))
    } catch (error) {
      console.error("Error al eliminar el usuario:", error)
      alert("Hubo un error al intentar eliminar el usuario.")
    }
  }

  // Filtrado de usuarios en tiempo real
  const usuariosFiltrados = usuarios.filter(user => 
    user.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) || 
    user.idUsuario.toLowerCase().includes(filtroBusqueda.toLowerCase())
  )

  // Función auxiliar para iconos de rol
  const getRolIcon = (rol: string) => {
    if (rol === 'ADMIN') return <ShieldCheck className="w-3.5 h-3.5 mr-1" />
    if (rol === 'PROFESOR') return <GraduationCap className="w-3.5 h-3.5 mr-1" />
    return <UserCheck className="w-3.5 h-3.5 mr-1" />
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* --- CABECERA --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-1">Administra accesos y roles del sistema.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* BUSCADOR INTEGRADO */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o ID..." 
              className="pl-9 bg-white shadow-sm border-slate-200 focus-visible:ring-blue-500"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>
          <Button onClick={handleAbrirCrear} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0">
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* --- MODAL CREAR / EDITAR --- */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl text-slate-800">
              {modoModal === "CREAR" ? "Registrar Usuario" : "Editar Usuario"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-slate-500">
              {modoModal === "CREAR" 
                ? "Añade los datos de acceso para un nuevo miembro."
                : "Modifica los permisos o datos. Deja la contraseña vacía si no cambia."}
            </DialogDescription>
          </div>
          
          <div className="grid gap-5 p-6">
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium">ID Usuario (Matrícula / DNI)</Label>
              <Input 
                value={idUsuario} 
                onChange={(e) => setIdUsuario(e.target.value)} 
                className="font-mono bg-slate-50 focus-visible:ring-blue-500" 
                disabled={modoModal === "EDITAR"} 
                placeholder="ej: alu_123456"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium">Nombre Completo</Label>
              <Input 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                placeholder="Ej: Laura García"
                className="focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Rol del Sistema</Label>
                <select 
                  value={rol} 
                  onChange={(e) => setRol(e.target.value)} 
                  className="w-full border rounded-md p-2.5 text-sm bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALUMNO">Alumno</option>
                  <option value="PROFESOR">Profesor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Contraseña</Label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder={modoModal === "EDITAR" ? "Sin cambios" : "••••••••"}
                  className="focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" onClick={() => setModalAbierto(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardarUsuario} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]" disabled={guardando}>
              {guardando ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                modoModal === "CREAR" ? "Crear Usuario" : "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- TABLA MODERNA --- */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Cargando base de datos...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[350px]">Usuario</TableHead>
                <TableHead>Nivel de Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosFiltrados.map((user) => (
                <TableRow key={user.idUsuario} className="hover:bg-slate-50/60 transition-colors">
                  {/* COLUMNA UNIFICADA: Avatar + Nombre + ID */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.foto_url ? (
                        <img src={user.foto_url} alt={user.nombre} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm">
                          {user.nombre.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{user.nombre}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{user.idUsuario}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* COLUMNA ROL */}
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                      user.rol === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                      user.rol === 'PROFESOR' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {getRolIcon(user.rol)}
                      {user.rol}
                    </div>
                  </TableCell>
                  
                  {/* COLUMNA ACCIONES */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleAbrirEditar(user)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleEliminarUsuario(user.idUsuario)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* ESTADO VACÍO */}
              {usuariosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <User className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-700">No se encontraron usuarios</p>
                      <p className="text-sm">Intenta ajustar tu búsqueda o crea un usuario nuevo.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}