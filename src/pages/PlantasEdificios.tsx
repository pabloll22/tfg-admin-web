import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  ArrowRight,
  Map,
  Plus, 
  Trash2, 
  Search, 
  Layers, 
  Loader2, 
  MapPin, 
  Radio, 
  Route 
} from "lucide-react"

import { mapaService } from "@/api/api"

export default function PlantasEdificio() {
  const { mapaId } = useParams() 
  const navigate = useNavigate()
  const [edificio, setEdificio] = useState<any>(null)
  
  // --- ESTADOS DE CARGA Y UI ---
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const [modalAbierto, setModalAbierto] = useState(false)

  // --- ESTADO DEL FORMULARIO ---
  const [nuevaPlanta, setNuevaPlanta] = useState({
    plantaId: "",
    nombre: "",
    nivel: 0,
    imagenBase64: ""
  })

  const cargarDatosEdificio = async () => {
    try {
      const data = await mapaService.getMapaId(mapaId!)
      setEdificio(data)
    } catch (error) {
      console.error("Error al cargar el edificio:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarDatosEdificio() }, [mapaId])

  // --- MANEJO DE IMAGEN CON PREVISUALIZACIÓN ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setNuevaPlanta({ ...nuevaPlanta, imagenBase64: reader.result as string })
      reader.readAsDataURL(file)
    }
  }

  const handleAbrirModal = () => {
    setNuevaPlanta({ plantaId: "", nombre: "", nivel: 0, imagenBase64: "" })
    setModalAbierto(true)
  }

  const handleGuardarPlanta = async () => {
    if (!nuevaPlanta.plantaId || !nuevaPlanta.nombre || !nuevaPlanta.imagenBase64) {
      return alert("Por favor, rellena todos los campos obligatorios y sube una imagen.")
    }

    setGuardando(true)
    try {
      await mapaService.crearPlanta(mapaId!, nuevaPlanta)
      setModalAbierto(false)
      cargarDatosEdificio() 
    } catch (error) { 
      console.error("Error al guardar:", error)
      alert("Hubo un error al guardar la planta. Revisa que el ID no esté repetido.") 
    } finally {
      setGuardando(false)
    }
  }

  const handleBorrarPlanta = async (plantaIdToDelete: string) => {
    const confirmacion = window.confirm("⚠️ ¿Estás seguro de que quieres eliminar esta planta? Se borrarán todos sus nodos, POIs y Beacons de forma irreversible.")
    if (!confirmacion) return

    try {
      await mapaService.eliminarPlanta(mapaId!, plantaIdToDelete)
      cargarDatosEdificio() 
    } catch (error) {
      console.error("Error al borrar planta:", error)
      alert("Hubo un error al eliminar la planta.")
    }
  }

  const plantasFiltradas = edificio?.plantas?.filter((planta: any) => 
    planta.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) || 
    planta.plantaId.toLowerCase().includes(filtroBusqueda.toLowerCase())
  ) || []

  if (cargando) return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
      <p>Cargando información del edificio...</p>
    </div>
  )
  
  if (!edificio) return <div className="p-8 text-red-500 font-medium">Error: Edificio no encontrado</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* --- NUEVO BOTÓN DE VOLVER (Minimalista) --- */}
      <button 
        onClick={() => navigate("/mapas")}
        className="group flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
        Volver a Mapas
      </button>

      {/* --- CABECERA Y BUSCADOR --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{edificio.nombre}</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Gestión de plantas (ID: {edificio.mapaId})
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar planta..." 
              className="pl-9 bg-white shadow-sm border-slate-200 focus-visible:ring-emerald-500"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>
          <Button onClick={handleAbrirModal} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0">
            <Plus className="w-4 h-4 mr-1.5" /> Añadir Planta
          </Button>
        </div>
      </div>

      {/* --- MODAL PARA AÑADIR PLANTA --- */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl text-slate-800">Añadir Nueva Planta</DialogTitle>
            <DialogDescription className="mt-1.5 text-slate-500">
              Registra un nuevo piso en {edificio.nombre} subiendo su plano en formato imagen.
            </DialogDescription>
          </div>
          
          <div className="grid gap-5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">ID de Planta *</Label>
                <Input 
                  value={nuevaPlanta.plantaId} 
                  onChange={e => setNuevaPlanta({...nuevaPlanta, plantaId: e.target.value})} 
                  placeholder="ej: planta_0" 
                  className="font-mono bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Nivel Numérico *</Label>
                <Input 
                  type="number" 
                  value={nuevaPlanta.nivel} 
                  onChange={e => setNuevaPlanta({...nuevaPlanta, nivel: Number(e.target.value)})} 
                  placeholder="Ej: 0, 1, -1" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium">Nombre de la Planta *</Label>
              <Input 
                value={nuevaPlanta.nombre} 
                onChange={e => setNuevaPlanta({...nuevaPlanta, nombre: e.target.value})} 
                placeholder="Ej: Planta Baja / Sótano 1" 
              />
            </div>

            <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-lg border-dashed">
              <Label className="text-slate-700 font-medium">Plano de la Planta (JPG/PNG) *</Label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="mt-2 bg-white cursor-pointer" 
              />
              
              {nuevaPlanta.imagenBase64 && (
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-xs text-emerald-600 font-medium mb-2 bg-emerald-50 px-2 py-1 rounded-md">
                    ✅ Imagen cargada correctamente
                  </span>
                  <div className="w-full h-32 rounded border bg-white shadow-sm overflow-hidden flex justify-center items-center">
                    <img src={nuevaPlanta.imagenBase64} alt="Previsualización" className="h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" onClick={() => setModalAbierto(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardarPlanta} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]" disabled={guardando}>
              {guardando ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                "Guardar Planta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- TABLA DE PLANTAS MODERNA --- */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="w-[300px]">Detalles de la Planta</TableHead>
              <TableHead>Contenido Estructural</TableHead>
              <TableHead className="text-right">Herramientas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plantasFiltradas.map((planta: any) => (
              <TableRow key={planta.plantaId} className="hover:bg-slate-50/60 transition-colors">
                
                {/* COLUMNA: Info de la planta */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0 font-bold">
                      N{planta.nivel}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 text-base">{planta.nombre}</span>
                      <span className="text-xs text-slate-500 font-mono mt-0.5">ID: {planta.plantaId}</span>
                    </div>
                  </div>
                </TableCell>

                {/* COLUMNA: Datos contenidos */}
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                      <Route className="w-3.5 h-3.5 mr-1.5" />
                      {planta.nodos?.length || 0} Nodos
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100 text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5 mr-1.5" />
                      {planta.pois?.length || 0} POIs
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-medium">
                      <Radio className="w-3.5 h-3.5 mr-1.5" />
                      {Object.keys(planta.knownBeacons || {}).length} Beacons
                    </div>
                  </div>
                </TableCell>

                {/* COLUMNA: Acciones con el botón Moderno */}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-3 items-center">
                    
                    {/* BOTÓN ABRIR EDITOR PREMIUM */}
                    <Button 
                      className="group h-9 rounded-full bg-slate-800 hover:bg-blue-600 text-white px-4 shadow-sm transition-all duration-300"
                      onClick={() => navigate(`/rutas/${mapaId}/editor/${planta.plantaId}`)}
                    >
                      <Map className="w-4 h-4 mr-2 group-hover:text-blue-200 transition-colors" />
                      Abrir Editor
                      <ArrowRight className="w-4 h-4 ml-1.5 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                    </Button>
                    
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar Planta"
                      onClick={() => handleBorrarPlanta(planta.plantaId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {/* ESTADO VACÍO */}
            {plantasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Layers className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-700">No hay plantas configuradas</p>
                    <p className="text-sm">Añade una nueva planta para empezar a trazar rutas.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}