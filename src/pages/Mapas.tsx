import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
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
import { Plus, Pencil, Trash2, Search, Building2, Loader2, ExternalLink, Map as MapIcon, Eye } from "lucide-react"

// Ampliamos la interfaz para incluir las dimensiones y la URL
interface MapaResumen {
  mapaId: string;
  nombre: string;
  dimensiones?: {
    ancho: number;
    largo: number;
  };
  urlWeb?: string;
}

export default function Mapas() {
  const [mapas, setMapas] = useState<MapaResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const navigate = useNavigate()

  // --- ESTADOS DEL MODAL ---
  const [open, setOpen] = useState(false)
  const [modoModal, setModoModal] = useState<"CREAR" | "EDITAR">("CREAR")

  // --- ESTADOS DEL FORMULARIO ---
  const [nombre, setNombre] = useState("")
  const [mapaId, setMapaId] = useState("")
  const [ancho, setAncho] = useState("")
  const [largo, setLargo] = useState("")
  const [urlWeb, setUrlWeb] = useState("")

  const cargarMapas = async () => {
    try {
      const respuesta = await axios.get("https://tfg-controluma.onrender.com/api/mapas")
      setMapas(respuesta.data)
    } catch (error) {
      console.error("Error al cargar mapas:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { 
    cargarMapas() 
  }, [])

  // --- ABRIR MODAL CREAR ---
  const handleAbrirCrear = () => {
    setModoModal("CREAR")
    setMapaId("")
    setNombre("")
    setAncho("")
    setLargo("")
    setUrlWeb("")
    setOpen(true)
  }

  // --- ABRIR MODAL EDITAR ---
  const handleAbrirEditar = (mapa: MapaResumen) => {
    setModoModal("EDITAR")
    setMapaId(mapa.mapaId)
    setNombre(mapa.nombre)
    
    // Cargamos las dimensiones de forma segura
    if (mapa.dimensiones && mapa.dimensiones.ancho && mapa.dimensiones.largo) {
      setAncho(mapa.dimensiones.ancho.toString())
      setLargo(mapa.dimensiones.largo.toString())
    } else {
      setAncho("")
      setLargo("")
    }
    
    setUrlWeb(mapa.urlWeb || "")
    setOpen(true)
  }

  // --- GUARDAR O ACTUALIZAR EDIFICIO ---
  const handleGuardarEdificio = async () => {
    if (!mapaId || !nombre || !ancho || !largo) {
      return alert("Por favor, rellena todos los campos obligatorios (ID, Nombre y Dimensiones).")
    }

    setGuardando(true)

    const payload = {
      mapaId,
      nombre,
      dimensiones: {
        ancho: parseFloat(ancho),
        largo: parseFloat(largo)
      },
      urlWeb
    }

    try {
      if (modoModal === "CREAR") {
        await axios.post("https://tfg-controluma.onrender.com/api/mapas", payload)
      } else {
        await axios.put(`https://tfg-controluma.onrender.com/api/mapas/${mapaId}`, payload)
      }
      
      setOpen(false)
      cargarMapas()
    } catch (error) {
      console.error("Error al guardar edificio:", error)
      alert("Error al guardar el edificio. Revisa que el ID no esté repetido.")
    } finally {
      setGuardando(false)
    }
  }

  // --- ELIMINAR EDIFICIO ---
  const handleEliminarEdificio = async (idAEliminar: string) => {
    const confirmacion = window.confirm(
      "🚨 ATENCIÓN: ¿Estás totalmente seguro de que quieres eliminar este edificio?\n\nSe borrarán todas sus plantas, planos, rutas, POIs y Beacons. Esta acción NO se puede deshacer."
    )
    
    if (!confirmacion) return

    try {
      await axios.delete(`https://tfg-controluma.onrender.com/api/mapas/${idAEliminar}`)
      setMapas(mapasActuales => mapasActuales.filter(mapa => mapa.mapaId !== idAEliminar))
    } catch (error) {
      console.error("Error al eliminar el edificio:", error)
      alert("Hubo un error al intentar eliminar el edificio.")
    }
  }

  // --- FILTRADO ---
  const mapasFiltrados = mapas.filter(mapa => 
    mapa.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) || 
    mapa.mapaId.toLowerCase().includes(filtroBusqueda.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* --- CABECERA Y BÚSQUEDA --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Mapas</h1>
          <p className="text-slate-500 mt-1">Configura los edificios y sus dimensiones reales.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar edificio o ID..." 
              className="pl-9 bg-white shadow-sm border-slate-200 focus-visible:ring-blue-500"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>
          <Button onClick={handleAbrirCrear} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0">
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Edificio
          </Button>
        </div>
      </div>

      {/* --- MODAL CREAR / EDITAR --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl text-slate-800">
              {modoModal === "CREAR" ? "Añadir Nuevo Edificio" : "Editar Edificio"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-slate-500">
              {modoModal === "CREAR" 
                ? "Introduce los datos básicos y dimensiones para crear el plano base."
                : "Modifica la información o las medidas de este edificio."}
            </DialogDescription>
          </div>
          
          <div className="grid gap-5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Código ID *</Label>
                <Input 
                  value={mapaId} 
                  onChange={(e) => setMapaId(e.target.value)} 
                  className="font-mono bg-slate-50 focus-visible:ring-blue-500" 
                  disabled={modoModal === "EDITAR"} // No se debe cambiar la clave primaria
                  placeholder="ej: fac_ciencias" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Nombre del Edificio *</Label>
                <Input 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  className="focus-visible:ring-blue-500"
                  placeholder="Ej: Facultad de Ciencias" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <div className="space-y-1.5">
                <Label className="text-blue-800 font-medium">Ancho real (metros) *</Label>
                <Input 
                  type="number" 
                  value={ancho} 
                  onChange={(e) => setAncho(e.target.value)} 
                  className="bg-white focus-visible:ring-blue-500"
                  placeholder="Ej: 120.5" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-blue-800 font-medium">Largo real (metros) *</Label>
                <Input 
                  type="number" 
                  value={largo} 
                  onChange={(e) => setLargo(e.target.value)} 
                  className="bg-white focus-visible:ring-blue-500"
                  placeholder="Ej: 85.0" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium">URL Web Oficial (Opcional)</Label>
              <Input 
                type="url" 
                value={urlWeb} 
                onChange={(e) => setUrlWeb(e.target.value)} 
                className="focus-visible:ring-blue-500"
                placeholder="https://www.uma.es/facultad..." 
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardarEdificio} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]" disabled={guardando}>
              {guardando ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                modoModal === "CREAR" ? "Crear Edificio" : "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- TABLA DE EDIFICIOS MODERNA --- */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Cargando mapas desde MongoDB...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[350px]">Edificio</TableHead>
                <TableHead>Información Adicional</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapasFiltrados.map((mapa) => (
                <TableRow key={mapa.mapaId} className="hover:bg-slate-50/60 transition-colors">
                  {/* COLUMNA: Icono + Nombre + ID */}
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{mapa.nombre}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">ID: {mapa.mapaId}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* COLUMNA: Info extra (Dimensiones y URL) */}
                  <TableCell>
                    <div className="flex flex-col gap-1.5 text-sm">
                      {mapa.dimensiones && (
                        <div className="flex items-center text-slate-600">
                          <MapIcon className="w-3.5 h-3.5 mr-2 text-slate-400" />
                          <span>{mapa.dimensiones.ancho}m × {mapa.dimensiones.largo}m</span>
                        </div>
                      )}
                      {mapa.urlWeb && (
                        <a 
                          href={mapa.urlWeb} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline w-max"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-2" />
                          Visitar Web Oficial
                        </a>
                      )}
                    </div>
                  </TableCell>

                  {/* COLUMNA: Acciones */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <Button 
                        variant="default" 
                        size="sm"
                        className="h-8 bg-slate-800 hover:bg-slate-900 text-white shadow-sm"
                        onClick={() => navigate(`/mapas/${mapa.mapaId}`)}
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> Ver Plantas
                      </Button>
                      
                      <div className="w-px h-6 bg-slate-200 mx-1"></div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                        title="Editar Edificio"
                        onClick={() => handleAbrirEditar(mapa)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Eliminar Edificio"
                        onClick={() => handleEliminarEdificio(mapa.mapaId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* ESTADO VACÍO */}
              {mapasFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Building2 className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-700">No se encontraron edificios</p>
                      <p className="text-sm">Ajusta tu búsqueda o añade un nuevo mapa base.</p>
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