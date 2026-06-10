import { useEffect, useState } from "react"
import axios from "axios"
import { 
  Calendar, 
  Filter, 
  Clock, 
  MapPin, 
  User, 
  Loader2, 
  CheckCircle2,
  Circle,
  Users,
  GraduationCap
} from "lucide-react"

interface Asignatura {
  _id: string;
  nombre: string;
  curso: number;
  cuatrimestre: number;
  titulacion?: string; 
}

interface Sesion {
  _id: string;
  asignaturaId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  aulaNombre: string;
  grupo: string;
  profesorId?: {
    nombre: string;
  };
}

const PALETA_COLORES = [
  "bg-blue-50 border-blue-400 text-blue-900",
  "bg-emerald-50 border-emerald-400 text-emerald-900",
  "bg-violet-50 border-violet-400 text-violet-900",
  "bg-amber-50 border-amber-400 text-amber-900",
  "bg-rose-50 border-rose-400 text-rose-900",
  "bg-cyan-50 border-cyan-400 text-cyan-900",
  "bg-fuchsia-50 border-fuchsia-400 text-fuchsia-900",
  "bg-lime-50 border-lime-400 text-lime-900",
]

const timeToMins = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const formatGrupo = (grupo: string) => {
  if (!grupo) return "";
  if (grupo.toLowerCase().startsWith("grupo")) {
    return grupo;
  }
  return `Grupo ${grupo}`;
};

