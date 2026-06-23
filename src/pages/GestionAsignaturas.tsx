import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Loader2, 
  BookOpen, 
  CalendarRange, 
  GraduationCap, 
  Building2,
  CalendarDays,
  ArrowLeft,
  ChevronRight
} from "lucide-react"

import { horarioService, mapaService } from "@/api/api"

// Estructuras de datos
interface Asignatura {
  _id: string; 
  nombre: string;
  curso: number;
  titulacion: string;
  cuatrimestre: number;
  facultadId: string;
}

interface Mapa {
  mapaId: string;
  nombre: string;
}

export default function GestionAsignaturas() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [mapas, setMapas] = useState<Mapa[]>([])
  
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  // --- ESTADO PARA LA NAVEGACIÓN POR GRADOS ---
  // Inicializamos leyendo el state de la navegación (por si venimos de la pantalla de Sesiones)
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string | null>(location.state?.gradoSeleccionado || null)

  // --- ESTADOS DEL MODAL ---
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState<"CREAR_ASIGNATURA" | "EDITAR_ASIGNATURA" | "CREAR_TITULACION" | "RENOMBRAR_TITULACION">("CREAR_ASIGNATURA")
  const [idEditando, setIdEditando] = useState("")
  const [titulacionAntigua, setTitulacionAntigua] = useState("") 

  // --- ESTADOS DEL FORMULARIO ---
  const [nombre, setNombre] = useState("")
  const [curso, setCurso] = useState("")
  const [titulacion, setTitulacion] = useState("")
  const [cuatrimestre, setCuatrimestre] = useState(1)
  const [facultadId, setFacultadId] = useState("")

  // --- CARGAR DATOS ---
  const cargarDatos = async () => {
    try {
      const [dataAsignaturas, dataMapas] = await Promise.all([
        horarioService.getAsignaturas(),
        mapaService.getListaMapas()
      ])
      
      setAsignaturas(dataAsignaturas)
      setMapas(dataMapas)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleAbrirCrearTit = () => {
    setModoModal("CREAR_TITULACION")
    setIdEditando("")
    setNombre("")
    setCurso("")
    setTitulacion("")
    setCuatrimestre(1)
    setFacultadId("")
    setModalAbierto(true)
  }

  const handleAbrirRenombrarTit = (gradoActual: string, asignaturasDelGrado: Asignatura[]) => {
    setModoModal("RENOMBRAR_TITULACION")
    setTitulacion(gradoActual)
    setTitulacionAntigua(gradoActual)
    
    if (asignaturasDelGrado.length > 0) {
      setFacultadId(asignaturasDelGrado[0].facultadId || "")
    } else {
      setFacultadId("")
    }
    
    setModalAbierto(true)
  }

  const handleAbrirCrearAsig = () => {
    setModoModal("CREAR_ASIGNATURA")
    setIdEditando("")
    setNombre("")
    setCurso("")
    setTitulacion(gradoSeleccionado && gradoSeleccionado !== "Otras Asignaturas" ? gradoSeleccionado : "") 
    setCuatrimestre(1)
    setFacultadId("")
    setModalAbierto(true)
  }

  const handleAbrirEditar = (asignatura: Asignatura) => {
    setModoModal("EDITAR_ASIGNATURA")
    setIdEditando(asignatura._id)
    setNombre(asignatura.nombre)
    // Para que al editar la asignatura base el curso no salga vacío o '1' si no aplica, lo seteamos
    setCurso(asignatura.curso?.toString() || "")
    setTitulacion(asignatura.titulacion || "")
    setCuatrimestre(asignatura.cuatrimestre)
    setFacultadId(asignatura.facultadId || "")
    setModalAbierto(true)
  }

  const handleGuardar = async () => {
    if (modoModal === "CREAR_TITULACION") {
      if (!titulacion || !facultadId) return alert("El nombre de la titulación y la ubicación son obligatorios.")
    } else if (modoModal === "RENOMBRAR_TITULACION") {
      if (!titulacion || !facultadId) return alert("El nombre de la titulación y la ubicación son obligatorios.")
    } else {
      if (!nombre || !cuatrimestre || !facultadId) return alert("El nombre de la asignatura, cuatrimestre y Ubicación son obligatorios.")
    }

    setGuardando(true)

    try {
      if (modoModal === "RENOMBRAR_TITULACION") {
        const asignaturasDelGrado = asignaturas.filter(a => (a.titulacion?.trim() || "Otras Asignaturas") === titulacionAntigua)
        
        const promesas = asignaturasDelGrado.map(asig => {
          const esBase = asig.nombre.startsWith("Asignatura Base -")
          const payload = {
            ...asig,
            titulacion: titulacion, 
            nombre: esBase ? `Asignatura Base - ${titulacion}` : asig.nombre, 
            facultadId: facultadId 
          }
          return horarioService.editarAsignatura(asig._id, payload)
        })

        await Promise.all(promesas)

      } else {
        const payload = modoModal === "CREAR_TITULACION"
          ? {
              nombre: `Asignatura Base - ${titulacion}`,
              curso: 1,
              titulacion,
              cuatrimestre: 1,
              facultadId
            }
          : {
              nombre,
              curso: curso ? parseInt(curso) : null,
              titulacion,
              cuatrimestre,
              facultadId
            }

        if (modoModal === "EDITAR_ASIGNATURA") {
          await horarioService.editarAsignatura(idEditando, payload)
        } else {
          await horarioService.crearAsignatura(payload)
        }
      }

      setModalAbierto(false)
      cargarDatos() 
    } catch (error) {
      console.error("Error al guardar:", error)
      alert("Hubo un error al guardar los datos.")
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarAsignatura = async (id: string) => {
    const confirmacion = window.confirm("⚠️ ¿Eliminar esta asignatura? También se borrarán todas sus clases asociadas de los horarios.")
    if (!confirmacion) return

    try {
      await horarioService.eliminarAsignatura(id)
      setAsignaturas(prev => prev.filter(a => a._id !== id))
    } catch (error) {
      console.error("Error al eliminar:", error)
      alert("Error al intentar eliminar la asignatura.")
    }
  }

  const handleEliminarTitulacion = async (e: React.MouseEvent, grado: string, asignaturasDelGrado: Asignatura[]) => {
    e.stopPropagation() 

    const confirmacion = window.confirm(`⚠️ ¿Estás seguro de que quieres eliminar la titulación "${grado}"?\n\nSe borrarán TODAS las asignaturas y clases asociadas a este grado de forma permanente.`)
    if (!confirmacion) return

    setCargando(true)
    try {
      const promesasBorrado = asignaturasDelGrado.map(asig => 
        horarioService.eliminarAsignatura(asig._id)
      )
      await Promise.all(promesasBorrado)
      
      cargarDatos()
    } catch (error) {
      console.error("Error al eliminar titulación:", error)
      alert("Hubo un error al intentar eliminar la titulación completa.")
      setCargando(false)
    }
  }

  const getNombreEdificio = (id: string) => {
    const mapaEncontrado = mapas.find(m => m.mapaId === id)
    return mapaEncontrado ? mapaEncontrado.nombre : `Desconocido (${id})`
  }

  // --- FILTRADO BÁSICO DE BÚSQUEDA ---
  const asignaturasFiltradasBusqueda = asignaturas.filter(a => 
    a.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) || 
    a.titulacion?.toLowerCase().includes(filtroBusqueda.toLowerCase())
  )

  // --- AGRUPACIÓN POR GRADOS ---
  const gruposGrados = asignaturasFiltradasBusqueda.reduce((acc, asig) => {
    const grado = asig.titulacion?.trim() ? asig.titulacion.trim() : "Otras Asignaturas";
    if (!acc[grado]) {
      acc[grado] = [];
    }
    acc[grado].push(asig);
    return acc;
  }, {} as Record<string, Asignatura[]>);

  // --- ASIGNATURAS A MOSTRAR ---
  const asignaturasMostrar = gradoSeleccionado 
    ? (gruposGrados[gradoSeleccionado] || []).sort((a, b) => {
        const cursoA = a.curso || 99;
        const cursoB = b.curso || 99;
        if (cursoA !== cursoB) return cursoA - cursoB;
        const cuatriA = a.cuatrimestre || 1;
        const cuatriB = b.cuatrimestre || 1;
        return cuatriA - cuatriB;
      })
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* --- CABECERA DINÁMICA --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {gradoSeleccionado ? gradoSeleccionado : "Plan de Estudios"}
          </h1>
          <p className="text-slate-500 mt-1">
            {gradoSeleccionado 
              ? "Gestiona las asignaturas de esta titulación." 
              : "Gestiona los grados y titulaciones impartidas en el campus."}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={gradoSeleccionado ? "Buscar asignatura..." : "Buscar titulación..."} 
              className="pl-9 bg-white shadow-sm focus-visible:ring-blue-500"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>
          <Button 
            onClick={gradoSeleccionado ? handleAbrirCrearAsig : handleAbrirCrearTit} 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> 
            {gradoSeleccionado ? "Nueva Asignatura" : "Nueva Titulación"}
          </Button>
        </div>
      </div>

      {/* --- MODAL DINÁMICO --- */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
              {(modoModal === "CREAR_TITULACION" || modoModal === "RENOMBRAR_TITULACION") && <GraduationCap className="w-5 h-5 text-blue-600"/>}
              {modoModal === "CREAR_ASIGNATURA" && <BookOpen className="w-5 h-5 text-blue-600"/>}
              
              {modoModal === "CREAR_TITULACION" ? "Añadir Nueva Titulación" :
               modoModal === "RENOMBRAR_TITULACION" ? "Editar Titulación" :
               modoModal === "CREAR_ASIGNATURA" ? "Añadir Asignatura" : "Editar Asignatura"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-slate-500">
              {modoModal === "CREAR_TITULACION" 
                ? "Crea un nuevo grado o titulación para agrupar sus asignaturas." 
                : modoModal === "RENOMBRAR_TITULACION"
                ? "Cambia el nombre o el edificio. Se actualizará en todas sus asignaturas."
                : "Configura los detalles académicos de la materia."}
            </DialogDescription>
          </div>
          
          <div className="grid gap-5 p-6">
            {modoModal !== "CREAR_TITULACION" && modoModal !== "RENOMBRAR_TITULACION" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-medium">Nombre de la Asignatura *</Label>
                  <Input 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    placeholder="Ej: Programación Orientada a Objetos"
                    className="focus-visible:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-medium">Curso (Número)</Label>
                    <Input 
                      type="number"
                      value={curso} 
                      onChange={(e) => setCurso(e.target.value)} 
                      placeholder="Ej: 2"
                      className="focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-medium">Cuatrimestre *</Label>
                    <select 
                      value={cuatrimestre} 
                      onChange={(e) => setCuatrimestre(Number(e.target.value))} 
                      className="w-full border rounded-md p-2.5 text-sm bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value={1}>1º Cuatrimestre</option>
                      <option value={2}>2º Cuatrimestre</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium">
                {modoModal === "CREAR_TITULACION" || modoModal === "RENOMBRAR_TITULACION" 
                  ? "Nombre de la Titulación *" 
                  : "Titulación / Grado"}
              </Label>
              <Input 
                value={titulacion} 
                onChange={(e) => setTitulacion(e.target.value)} 
                placeholder="Ej: Grado en Ingeniería Informática"
                className="focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
              <Label className="text-blue-800 font-medium">Ubicación principal (Edificio/Facultad) *</Label>
              <select 
                value={facultadId} 
                onChange={(e) => setFacultadId(e.target.value)} 
                className="w-full border rounded-md p-2.5 text-sm bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none mt-1"
              >
                <option value="">-- Selecciona un edificio --</option>
                {mapas.map(mapa => (
                  <option key={mapa.mapaId} value={mapa.mapaId}>
                    {mapa.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" onClick={() => setModalAbierto(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardar} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]" disabled={guardando}>
              {guardando ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                modoModal === "EDITAR_ASIGNATURA" ? "Guardar Cambios" : 
                modoModal === "CREAR_TITULACION" ? "Crear Titulación" : 
                modoModal === "RENOMBRAR_TITULACION" ? "Aplicar Cambio" : "Crear Asignatura"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ESTADOS DE PANTALLA --- */}
      {cargando ? (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden p-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p>Cargando plan de estudios...</p>
        </div>
      ) : Object.keys(gruposGrados).length === 0 ? (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden p-12 flex flex-col items-center justify-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-base font-medium text-slate-700">No se encontraron datos</p>
          <p className="text-sm">Intenta cambiar el filtro de búsqueda o añade una nueva titulación.</p>
        </div>
      ) : !gradoSeleccionado ? (
        /* --- VISTA DE GRADOS (TARJETAS) --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(gruposGrados).map(([grado, asigs]) => {
            const asignaturasReales = asigs.filter(a => !a.nombre.startsWith("Asignatura Base -"));
            
            return (
              <div 
                key={grado}
                onClick={() => setGradoSeleccionado(grado)}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px] relative overflow-hidden"
              >
                {/* BOTONES DE EDICIÓN Y BORRADO (Solo visibles al hacer hover) */}
                {grado !== "Otras Asignaturas" && (
                  <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleAbrirRenombrarTit(grado, asigs); }}
                      title="Editar Titulación"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                      onClick={(e) => handleEliminarTitulacion(e, grado, asigs)}
                      title="Eliminar Titulación y todas sus asignaturas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-2 pr-16">{grado}</h3>
                </div>
                <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-4">
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                    {asignaturasReales.length} {asignaturasReales.length === 1 ? 'asignatura' : 'asignaturas'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* --- VISTA DE ASIGNATURAS DENTRO DE UN GRADO (TABLA) --- */
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => setGradoSeleccionado(null)} 
            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Grados
          </Button>

          <div className="mb-4 pl-2">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              {gradoSeleccionado}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Mostrando {asignaturasMostrar.filter(a => !a.nombre.startsWith("Asignatura Base -")).length} asignaturas.</p>
          </div>

          <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="w-[350px]">Asignatura</TableHead>
                  <TableHead>Temporalidad</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaturasMostrar
                  .filter(a => !a.nombre.startsWith("Asignatura Base -")) 
                  .map((asig) => (
                  <TableRow key={asig._id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0 mt-0.5">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col justify-center min-h-[40px]">
                          <span className="font-semibold text-slate-800 leading-tight">{asig.nombre}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        {asig.curso && (
                          <div className="text-sm font-medium text-slate-700">
                            {asig.curso}º Curso
                          </div>
                        )}
                        <div className={`inline-flex items-center w-max px-2 py-0.5 rounded text-xs font-semibold border ${
                          asig.cuatrimestre === 1 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <CalendarRange className="w-3 h-3 mr-1.5" />
                          Q{asig.cuatrimestre}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center text-sm font-medium text-slate-600">
                        <Building2 className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={getNombreEdificio(asig.facultadId)}>
                          {getNombreEdificio(asig.facultadId)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <Button 
                          variant="default" 
                          size="sm"
                          className="h-8 bg-slate-800 hover:bg-slate-900 text-white shadow-sm"
                          onClick={() => navigate(`/asignaturas/${asig._id}/sesiones`)}
                        >
                          <CalendarDays className="w-4 h-4 mr-1.5" /> Ver Clases
                        </Button>
                        
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleAbrirEditar(asig)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleEliminarAsignatura(asig._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}