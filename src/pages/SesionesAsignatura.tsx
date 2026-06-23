import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Clock, 
  MapPin, 
  User, 
  Users,
  CalendarDays,
  Filter,
  Map as MapIcon,
  Layers,
  Pencil
} from "lucide-react"

import { horarioService, usuarioService, mapaService } from "@/api/api"

// Interfaces
interface Sesion {
  _id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  aulaNombre: string;
  nodoAulaId: string;
  grupo: string;
  profesorId: {
    _id: string;
    nombre: string;
  };
}

interface Profesor {
  _id: string;
  idUsuario: string;
  nombre: string;
}

export default function SesionesAsignatura() {
  const { asignaturaId } = useParams()
  const navigate = useNavigate()

  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [asignaturaInfo, setAsignaturaInfo] = useState<any>(null)
  
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [filtroGrupo, setFiltroGrupo] = useState("TODOS")

  // --- ESTADOS DEL MODAL DE FORMULARIO ---
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState<"CREAR" | "EDITAR">("CREAR") 
  const [sesionEditandoId, setSesionEditandoId] = useState("") 
  
  const [diaSemana, setDiaSemana] = useState(1)
  const [horaInicio, setHoraInicio] = useState("09:00")
  const [horaFin, setHoraFin] = useState("11:00")
  const [profesorId, setProfesorId] = useState("")
  const [aulaNombre, setAulaNombre] = useState("")
  const [nodoAulaId, setNodoAulaId] = useState("")
  const [grupo, setGrupo] = useState("Grupo A")

  // --- ESTADOS DEL MODAL VISUAL DEL MAPA ---
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false)
  const [datosEdificio, setDatosEdificio] = useState<any>(null)
  const [plantaActivaId, setPlantaActivaId] = useState<string>("")
  const [cargandoMapa, setCargandoMapa] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 800, height: 500 })

  const cargarDatos = async () => {
    try {
      // Lanzamos las tres peticiones a la vez para que cargue ultra rápido
      const [dataSesiones, dataUsuarios, dataAsignaturas] = await Promise.all([
        horarioService.getSesionesAsignatura(asignaturaId!),
        usuarioService.getTodosUsuarios(),
        horarioService.getAsignaturas()
      ])
      
      const listaProfesores = dataUsuarios.filter((u: any) => u.rol === "PROFESOR" || u.rol === "ADMIN")
      const asigActual = dataAsignaturas.find((a: any) => a._id === asignaturaId)
      
      setSesiones(dataSesiones)
      setProfesores(listaProfesores)
      setAsignaturaInfo(asigActual)
      
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarDatos() }, [asignaturaId])

  // --- LÓGICA DE APERTURA DE MODALES ---
  const handleAbrirCrear = () => {
    setModoModal("CREAR")
    setSesionEditandoId("")
    setDiaSemana(1)
    setHoraInicio("09:00")
    setHoraFin("11:00")
    setProfesorId(profesores.length > 0 ? profesores[0]._id : "")
    setAulaNombre("")
    setNodoAulaId("")
    setGrupo("")
    setModalAbierto(true)
  }

  const handleAbrirEditar = (sesion: Sesion) => {
    setModoModal("EDITAR")
    setSesionEditandoId(sesion._id)
    setDiaSemana(sesion.diaSemana)
    setHoraInicio(sesion.horaInicio)
    setHoraFin(sesion.horaFin)
    setProfesorId(sesion.profesorId?._id || "")
    setAulaNombre(sesion.aulaNombre)
    setNodoAulaId(sesion.nodoAulaId)
    setGrupo(sesion.grupo)
    setModalAbierto(true)
  }

  const handleAbrirSelectorMapa = async () => {
    if (!asignaturaInfo?.facultadId) {
      return alert("Esta asignatura no tiene un ID de edificio válido asignado.")
    }
    
    setModalMapaAbierto(true)
    setCargandoMapa(true)
    
    try {
      const data = await mapaService.getMapaId(asignaturaInfo.facultadId)
      setDatosEdificio(data)
      if (data.plantas?.length > 0) {
        setPlantaActivaId(data.plantas[0].plantaId)
      }
    } catch (error) {
      console.error("Error al cargar el mapa:", error)
      alert("No se pudo cargar el mapa. Verifica que el edificio existe en la sección Mapas.")
    } finally {
      setCargandoMapa(false)
    }
  }

  const handleSeleccionarPoi = (poi: any) => {
    setNodoAulaId(poi.nodoId)
    setAulaNombre(poi.nombre)
    setModalMapaAbierto(false)
  }

  const handleGuardarSesion = async () => {
    if (!profesorId || !aulaNombre || !nodoAulaId || !grupo) {
      return alert("Por favor, rellena todos los campos obligatorios.")
    }

    setGuardando(true)
    const payload = { asignaturaId, profesorId, diaSemana, horaInicio, horaFin, aulaNombre, nodoAulaId, grupo }

    try {
      if (modoModal === "CREAR") {
        await horarioService.crearSesion(payload)
      } else {
        await horarioService.editarSesion(sesionEditandoId, payload)
      }
      
      setModalAbierto(false)
      cargarDatos() 
    } catch (error) {
      console.error("Error al guardar clase:", error)
      alert("Hubo un error al guardar la clase.")
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarSesion = async (id: string) => {
    if (!window.confirm("⚠️ ¿Eliminar esta clase del horario?")) return
    try {
      await horarioService.eliminarSesion(id)
      setSesiones(prev => prev.filter(s => s._id !== id))
    } catch (error) {
      console.error("Error al eliminar:", error)
      alert("Error al intentar eliminar la clase.")
    }
  }

  // --- NAVEGACIÓN DE VUELTA ---
  const handleVolver = () => {
    // Calculamos el nombre del grado igual que en la pantalla anterior
    const gradoAEnviar = asignaturaInfo?.titulacion?.trim() ? asignaturaInfo.titulacion.trim() : "Otras Asignaturas";
    
    // Le pasamos el estado al enrutador
    navigate("/asignaturas", { state: { gradoSeleccionado: gradoAEnviar } });
  }

  // --- AYUDANTES DE VISTA ---
  const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  const gruposDisponibles = Array.from(new Set(sesiones.map(s => s.grupo))).sort()
  const sesionesFiltradas = sesiones.filter(s => filtroGrupo === "TODOS" || s.grupo === filtroGrupo)
  const sesionesOrdenadas = [...sesionesFiltradas].sort((a, b) => {
    if (a.diaSemana !== b.diaSemana) return a.diaSemana - b.diaSemana
    return a.horaInicio.localeCompare(b.horaInicio)
  })

  const plantaActiva = datosEdificio?.plantas?.find((p: any) => p.plantaId === plantaActivaId)
  const anchoMetros = datosEdificio?.dimensiones?.ancho || 1
  const largoMetros = datosEdificio?.dimensiones?.largo || 1

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* --- BOTÓN VOLVER MODIFICADO --- */}
      <button onClick={handleVolver} className="group flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Volver a Plan de Estudios
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Horario de {asignaturaInfo ? asignaturaInfo.nombre : "Clases"}
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Gestión de sesiones para la asignatura
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} className="text-sm bg-transparent border-none focus:ring-0 outline-none text-slate-700 font-medium cursor-pointer">
              <option value="TODOS">Todos los grupos</option>
              {gruposDisponibles.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <Button onClick={handleAbrirCrear} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0">
            <Plus className="w-4 h-4 mr-1.5" /> Añadir Clase
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL PRINCIPAL: AÑADIR / EDITAR CLASE                                 */}
      {/* ========================================================================= */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl text-slate-800">
              {modoModal === "CREAR" ? "Añadir Clase al Horario" : "Editar Clase"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-slate-500">
              Configura cuándo, dónde y quién imparte esta clase.
            </DialogDescription>
          </div>
          
          <div className="grid gap-5 p-6">
            <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-lg">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Día</Label>
                <select value={diaSemana} onChange={(e) => setDiaSemana(Number(e.target.value))} className="w-full border rounded-md p-2 text-sm bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value={1}>Lunes</option><option value={2}>Martes</option><option value={3}>Miércoles</option><option value={4}>Jueves</option><option value={5}>Viernes</option>
                </select>
              </div>

              {/* SELECTOR PERSONALIZADO 24 HORAS: HORA INICIO */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Hora Inicio</Label>
                <div className="flex items-center bg-white border border-slate-200 rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <select 
                    value={horaInicio.split(':')[0]} 
                    onChange={(e) => setHoraInicio(`${e.target.value}:${horaInicio.split(':')[1]}`)}
                    className="bg-transparent border-none outline-none text-sm p-0 cursor-pointer text-slate-700 font-medium"
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = i.toString().padStart(2, '0');
                      return <option key={h} value={h}>{h}</option>;
                    })}
                  </select>
                  <span className="text-slate-400 mx-1 font-bold">:</span>
                  <select 
                    value={horaInicio.split(':')[1]} 
                    onChange={(e) => setHoraInicio(`${horaInicio.split(':')[0]}:${e.target.value}`)}
                    className="bg-transparent border-none outline-none text-sm p-0 cursor-pointer text-slate-700 font-medium"
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SELECTOR PERSONALIZADO 24 HORAS: HORA FIN */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Hora Fin</Label>
                <div className="flex items-center bg-white border border-slate-200 rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <select 
                    value={horaFin.split(':')[0]} 
                    onChange={(e) => setHoraFin(`${e.target.value}:${horaFin.split(':')[1]}`)}
                    className="bg-transparent border-none outline-none text-sm p-0 cursor-pointer text-slate-700 font-medium"
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = i.toString().padStart(2, '0');
                      return <option key={h} value={h}>{h}</option>;
                    })}
                  </select>
                  <span className="text-slate-400 mx-1 font-bold">:</span>
                  <select 
                    value={horaFin.split(':')[1]} 
                    onChange={(e) => setHoraFin(`${horaFin.split(':')[0]}:${e.target.value}`)}
                    className="bg-transparent border-none outline-none text-sm p-0 cursor-pointer text-slate-700 font-medium"
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Profesor Asignado *</Label>
                <select value={profesorId} onChange={(e) => setProfesorId(e.target.value)} className="w-full border rounded-md p-2.5 text-sm bg-white border-slate-200 focus:ring-2 focus:ring-blue-50 outline-none">
                  {profesores.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                  {profesores.length === 0 && <option value="">Sin profesores</option>}
                </select>
              </div>
              <div className="space-y-1.5"><Label className="text-slate-700 font-medium">Grupo *</Label><Input value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ej: A" /></div>
            </div>

            <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-lg space-y-4">
              <div className="flex items-end gap-3">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-blue-900 font-bold">Ubicación del Aula *</Label>
                  <Input value={aulaNombre} onChange={(e) => setAulaNombre(e.target.value)} placeholder="Ej: Aula 3.04" className="bg-white border-blue-200" />
                </div>
                
                <Button type="button" onClick={handleAbrirSelectorMapa} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  <MapIcon className="w-4 h-4 mr-2" /> Seleccionar en Plano
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600 font-medium text-xs uppercase tracking-wider">ID Interno del Nodo</Label>
                <Input value={nodoAulaId} onChange={(e) => setNodoAulaId(e.target.value)} placeholder="El ID se rellenará solo al usar el plano..." className="bg-white font-mono text-xs text-slate-500" readOnly />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" onClick={() => setModalAbierto(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardarSesion} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]" disabled={guardando}>
              {guardando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : modoModal === "CREAR" ? "Programar Clase" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ========================================================================= */}
      {/* 2. SUB-MODAL VISUAL: SELECTOR DE AULA EN EL MAPA                          */}
      {/* ========================================================================= */}
      <Dialog open={modalMapaAbierto} onOpenChange={setModalMapaAbierto}>
        <DialogContent className="max-w-[90vw] w-[1000px] h-[85vh] p-0 flex flex-col overflow-hidden bg-slate-50">
          
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
            <div>
              <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Seleccionar Aula en {datosEdificio?.nombre || "Cargando..."}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <DialogDescription>
                  Haz clic en una de las chinchetas rojas (POIs) para asignar la clase a ese lugar.
                </DialogDescription>
                <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  Mostrando solo Aulas y Laboratorios
                </span>
              </div>
            </div>
            
            {datosEdificio?.plantas && datosEdificio.plantas.length > 0 && (
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-slate-400" />
                <select 
                  value={plantaActivaId} 
                  onChange={(e) => setPlantaActivaId(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {datosEdificio.plantas.map((p: any) => (
                    <option key={p.plantaId} value={p.plantaId}>Nivel {p.nivel}: {p.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 relative overflow-auto p-4 flex items-start justify-center">
            {cargandoMapa ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                <p>Descargando plano...</p>
              </div>
            ) : !plantaActiva?.imagenBase64 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MapIcon className="w-12 h-12 mb-3 text-slate-300" />
                <p>Esta planta no tiene plano subido.</p>
              </div>
            ) : (
              <div className="relative shadow-lg border border-slate-300 rounded-lg overflow-hidden bg-white max-w-full">
                <img 
                  src={plantaActiva.imagenBase64} 
                  alt="Plano" 
                  className="block max-w-full object-contain"
                  style={{ maxHeight: "calc(85vh - 120px)" }} 
                  onLoad={(e) => setImageSize({ width: e.currentTarget.clientWidth, height: e.currentTarget.clientHeight })} 
                />
                
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {plantaActiva.pois
                    ?.filter((poi: any) => poi.tipo === "AULA" || poi.tipo === "LABORATORIO")
                    .map((poi: any) => {
                      const nodo = plantaActiva.nodos?.find((n: any) => n.id === poi.nodoId)
                      if (!nodo?.position) return null
                      
                      const cxPx = (nodo.position.x / anchoMetros) * imageSize.width
                      const cyPx = (nodo.position.y / largoMetros) * imageSize.height
                      
                      return (
                        <g key={poi.id} className="pointer-events-auto cursor-pointer group" onClick={() => handleSeleccionarPoi(poi)}>
                          <circle cx={cxPx} cy={cyPx} r={10} fill="#ef4444" stroke="#ffffff" strokeWidth={3} className="drop-shadow-md transition-all group-hover:r-[14px]" />
                          <rect x={cxPx - 30} y={cyPx - 30} width={60} height={16} rx={4} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1} className="drop-shadow-sm opacity-90 group-hover:opacity-100" />
                          <text x={cxPx} y={cyPx - 19} fontSize="9" fill="#1e293b" fontWeight="bold" textAnchor="middle">
                            {poi.nombre.length > 10 ? poi.nombre.substring(0,8) + '...' : poi.nombre}
                          </text>
                        </g>
                      )
                  })}
                </svg>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* TABLA DE CLASES PRINCIPAL                                                 */}
      {/* ========================================================================= */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Cargando clases programadas...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Día y Hora</TableHead>
                <TableHead>Grupo y Profesor</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sesionesOrdenadas.map((sesion) => (
                <TableRow key={sesion._id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">{diasSemana[sesion.diaSemana]}</span>
                      <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md w-max"><Clock className="w-3 h-3 mr-1.5" />{sesion.horaInicio} - {sesion.horaFin}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <span className="inline-flex items-center text-sm font-semibold text-slate-800"><Users className="w-4 h-4 mr-1.5 text-slate-400" />{sesion.grupo}</span>
                      <span className="text-xs text-slate-600 flex items-center"><User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />{sesion.profesorId?.nombre || "Sin asignar"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-700 flex items-center"><MapPin className="w-4 h-4 mr-1.5 text-red-500" />{sesion.aulaNombre}</span>
                      <span className="text-[11px] text-slate-400 font-mono ml-5">Nodo: {sesion.nodoAulaId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleAbrirEditar(sesion)}
                        title="Editar Clase"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      
                      <div className="w-px h-5 bg-slate-200 mx-1"></div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50" 
                        onClick={() => handleEliminarSesion(sesion._id)} 
                        title="Eliminar Clase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {sesionesOrdenadas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-700">El horario está vacío</p>
                      <p className="text-sm">Añade la primera clase o limpia los filtros.</p>
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