export default function CalendarioAcademico() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  
  // --- ESTADOS DE FILTROS ---
  const [filtroGrado, setFiltroGrado] = useState<string>("") 
  const [filtroCurso, setFiltroCurso] = useState<string>("TODOS")
  const [filtroCuatri, setFiltroCuatri] = useState<string>("TODOS")
  
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<Set<string>>(new Set())
  const [gruposSeleccionados, setGruposSeleccionados] = useState<Set<string>>(new Set()) 
  
  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [cargandoSesiones, setCargandoSesiones] = useState(false)

  useEffect(() => {
    const cargarAsignaturas = async () => {
      try {
        const res = await axios.get("https://tfg-controluma.onrender.com/api/horarios/asignaturas")
        
        // --- LA MAGIA: Filtramos las asignaturas base para que el calendario ni las vea ---
        const asignaturasReales = res.data.filter((a: Asignatura) => !a.nombre.startsWith("Asignatura Base -"));
        
        setAsignaturas(asignaturasReales)
        
        // 1. Obtener todos los grados únicos de las asignaturas REALES
        const grados = Array.from(
            new Set(asignaturasReales.map((a: Asignatura) => a.titulacion?.trim() ? a.titulacion.trim() : "Otras Asignaturas"))
        ).sort() as string[];

        // 2. Por defecto seleccionamos el PRIMER GRADO de la lista
        const gradoInicial = grados.length > 0 ? grados[0] : "";

        // 3. Filtramos las asignaturas para ese grado, en 1º curso y 1º cuatrimestre
        const asignaturasIniciales = asignaturasReales.filter((a: Asignatura) => {
            const gradoAsig = a.titulacion?.trim() ? a.titulacion.trim() : "Otras Asignaturas";
            return gradoAsig === gradoInicial && a.curso === 1 && a.cuatrimestre === 1;
        });

        // 4. Establecemos los estados
        if (gradoInicial) {
          setFiltroGrado(gradoInicial)
          setFiltroCurso("1")
          setFiltroCuatri("1")
          setAsignaturasSeleccionadas(new Set(asignaturasIniciales.map((a: Asignatura) => a._id)))
        }
      } catch (error) {
        console.error("Error al cargar asignaturas:", error)
      } finally {
        setCargandoInicial(false)
      }
    }
    cargarAsignaturas()
  }, [])

  useEffect(() => {
    const cargarSesiones = async () => {
      if (asignaturasSeleccionadas.size === 0) {
        setSesiones([])
        return
      }

      setCargandoSesiones(true)
      try {
        const promesas = Array.from(asignaturasSeleccionadas).map(id => 
          axios.get(`https://tfg-controluma.onrender.com/api/horarios/asignaturas/${id}/sesiones`)
        )
        const respuestas = await Promise.all(promesas)
        const todasLasSesiones = respuestas.flatMap(res => res.data)
        setSesiones(todasLasSesiones)
      } catch (error) {
        console.error("Error al cargar sesiones del calendario:", error)
      } finally {
        setCargandoSesiones(false)
      }
    }

    cargarSesiones()
  }, [asignaturasSeleccionadas])

  // --- HANDLERS ---
  const handleCambiarGrado = (grado: string) => {
    setFiltroGrado(grado)
    actualizarSeleccionAutomatica(grado, filtroCurso, filtroCuatri)
  }

  const handleCambiarCurso = (curso: string) => {
    setFiltroCurso(curso)
    actualizarSeleccionAutomatica(filtroGrado, curso, filtroCuatri)
  }

  const handleCambiarCuatri = (cuatri: string) => {
    setFiltroCuatri(cuatri)
    actualizarSeleccionAutomatica(filtroGrado, filtroCurso, cuatri)
  }

  const actualizarSeleccionAutomatica = (grado: string, curso: string, cuatri: string) => {
    if (!grado) {
      setAsignaturasSeleccionadas(new Set())
      return
    }

    const asigFiltradas = asignaturas.filter(a => {
      const asigGrado = a.titulacion?.trim() ? a.titulacion.trim() : "Otras Asignaturas";
      const coincideGrado = asigGrado === grado; 
      const coincideCurso = curso === "TODOS" || a.curso?.toString() === curso;
      const coincideCuatri = cuatri === "TODOS" || a.cuatrimestre?.toString() === cuatri;
      return coincideGrado && coincideCurso && coincideCuatri;
    })
    setAsignaturasSeleccionadas(new Set(asigFiltradas.map(a => a._id)))
  }

  const toggleAsignatura = (id: string) => {
    setAsignaturasSeleccionadas(prev => {
      const nuevoSet = new Set(prev)
      if (nuevoSet.has(id)) nuevoSet.delete(id)
      else nuevoSet.add(id)
      return nuevoSet
    })
  }

  const toggleGrupo = (grupo: string) => {
    setGruposSeleccionados(prev => {
      const nuevoSet = new Set(prev)
      if (nuevoSet.has(grupo)) nuevoSet.delete(grupo)
      else nuevoSet.add(grupo)
      return nuevoSet
    })
  }

  // --- AYUDANTES Y COMPUTADOS ---
  const gradosDisponibles = Array.from(new Set(asignaturas.map(a => a.titulacion?.trim() ? a.titulacion.trim() : "Otras Asignaturas"))).sort()

  const asignaturasFiltradas = asignaturas.filter(a => {
    const asigGrado = a.titulacion?.trim() ? a.titulacion.trim() : "Otras Asignaturas";
    const coincideGrado = asigGrado === filtroGrado;
    const coincideCurso = filtroCurso === "TODOS" || a.curso?.toString() === filtroCurso;
    const coincideCuatri = filtroCuatri === "TODOS" || a.cuatrimestre?.toString() === filtroCuatri;
    return coincideGrado && coincideCurso && coincideCuatri;
  })

  const gruposDisponibles = Array.from(new Set(sesiones.map(s => s.grupo))).sort()

  const sesionesVisibles = sesiones.filter(s => 
    gruposSeleccionados.size === 0 || gruposSeleccionados.has(s.grupo)
  )

  const diasSemana = [
    { num: 1, nombre: "Lunes" },
    { num: 2, nombre: "Martes" },
    { num: 3, nombre: "Miércoles" },
    { num: 4, nombre: "Jueves" },
    { num: 5, nombre: "Viernes" }
  ]

  const getColorAsignatura = (id: string) => {
    const index = asignaturas.findIndex(a => a._id === id)
    return PALETA_COLORES[index % PALETA_COLORES.length]
  }

  const getNombreAsignatura = (id: string) => {
    return asignaturas.find(a => a._id === id)?.nombre || "Desconocida"
  }

  if (cargandoInicial) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
        <p className="text-lg font-medium">Cargando calendario...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-[calc(100vh-6rem)] space-y-6">
      
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Calendario General</h1>
        <p className="text-slate-500 mt-1 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Visualización semanal de horarios lectivos.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* --- COLUMNA IZQUIERDA: FILTROS --- */}
        <div className="w-full lg:w-72 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-700">Filtros de Vista</h2>
          </div>
          
          <div className="p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
            
            <div className="space-y-4">
              {/* FILTRO GRADO */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Titulación / Grado
                </label>
                <select 
                  value={filtroGrado}
                  onChange={(e) => handleCambiarGrado(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                >
                  {gradosDisponibles.map(grado => (
                    <option key={grado} value={grado}>{grado}</option>
                  ))}
                </select>
              </div>

              {/* FILTROS CURSO Y CUATRIMESTRE */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curso</label>
                  <select 
                    value={filtroCurso}
                    onChange={(e) => handleCambiarCurso(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="1">1º</option>
                    <option value="2">2º</option>
                    <option value="3">3º</option>
                    <option value="4">4º</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuatrimestre</label>
                  <select 
                    value={filtroCuatri}
                    onChange={(e) => handleCambiarCuatri(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                  >
                    <option value="TODOS">Ambos</option>
                    <option value="1">1º Q</option>
                    <option value="2">2º Q</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Grupos Visibles
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {gruposDisponibles.length === 0 && <span className="text-sm text-slate-400 italic">No hay grupos</span>}
                {gruposDisponibles.map(grupo => {
                  const isChecked = gruposSeleccionados.has(grupo)
                  return (
                    <button
                      key={grupo}
                      onClick={() => toggleGrupo(grupo)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                        isChecked 
                          ? "bg-blue-100 text-blue-800 border-blue-300" 
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {formatGrupo(grupo)}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {gruposSeleccionados.size === 0 ? "Mostrando todos los grupos. Haz clic para aislar uno o varios." : "Mostrando solo los grupos seleccionados."}
              </p>
            </div>

            <div className="space-y-2 flex-1 border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asignaturas a mostrar</label>
              
              <div className="space-y-1.5 mt-2">
                {asignaturasFiltradas.length === 0 && (
                  <p className="text-sm text-slate-400 italic">No hay asignaturas para estos filtros.</p>
                )}
                
                {asignaturasFiltradas.map(asig => {
                  const isActive = asignaturasSeleccionadas.has(asig._id)
                  const colorClase = getColorAsignatura(asig._id)
                  
                  return (
                    <button
                      key={asig._id}
                      onClick={() => toggleAsignatura(asig._id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-start gap-2.5 transition-colors border ${
                        isActive 
                          ? `${colorClase} shadow-sm border-l-4` 
                          : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isActive ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 text-slate-300" />}
                      </div>
                      <span className="leading-tight">{asig.nombre}</span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {/* --- COLUMNA DERECHA: GRILLA DEL CALENDARIO --- */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
          
          {cargandoSesiones && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="bg-white p-3 rounded-xl shadow-lg flex items-center gap-3 border border-slate-100">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="font-medium text-slate-700 text-sm">Actualizando calendario...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 shrink-0">
            {diasSemana.map(dia => (
              <div key={dia.num} className="p-3 text-center border-r last:border-r-0 border-slate-200">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{dia.nombre}</h3>
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-5 overflow-y-auto custom-scrollbar bg-slate-50/50">
            {diasSemana.map(dia => {
              const sesionesDelDia = sesionesVisibles
                .filter(s => s.diaSemana === dia.num)
                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

              const gruposSolapados: Sesion[][] = []
              sesionesDelDia.forEach(sesion => {
                let insertado = false
                if (gruposSolapados.length > 0) {
                  const ultimoGrupo = gruposSolapados[gruposSolapados.length - 1]
                  const maxEnd = Math.max(...ultimoGrupo.map(s => timeToMins(s.horaFin)))
                  const startCur = timeToMins(sesion.horaInicio)
                  
                  if (startCur < maxEnd) {
                    ultimoGrupo.push(sesion)
                    insertado = true
                  }
                }
                if (!insertado) {
                  gruposSolapados.push([sesion])
                }
              })

              return (
                <div key={dia.num} className="border-r last:border-r-0 border-slate-200 p-2 space-y-2 min-h-[500px]">
                  
                  {gruposSolapados.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-500">
                      <span className="text-xs text-slate-300 font-medium">Sin clases</span>
                    </div>
                  )}

                  {gruposSolapados.map((grupo, idxGrupo) => (
                    <div key={idxGrupo} className="flex flex-row gap-1.5 w-full">
                      {grupo.map(sesion => {
                        const colorClase = getColorAsignatura(sesion.asignaturaId)
                        
                        return (
                          <div 
                            key={sesion._id} 
                            className={`flex-1 min-w-0 p-2.5 rounded-xl border border-l-4 shadow-sm flex flex-col gap-1.5 transition-transform hover:-translate-y-0.5 ${colorClase}`}
                          >
                            <div className="flex items-center text-[10px] font-bold tracking-wider opacity-80 uppercase">
                              <Clock className="w-2.5 h-2.5 mr-1 shrink-0" />
                              <span className="truncate">{sesion.horaInicio} - {sesion.horaFin}</span>
                            </div>
                            
                            <div>
                              <h4 className="font-bold text-xs leading-tight mb-1 truncate" title={getNombreAsignatura(sesion.asignaturaId)}>
                                {getNombreAsignatura(sesion.asignaturaId)}
                              </h4>
                              <span className="inline-block px-1.5 py-0.5 bg-white/40 rounded text-[9px] font-bold uppercase truncate max-w-full" title={formatGrupo(sesion.grupo)}>
                                {formatGrupo(sesion.grupo)}
                              </span>
                            </div>

                            <div className="mt-auto pt-1.5 border-t border-black/10 flex flex-col gap-0.5 text-[11px] font-medium opacity-90">
                              <div className="flex items-start gap-1">
                                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                <span className="leading-tight truncate">{sesion.aulaNombre}</span>
                              </div>
                              <div className="flex items-start gap-1">
                                <User className="w-3 h-3 shrink-0 mt-0.5" />
                                <span className="leading-tight truncate">{sesion.profesorId?.nombre || "Sin profe"}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}