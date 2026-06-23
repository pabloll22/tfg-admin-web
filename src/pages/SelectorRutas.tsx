import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  Map as MapIcon, 
  Layers, 
  Route as RouteIcon, 
  ArrowRight, 
  Loader2,
  Image as ImageIcon
} from "lucide-react"

import { mapaService } from "@/api/api"

// Interfaces basadas en tu modelo de base de datos
interface Planta {
  plantaId: string;
  nombre: string;
  nivel: number;
  imagenBase64: string;
  nodos: any[];
  pois: any[];
}

interface Mapa {
  mapaId: string;
  nombre: string;
  plantas?: Planta[]; // Ahora es opcional porque al principio viene sin ellas
}

export default function SelectorRutas() {
  const [mapas, setMapas] = useState<Mapa[]>([])
  const [mapaSeleccionado, setMapaSeleccionado] = useState<Mapa | null>(null)
  
  // Estados de carga separados
  const [cargandoLista, setCargandoLista] = useState(true)
  const [cargandoPlantas, setCargandoPlantas] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    const cargarMapasBasicos = async () => {
      try {
        // Carga la lista de mapas (viene sin el array de plantas por optimización)
        const data = await mapaService.getListaMapas()
        setMapas(data)
        
        // Si hay mapas, cargamos los detalles completos del primero
        if (data.length > 0) {
          handleSeleccionarMapa(data[0])
        }
      } catch (error) {
        console.error("Error al cargar mapas:", error)
      } finally {
        setCargandoLista(false)
      }
    }

    cargarMapasBasicos()
  }, [])

  // NUEVA FUNCIÓN: Pide al backend el edificio COMPLETO (con sus plantas)
  const handleSeleccionarMapa = async (mapaBase: Mapa) => {
    setMapaSeleccionado(mapaBase) // Lo seleccionamos rápido para la UI
    setCargandoPlantas(true) // Activamos el spinner de la derecha

    try {
      const data = await mapaService.getMapaId(mapaBase.mapaId)
      setMapaSeleccionado(data) // Sobrescribimos con los datos completos
    } catch (error) {
      console.error("Error al traer los detalles del mapa:", error)
    } finally {
      setCargandoPlantas(false)
    }
  }

  if (cargandoLista) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
        <p className="text-lg font-medium">Cargando infraestructura...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      
      {/* --- CABECERA --- */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Editor de Rutas</h1>
        <p className="text-slate-500 mt-1 flex items-center gap-2">
          <RouteIcon className="w-4 h-4" /> Selecciona un edificio y una planta para dibujar el grafo de navegación.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* --- COLUMNA IZQUIERDA: LISTA DE EDIFICIOS --- */}
        <div className="w-full lg:w-1/3 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Tus Edificios</h2>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {mapas.map((mapa) => (
              <button
                key={mapa.mapaId}
                onClick={() => handleSeleccionarMapa(mapa)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  mapaSeleccionado?.mapaId === mapa.mapaId
                    ? "bg-blue-600 border-blue-600 text-white shadow-md transform scale-[1.02]"
                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${mapaSeleccionado?.mapaId === mapa.mapaId ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-tight">{mapa.nombre}</h3>
                      <p className={`text-xs mt-0.5 font-mono ${mapaSeleccionado?.mapaId === mapa.mapaId ? "text-blue-100" : "text-slate-400"}`}>
                        ID: {mapa.mapaId}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${mapaSeleccionado?.mapaId === mapa.mapaId ? "text-white" : "text-slate-300"}`} />
                </div>
              </button>
            ))}

            {mapas.length === 0 && (
              <div className="bg-white border border-slate-200 border-dashed rounded-xl p-8 text-center">
                <MapIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium text-sm">No hay edificios creados</p>
                <Button variant="link" onClick={() => navigate("/mapas")} className="text-blue-600 mt-1">
                  Ir a crear el primer edificio
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* --- COLUMNA DERECHA: PLANTAS DEL EDIFICIO SELECCIONADO --- */}
        <div className="w-full lg:w-2/3 flex flex-col">
          {mapaSeleccionado ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative">
              
              {/* Cabecera del panel derecho */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{mapaSeleccionado.nombre}</h2>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> 
                    {mapaSeleccionado.plantas?.length || 0} plantas disponibles
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/mapas/${mapaSeleccionado.mapaId}`)}>
                  Gestionar Plantas
                </Button>
              </div>

              {/* Grid de Plantas */}
              <div className="p-6 flex-1 overflow-y-auto bg-slate-50 relative">
                
                {/* SPINNER DE CARGA AL CAMBIAR DE EDIFICIO */}
                {cargandoPlantas ? (
                  <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col justify-center items-center text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                    <p className="font-medium">Descargando planos...</p>
                  </div>
                ) : null}

                {(!mapaSeleccionado.plantas || mapaSeleccionado.plantas.length === 0) && !cargandoPlantas ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white border border-slate-200 border-dashed rounded-xl">
                    <Layers className="w-12 h-12 mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-700">Edificio Vacío</h3>
                    <p className="max-w-md mt-2 text-sm">Este edificio aún no tiene ninguna planta subida. Necesitas subir un plano antes de poder dibujar las rutas.</p>
                    <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate(`/mapas/${mapaSeleccionado.mapaId}`)}>
                      Añadir Primera Planta
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mapaSeleccionado.plantas?.map((planta) => (
                      <div key={planta.plantaId} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                        
                        {/* Miniatura del Plano */}
                        <div className="h-32 bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden relative">
                          {planta.imagenBase64 ? (
                            <img src={planta.imagenBase64} alt="Plano" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                            NIVEL {planta.nivel}
                          </div>
                        </div>

                        {/* Info de la planta y Botón */}
                        <div className="p-4 flex flex-col gap-4 flex-1 justify-between">
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg">{planta.nombre}</h3>
                            <div className="flex gap-3 mt-2">
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {planta.nodos?.length || 0} Nodos
                              </span>
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {planta.pois?.length || 0} POIs
                              </span>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-slate-800 hover:bg-blue-600 text-white transition-colors group/btn"
                            onClick={() => navigate(`/rutas/${mapaSeleccionado.mapaId}/editor/${planta.plantaId}`)}
                          >
                            <RouteIcon className="w-4 h-4 mr-2" />
                            Abrir Canvas Editor
                            <ArrowRight className="w-4 h-4 ml-auto opacity-50 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        
      </div>
    </div>
  )
}