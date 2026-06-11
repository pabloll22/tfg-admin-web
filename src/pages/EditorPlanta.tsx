import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft, MousePointer, PlusCircle, Eye, Link as LinkIcon,
    Trash2, MapPin, Info, Radio, ZoomIn, ZoomOut, Maximize, Move,
    Crosshair, MoveHorizontal, MoveVertical, ArrowUpRight, Building2, Loader2, Save
} from "lucide-react";

export default function EditorPlanta() {
    const { mapaId, plantaId } = useParams();
    const navigate = useNavigate();

    const [modo, setModo] = useState<"seleccionar" | "nodo" | "conectar" | "borrar" | "poi" | "beacon" | "pan">("seleccionar");

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isFullScreen, setIsFullScreen] = useState(false);

    const [edificio, setEdificio] = useState<any>(null);
    const [planta, setPlanta] = useState<any>(null);
    const [nodos, setNodos] = useState<any[]>([]);
    const [pois, setPois] = useState<any[]>([]);
    const [beacons, setBeacons] = useState<Record<string, { x: number; y: number }>>({});

    const [nodoOrigenId, setNodoOrigenId] = useState<string | null>(null);
    const [nodoInfo, setNodoInfo] = useState<any>(null);
    
    // --- ESTADOS PARA EDITAR NODO ---
    const [nodoIdEdit, setNodoIdEdit] = useState<string>("");
    const [nodoNameEdit, setNodoNameEdit] = useState<string>("");

    const [nodoSeleccionadoParaPoi, setNodoSeleccionadoParaPoi] = useState<string | null>(null);
    const [poiForm, setPoiForm] = useState<any>({ 
        nombre: "", tipo: "OTRO", horario: "", telefono: "", esAccesible: false, enlaceExtra: "", capacidad: "" 
    });
    const [beaconSeleccionado, setBeaconSeleccionado] = useState<string | null>(null);
    const [beaconFormMac, setBeaconFormMac] = useState<string>("");
    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
    const [rubberBand, setRubberBand] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const [mostrarGrafo, setMostrarGrafo] = useState(true);
    const [imageSize, setImageSize] = useState({ width: 800, height: 500 });

    const [modalConexionAbierto, setModalConexionAbierto] = useState(false);
    const [plantaDestinoId, setPlantaDestinoId] = useState("");
    const [nodoDestinoId, setNodoDestinoId] = useState("");
    const [guardandoConexion, setGuardandoConexion] = useState(false);

    const contenedorRef = useRef<HTMLDivElement>(null);

    // --- REFS PARA COPIAR/PEGAR Y DESHACER ---
    const portapapelesRef = useRef<{ nodos: any[], pois: any[], beacons: Record<string, any> }>({ 
        nodos: [], pois: [], beacons: {} 
    });
    const historialRef = useRef<{ nodos: any[], pois: any[], beacons: Record<string, any> }[]>([]);

    const dragRef = useRef<{
        tipo: "individual_nodo" | "individual_beacon" | "grupal" | "rubber";
        elementoId?: string;
        startX?: number;
        startY?: number;
        snapshots?: Record<string, { x: number; y: number }>;
        rbStartPx?: { px: number; py: number };
        rbStartM?: { mx: number; my: number };
        haCambiado: boolean;
        estadoPrevio?: any;
    } | null>(null);

    // Sincronización de refs con el estado actual
    const nodosRef = useRef(nodos); useEffect(() => { nodosRef.current = nodos; }, [nodos]);
    const poisRef = useRef(pois); useEffect(() => { poisRef.current = pois; }, [pois]);
    const beaconsRef = useRef(beacons); useEffect(() => { beaconsRef.current = beacons; }, [beacons]);
    const seleccionadosRef = useRef(seleccionados); useEffect(() => { seleccionadosRef.current = seleccionados; }, [seleccionados]);

    const anchoMetros = edificio?.dimensiones?.ancho || 1;
    const largoMetros = edificio?.dimensiones?.largo || 1;
    const anchoRef = useRef(anchoMetros); useEffect(() => { anchoRef.current = anchoMetros; }, [anchoMetros]);
    const largoRef = useRef(largoMetros); useEffect(() => { largoRef.current = largoMetros; }, [largoMetros]);
    const imageSizeRef = useRef(imageSize); useEffect(() => { imageSizeRef.current = imageSize; }, [imageSize]);

    const cargarDatos = async () => {
        try {
            const respuesta = await axios.get(`https://tfg-controluma.onrender.com/api/mapas/${mapaId}`);
            setEdificio(respuesta.data);
            const plantaEncontrada = respuesta.data.plantas?.find((p: any) => p.plantaId === plantaId);
            setPlanta(plantaEncontrada);
            if (plantaEncontrada) {
                setNodos(plantaEncontrada.nodos || []);
                setPois(plantaEncontrada.pois || []);
                setBeacons(plantaEncontrada.knownBeacons || {});
            }
        } catch (error) { 
            console.error("Error al cargar datos:", error); 
        }
    };

    useEffect(() => { 
        cargarDatos(); 
    }, [mapaId, plantaId]);

    const guardarNodosBD = async (nodosAct: any[]) => { 
        await axios.put(`https://tfg-controluma.onrender.com/api/mapas/${mapaId}/plantas/${plantaId}/nodos`, { nodos: nodosAct })
            .catch(() => alert("Error al guardar nodos")); 
    };
    
    const guardarPoisBD = async (poisAct: any[]) => { 
        await axios.put(`https://tfg-controluma.onrender.com/api/mapas/${mapaId}/plantas/${plantaId}/pois`, { pois: poisAct })
            .catch(() => alert("Error")); 
    };
    
    const guardarBeaconsBD = async (beaconsAct: Record<string, { x: number; y: number }>) => { 
        await axios.put(`https://tfg-controluma.onrender.com/api/mapas/${mapaId}/plantas/${plantaId}/beacons`, { beacons: beaconsAct })
            .catch(() => alert("Error")); 
    };

    // ========================================================
    // GUARDAR CAMBIOS DE NOMBRE E ID DE NODO (ACTUALIZADO PARA TODO EL EDIFICIO)
    // ========================================================
    const handleGuardarCambiosNodo = async () => {
        if (!nodoIdEdit.trim() || !nodoNameEdit.trim()) return alert("El ID y el Nombre son obligatorios.");
        
        const oldId = nodoInfo.id;
        const newId = nodoIdEdit.trim();
        
        // Comprobar colisión de ID en TODAS LAS PLANTAS del edificio
        if (newId !== oldId) {
            // 1. En la planta actual
            if (nodosRef.current.some(n => n.id === newId)) {
                return alert("Ya existe un nodo con ese ID en esta misma planta.");
            }
            // 2. En el resto del edificio
            const existeEnOtraPlanta = edificio?.plantas?.some((p: any) => 
                p.plantaId !== plantaId && p.nodos?.some((n: any) => n.id === newId)
            );
            if (existeEnOtraPlanta) {
                return alert("El ID no es válido. Ya existe un nodo con ese ID en otra planta de este edificio.");
            }
        }

        guardarEnHistorial();

        // 1. Actualizar el nodo y las referencias de sus vecinos locales
        const nuevosNodos = nodosRef.current.map(n => {
            let nId = n.id;
            let nName = n.name;
            let nNeighbors = n.neighbors;

            if (n.id === oldId) {
                nId = newId;
                nName = nodoNameEdit;
            }

            // Cambiamos las referencias en los vecinos si el ID mutó
            nNeighbors = nNeighbors.map((v: string) => v === oldId ? newId : v);

            return { ...n, id: nId, name: nName, neighbors: nNeighbors };
        });

        // 2. Actualizar POIs locales que apunten a este nodo
        let poisModificados = false;
        const nuevosPois = poisRef.current.map(p => {
            if (p.nodoId === oldId) {
                poisModificados = true;
                return { ...p, nodoId: newId };
            }
            return p;
        });

        // 3. Actualizar la selección en pantalla
        const nuevasSelecciones = new Set(seleccionadosRef.current);
        if (nuevasSelecciones.has(`nodo:${oldId}`)) {
            nuevasSelecciones.delete(`nodo:${oldId}`);
            nuevasSelecciones.add(`nodo:${newId}`);
        }

        setNodos(nuevosNodos);
        if (poisModificados) setPois(nuevosPois);
        setSeleccionados(nuevasSelecciones);
        
        const nodoActualizado = nuevosNodos.find(n => n.id === newId);
        setNodoInfo(nodoActualizado);

        await guardarNodosBD(nuevosNodos);
        if (poisModificados) await guardarPoisBD(nuevosPois);
    };

    // ========================================================
    // CAMBIAR TIPO DE NODO (Escalera, Ascensor, Normal)
    // ========================================================
    const handleCambiarTipoNodo = (nuevoTipo: string) => {
        if (!nodoInfo) return;
        guardarEnHistorial();
        
        const nuevosNodos = nodosRef.current.map(n => {
            if (n.id === nodoInfo.id) {
                return { ...n, tipo: nuevoTipo };
            }
            return n;
        });
        
        setNodos(nuevosNodos);
        setNodoInfo({ ...nodoInfo, tipo: nuevoTipo }); 
        guardarNodosBD(nuevosNodos);
    };

    // ========================================================
    // FUNCIONES DE HISTORIAL Y PORTAPAPELES
    // ========================================================
    const guardarEnHistorial = useCallback(() => {
        historialRef.current.push({
            nodos: JSON.parse(JSON.stringify(nodosRef.current)),
            pois: JSON.parse(JSON.stringify(poisRef.current)),
            beacons: JSON.parse(JSON.stringify(beaconsRef.current))
        });
        if (historialRef.current.length > 20) {
            historialRef.current.shift();
        }
    }, []);

    const deshacer = useCallback(async () => {
        if (historialRef.current.length === 0) return;
        const estadoAnterior = historialRef.current.pop()!;
        
        setNodos(estadoAnterior.nodos);
        setPois(estadoAnterior.pois);
        setBeacons(estadoAnterior.beacons);
        setSeleccionados(new Set()); 

        await guardarNodosBD(estadoAnterior.nodos);
        await guardarPoisBD(estadoAnterior.pois);
        await guardarBeaconsBD(estadoAnterior.beacons);
    }, []);

    const copiarSeleccion = useCallback(() => {
        const sel = seleccionadosRef.current;
        if (sel.size === 0) return;

        const idsNodo = [...sel].filter(id => id.startsWith("nodo:")).map(id => id.slice(5));
        const macsBcn = [...sel].filter(id => id.startsWith("beacon:")).map(id => id.slice(7));

        const nodosCopiar = nodosRef.current.filter(n => idsNodo.includes(n.id));
        const poisCopiar = poisRef.current.filter(p => idsNodo.includes(p.nodoId));
        const beaconsCopiar: Record<string, any> = {};
        
        macsBcn.forEach(mac => { 
            if (beaconsRef.current[mac]) {
                beaconsCopiar[mac] = beaconsRef.current[mac]; 
            }
        });

        portapapelesRef.current = {
            nodos: JSON.parse(JSON.stringify(nodosCopiar)),
            pois: JSON.parse(JSON.stringify(poisCopiar)),
            beacons: JSON.parse(JSON.stringify(beaconsCopiar))
        };
    }, []);

    const pegarSeleccion = useCallback(async () => {
        const clipboard = portapapelesRef.current;
        if (clipboard.nodos.length === 0 && Object.keys(clipboard.beacons).length === 0) return;

        guardarEnHistorial(); 

        const offset = 0.5;
        const nuevasSelecciones = new Set<string>();
        const idMap: Record<string, string> = {};

        let nuevosNodos = [...nodosRef.current];
        let nuevosPois = [...poisRef.current];
        let nuevosBeacons = { ...beaconsRef.current };

        const nodosPulsados = clipboard.nodos.map(nodoViejo => {
            const nuevoId = `nodo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            idMap[nodoViejo.id] = nuevoId;
            nuevasSelecciones.add(`nodo:${nuevoId}`);
            return {
                ...nodoViejo,
                id: nuevoId,
                position: { 
                    x: nodoViejo.position.x + offset, 
                    y: nodoViejo.position.y + offset 
                },
                neighbors: [] 
            };
        });

        nodosPulsados.forEach(nodoNuevo => {
            const nodoViejo = clipboard.nodos.find(n => idMap[n.id] === nodoNuevo.id);
            if (nodoViejo) {
                nodoNuevo.neighbors = nodoViejo.neighbors
                    .filter((vecinoViejoId: string) => idMap[vecinoViejoId]) 
                    .map((vecinoViejoId: string) => idMap[vecinoViejoId]);
            }
        });

        nuevosNodos = [...nuevosNodos, ...nodosPulsados];

        clipboard.pois.forEach(poiViejo => {
            const nuevoNodoId = idMap[poiViejo.nodoId];
            if (nuevoNodoId) {
                nuevosPois.push({
                    ...poiViejo,
                    id: `poi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    nodoId: nuevoNodoId
                });
            }
        });

        Object.entries(clipboard.beacons).forEach(([_macVieja, posicion]) => {
            const nuevaMac = `MAC_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
            nuevosBeacons[nuevaMac] = { 
                x: posicion.x + offset, 
                y: posicion.y + offset 
            };
            nuevasSelecciones.add(`beacon:${nuevaMac}`);
        });

        setNodos(nuevosNodos); 
        setPois(nuevosPois); 
        setBeacons(nuevosBeacons);
        setSeleccionados(nuevasSelecciones);

        if (nodosPulsados.length > 0) { 
            await guardarNodosBD(nuevosNodos); 
            await guardarPoisBD(nuevosPois); 
        }
        if (Object.keys(clipboard.beacons).length > 0) {
            await guardarBeaconsBD(nuevosBeacons);
        }

    }, [guardarEnHistorial]);

    const cortarSeleccion = useCallback(() => {
        if (seleccionadosRef.current.size === 0) return;
        guardarEnHistorial();
        copiarSeleccion();
        borrarSeleccionados();
    }, [copiarSeleccion, guardarEnHistorial]);

    // ========================================================
    // FUNCIONES BASE
    // ========================================================
    const borrarSeleccionados = useCallback(() => {
        const sel = seleccionadosRef.current;
        if (sel.size === 0) return;
        
        const idsNodo = [...sel].filter(id => id.startsWith("nodo:")).map(id => id.slice(5));
        const macsBcn = [...sel].filter(id => id.startsWith("beacon:")).map(id => id.slice(7));

        let nuevosNodos = nodosRef.current;
        let nuevosPois = poisRef.current;
        let nuevosBeacons = { ...beaconsRef.current };

        if (idsNodo.length > 0) {
            nuevosNodos = nodosRef.current
                .filter(n => !idsNodo.includes(n.id))
                .map(n => ({ 
                    ...n, 
                    neighbors: n.neighbors.filter((id: string) => !idsNodo.includes(id)) 
                }));
            nuevosPois = poisRef.current.filter(p => !idsNodo.includes(p.nodoId));
        }
        
        macsBcn.forEach(mac => delete nuevosBeacons[mac]);

        setNodos(nuevosNodos); 
        setPois(nuevosPois); 
        setBeacons(nuevosBeacons);
        
        if (idsNodo.length > 0) { 
            guardarNodosBD(nuevosNodos); 
            guardarPoisBD(nuevosPois); 
        }
        if (macsBcn.length > 0) {
            guardarBeaconsBD(nuevosBeacons);
        }

        setSeleccionados(new Set()); 
        setNodoInfo(null); 
        setBeaconSeleccionado(null);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

            // Borrar
            if ((e.key === "Delete" || e.key === "Backspace") && seleccionadosRef.current.size > 0) {
                e.preventDefault();
                guardarEnHistorial();
                borrarSeleccionados();
            }

            // Atajos
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'c') { e.preventDefault(); copiarSeleccion(); }
                if (e.key.toLowerCase() === 'x') { e.preventDefault(); cortarSeleccion(); }
                if (e.key.toLowerCase() === 'v') { e.preventDefault(); pegarSeleccion(); }
                if (e.key.toLowerCase() === 'z') { e.preventDefault(); deshacer(); }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [borrarSeleccionados, copiarSeleccion, cortarSeleccion, pegarSeleccion, deshacer, guardarEnHistorial]);

    const cambiarModo = (nuevoModo: any) => {
        setModo(nuevoModo); 
        setNodoOrigenId(null); 
        setNodoSeleccionadoParaPoi(null); 
        setBeaconSeleccionado(null); 
        setNodoInfo(null); 
        setSeleccionados(new Set()); 
        setRubberBand(null); 
        dragRef.current = null;
    };

    const centrarVista = () => { 
        setZoom(1); 
        setPan({ x: 0, y: 0 }); 
    };

    const screenToMetros = (clientX: number, clientY: number) => {
        if (!contenedorRef.current) return { x: 0, y: 0 };
        const rect = contenedorRef.current.getBoundingClientRect();
        let px = (clientX - rect.left) / zoom;
        let py = (clientY - rect.top) / zoom;

        return {
            x: Number(((px / imageSizeRef.current.width) * anchoRef.current).toFixed(2)),
            y: Number(((py / imageSizeRef.current.height) * largoRef.current).toFixed(2)),
        };
    };

    // ALINEAR NODOS
    const handleAlinearSeleccion = (eje: 'x' | 'y') => {
        const idsNodos = [...seleccionados].filter(id => id.startsWith("nodo:")).map(id => id.slice(5));
        if (idsNodos.length < 2) return;

        guardarEnHistorial(); 
        const nodosAlinear = nodosRef.current.filter(n => idsNodos.includes(n.id));
        const suma = nodosAlinear.reduce((acc, n) => acc + n.position[eje], 0);
        const media = Number((suma / nodosAlinear.length).toFixed(2));

        const nuevosNodos = nodosRef.current.map(n => {
            if (idsNodos.includes(n.id)) {
                return { ...n, position: { ...n.position, [eje]: media } };
            }
            return n;
        });

        setNodos(nuevosNodos);
        guardarNodosBD(nuevosNodos);
    };

    // DISTRIBUIR NODOS
    const handleDistribuirSeleccion = (eje: 'x' | 'y') => {
        const idsNodos = [...seleccionados].filter(id => id.startsWith("nodo:")).map(id => id.slice(5));
        if (idsNodos.length < 3) return; 

        guardarEnHistorial();

        const nodosDistribuir = nodosRef.current
            .filter(n => idsNodos.includes(n.id))
            .sort((a, b) => a.position[eje] - b.position[eje]);

        const minVal = nodosDistribuir[0].position[eje];
        const maxVal = nodosDistribuir[nodosDistribuir.length - 1].position[eje];
        const step = (maxVal - minVal) / (nodosDistribuir.length - 1);

        const nuevosNodos = nodosRef.current.map(n => {
            const index = nodosDistribuir.findIndex(nd => nd.id === n.id);
            if (index !== -1) {
                const nuevoValor = Number((minVal + index * step).toFixed(2));
                return { ...n, position: { ...n.position, [eje]: nuevoValor } };
            }
            return n;
        });

        setNodos(nuevosNodos);
        guardarNodosBD(nuevosNodos);
    };

    const iniciarDragElemento = (e: React.MouseEvent, key: string, elementoId: string, tipo: "individual_nodo" | "individual_beacon") => {
        e.stopPropagation();
        const sel = seleccionadosRef.current;

        if (e.shiftKey) {
            setSeleccionados(prev => { 
                const next = new Set(prev); 
                next.has(key) ? next.delete(key) : next.add(key); 
                return next; 
            });
            return;
        }

        const estadoPrevioSnapshot = {
            nodos: JSON.parse(JSON.stringify(nodosRef.current)),
            pois: JSON.parse(JSON.stringify(poisRef.current)),
            beacons: JSON.parse(JSON.stringify(beaconsRef.current))
        };

        if (sel.has(key) && sel.size > 1) {
            const { x, y } = screenToMetros(e.clientX, e.clientY);
            const snapshots: Record<string, { x: number; y: number }> = {};
            
            sel.forEach(id => {
                if (id.startsWith("nodo:")) {
                    const n = nodosRef.current.find(n => n.id === id.slice(5));
                    if (n) snapshots[id] = { ...n.position };
                } else if (id.startsWith("beacon:")) {
                    const mac = id.slice(7);
                    if (beaconsRef.current[mac]) snapshots[id] = { ...beaconsRef.current[mac] };
                }
            });
            
            dragRef.current = { 
                tipo: "grupal", 
                startX: x, 
                startY: y, 
                snapshots, 
                haCambiado: false, 
                estadoPrevio: estadoPrevioSnapshot 
            };
        } else {
            setSeleccionados(new Set([key]));
            dragRef.current = { 
                tipo, 
                elementoId, 
                haCambiado: false, 
                estadoPrevio: estadoPrevioSnapshot 
            };
            
            if (tipo === "individual_nodo") {
                const nodoSel = nodosRef.current.find(n => n.id === elementoId);
                setNodoInfo(nodoSel); 
                setNodoIdEdit(nodoSel?.id || "");
                setNodoNameEdit(nodoSel?.name || "");
                setBeaconSeleccionado(null);
            } else {
                setBeaconSeleccionado(elementoId); 
                setBeaconFormMac(elementoId); 
                setNodoInfo(null);
            }
        }
    };

    const handleMouseDownNodo = (e: React.MouseEvent, nodo: any) => {
        e.stopPropagation();
        
        if (modo === "seleccionar") { 
            iniciarDragElemento(e, `nodo:${nodo.id}`, nodo.id, "individual_nodo");
        } else if (modo === "conectar") {
            if (!nodoOrigenId) {
                setNodoOrigenId(nodo.id);
            } else if (nodoOrigenId !== nodo.id) {
                guardarEnHistorial();
                const yaConectados = nodosRef.current.find(n => n.id === nodoOrigenId)?.neighbors.includes(nodo.id);
                const nuevosNodos = nodosRef.current.map(n => {
                    if (n.id === nodoOrigenId) {
                        return { 
                            ...n, 
                            neighbors: yaConectados 
                                ? n.neighbors.filter((id: string) => id !== nodo.id) 
                                : [...n.neighbors, nodo.id] 
                        };
                    }
                    if (n.id === nodo.id) {
                        return { 
                            ...n, 
                            neighbors: yaConectados 
                                ? n.neighbors.filter((id: string) => id !== nodoOrigenId) 
                                : [...n.neighbors, nodoOrigenId] 
                        };
                    }
                    return n;
                });
                setNodos(nuevosNodos); 
                guardarNodosBD(nuevosNodos); 
                setNodoOrigenId(null);
            }
        } else if (modo === "borrar") {
            guardarEnHistorial();
            const sel = seleccionadosRef.current;
            if (sel.size > 1 && sel.has(`nodo:${nodo.id}`)) { 
                borrarSeleccionados(); 
                return; 
            }
            const nuevosNodos = nodosRef.current
                .filter(n => n.id !== nodo.id)
                .map(n => ({ ...n, neighbors: n.neighbors.filter((id: string) => id !== nodo.id) }));
            const nuevosPois = poisRef.current.filter(p => p.nodoId !== nodo.id);
            
            setNodos(nuevosNodos); 
            setPois(nuevosPois); 
            guardarNodosBD(nuevosNodos); 
            guardarPoisBD(nuevosPois); 
            setNodoInfo(null);
        } else if (modo === "poi") {
            setNodoSeleccionadoParaPoi(nodo.id); 
            setPoiForm(poisRef.current.find(p => p.nodoId === nodo.id) || { 
                nombre: "", tipo: "OTRO", horario: "", telefono: "", esAccesible: false, enlaceExtra: "", capacidad: "" 
            });
        }
    };

    const handleMouseDownBeacon = (e: React.MouseEvent, mac: string) => {
        e.stopPropagation();
        
        if (modo === "seleccionar") { 
            iniciarDragElemento(e, `beacon:${mac}`, mac, "individual_beacon"); 
        } else if (modo === "borrar") {
            guardarEnHistorial();
            const sel = seleccionadosRef.current;
            if (sel.size > 1 && sel.has(`beacon:${mac}`)) { 
                borrarSeleccionados(); 
                return; 
            }
            const nuevosBeacons = { ...beaconsRef.current }; 
            delete nuevosBeacons[mac];
            
            setBeacons(nuevosBeacons); 
            guardarBeaconsBD(nuevosBeacons); 
            if (beaconSeleccionado === mac) setBeaconSeleccionado(null);
        } else if (modo === "beacon") { 
            setBeaconSeleccionado(mac); 
            setBeaconFormMac(mac); 
        }
    };

    const handlePlanoMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modo !== "seleccionar") return;
        const rect = contenedorRef.current!.getBoundingClientRect();
        const px = (e.clientX - rect.left) / zoom; 
        const py = (e.clientY - rect.top) / zoom;
        const mx = Number(((px / imageSizeRef.current.width) * anchoRef.current).toFixed(2));
        const my = Number(((py / imageSizeRef.current.height) * largoRef.current).toFixed(2));
        
        dragRef.current = { 
            tipo: "rubber", 
            rbStartPx: { px, py }, 
            rbStartM: { mx, my }, 
            haCambiado: false 
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (modo === "pan" && e.buttons === 1) {
            setPan(prev => ({ 
                x: prev.x + e.movementX / zoom, 
                y: prev.y + e.movementY / zoom 
            }));
            return;
        }

        const drag = dragRef.current;
        if (!drag || !contenedorRef.current) return;

        const rect = contenedorRef.current.getBoundingClientRect();
        let pxCur = (e.clientX - rect.left) / zoom;
        let pyCur = (e.clientY - rect.top) / zoom;

        const xM = Number(((pxCur / imageSizeRef.current.width) * anchoRef.current).toFixed(2));
        const yM = Number(((pyCur / imageSizeRef.current.height) * largoRef.current).toFixed(2));

        if (drag.tipo === "grupal") {
            drag.haCambiado = true;
            const dx = xM - drag.startX!; 
            const dy = yM - drag.startY!;
            
            setNodos(prev => prev.map(n => {
                const snap = drag.snapshots![`nodo:${n.id}`];
                return snap 
                    ? { ...n, position: { x: Number((snap.x + dx).toFixed(2)), y: Number((snap.y + dy).toFixed(2)) } } 
                    : n;
            }));
            
            setBeacons(prev => {
                const next = { ...prev };
                Object.entries(drag.snapshots!).forEach(([id, pos]) => { 
                    if (id.startsWith("beacon:")) {
                        next[id.slice(7)] = { 
                            x: Number((pos.x + dx).toFixed(2)), 
                            y: Number((pos.y + dy).toFixed(2)) 
                        };
                    } 
                });
                return next;
            });
        } else if (drag.tipo === "individual_nodo") {
            drag.haCambiado = true; 
            setNodos(prev => prev.map(n => n.id === drag.elementoId ? { ...n, position: { x: xM, y: yM } } : n)); 
            setNodoInfo((prev: any) => prev ? { ...prev, position: { x: xM, y: yM } } : prev);
        } else if (drag.tipo === "individual_beacon") {
            drag.haCambiado = true; 
            setBeacons(prev => ({ ...prev, [drag.elementoId!]: { x: xM, y: yM } }));
        } else if (drag.tipo === "rubber") {
            const pxRaw = (e.clientX - rect.left) / zoom; 
            const pyRaw = (e.clientY - rect.top) / zoom;
            const xMRaw = Number(((pxRaw / imageSizeRef.current.width) * anchoRef.current).toFixed(2));
            const yMRaw = Number(((pyRaw / imageSizeRef.current.height) * largoRef.current).toFixed(2));

            if (Math.abs(pxRaw - drag.rbStartPx!.px) > 4 || Math.abs(pyRaw - drag.rbStartPx!.py) > 4) {
                drag.haCambiado = true; 
                setRubberBand({ x1: drag.rbStartM!.mx, y1: drag.rbStartM!.my, x2: xMRaw, y2: yMRaw });
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        const drag = dragRef.current;
        if (!drag) return;

        if (drag.haCambiado && drag.estadoPrevio && drag.tipo !== "rubber") {
            historialRef.current.push(drag.estadoPrevio);
            if (historialRef.current.length > 20) {
                historialRef.current.shift();
            }
        }

        if (drag.tipo === "grupal" && drag.haCambiado) { 
            guardarNodosBD(nodosRef.current); 
            guardarBeaconsBD(beaconsRef.current); 
        } else if (drag.tipo === "individual_nodo" && drag.haCambiado) { 
            guardarNodosBD(nodosRef.current); 
        } else if (drag.tipo === "individual_beacon" && drag.haCambiado) { 
            guardarBeaconsBD(beaconsRef.current); 
        } else if (drag.tipo === "rubber") {
            if (drag.haCambiado && rubberBand) {
                const minX = Math.min(rubberBand.x1, rubberBand.x2); 
                const maxX = Math.max(rubberBand.x1, rubberBand.x2);
                const minY = Math.min(rubberBand.y1, rubberBand.y2); 
                const maxY = Math.max(rubberBand.y1, rubberBand.y2);
                const nuevaSel = new Set<string>();
                
                nodosRef.current.forEach(n => { 
                    if (n.position.x >= minX && n.position.x <= maxX && n.position.y >= minY && n.position.y <= maxY) {
                        nuevaSel.add(`nodo:${n.id}`);
                    } 
                });
                Object.entries(beaconsRef.current).forEach(([mac, pos]) => { 
                    if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
                        nuevaSel.add(`beacon:${mac}`);
                    } 
                });
                
                setSeleccionados(e.shiftKey ? prev => new Set([...prev, ...nuevaSel]) : nuevaSel);
            } else if (!drag.haCambiado && !e.shiftKey) { 
                setSeleccionados(new Set()); 
                setNodoInfo(null); 
                setBeaconSeleccionado(null); 
            }
            setRubberBand(null);
        }
        dragRef.current = null;
    };

    const handlePlanoClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modo !== "nodo" && modo !== "beacon") return;
        guardarEnHistorial();
        
        const { x, y } = screenToMetros(e.clientX, e.clientY);
        
        if (modo === "nodo") {
            const nuevoNodo = { 
                id: `nodo_${Date.now()}`, 
                name: "Nuevo Nodo", 
                plantaId, 
                position: { x, y }, 
                neighbors: [],
                tipo: "NORMAL"
            };
            const nuevosNodos = [...nodosRef.current, nuevoNodo]; 
            setNodos(nuevosNodos); 
            guardarNodosBD(nuevosNodos); 
            setNodoInfo(nuevoNodo);
            setNodoIdEdit(nuevoNodo.id);
            setNodoNameEdit(nuevoNodo.name);
        } else {
            const macTemporal = `MAC_${Date.now().toString().slice(-6)}`; 
            const nuevosBeacons = { ...beaconsRef.current, [macTemporal]: { x, y } };
            setBeacons(nuevosBeacons); 
            guardarBeaconsBD(nuevosBeacons); 
            setBeaconSeleccionado(macTemporal); 
            setBeaconFormMac(macTemporal);
        }
    };

    // ========================================================
    // GUARDAR POI ACTUALIZADO
    // ========================================================
    const handleGuardarPoi = () => {
        if (!poiForm.nombre.trim()) return alert("El nombre es obligatorio");
        guardarEnHistorial();
        
        const nuevosPois = [...poisRef.current]; 
        const idx = nuevosPois.findIndex(p => p.nodoId === nodoSeleccionadoParaPoi);
        
        const poiFinal = { 
            ...poiForm, 
            id: poiForm.id || `poi_${Date.now()}`, 
            nodoId: nodoSeleccionadoParaPoi, 
            plantaId, 
            capacidad: poiForm.capacidad ? Number(poiForm.capacidad) : null,
            // ASEGURAMOS QUE SI NO ES ASEO, esAccesible VUELVE A FALSE:
            esAccesible: poiForm.tipo === 'ASEO' ? (poiForm.esAccesible || false) : false 
        };
        
        if (idx >= 0) {
            nuevosPois[idx] = poiFinal; 
        } else {
            nuevosPois.push(poiFinal);
        }
        
        setPois(nuevosPois); 
        guardarPoisBD(nuevosPois); 
        setNodoSeleccionadoParaPoi(null);
    };

    const handleBorrarPoi = () => { 
        guardarEnHistorial(); 
        const nuevosPois = poisRef.current.filter(p => p.nodoId !== nodoSeleccionadoParaPoi); 
        setPois(nuevosPois); 
        guardarPoisBD(nuevosPois); 
        setNodoSeleccionadoParaPoi(null); 
    };

    const handleGuardarMacBeacon = () => {
        if (!beaconFormMac.trim() || !beaconSeleccionado) return alert("La MAC no puede estar vacía");
        if (beaconFormMac === beaconSeleccionado) return;
        if (beaconsRef.current[beaconFormMac]) return alert("Esta MAC ya existe en la planta");
        
        guardarEnHistorial();
        const nuevosBeacons = { ...beaconsRef.current }; 
        const posOriginal = nuevosBeacons[beaconSeleccionado]; 
        delete nuevosBeacons[beaconSeleccionado];
        nuevosBeacons[beaconFormMac] = posOriginal; 
        
        setBeacons(nuevosBeacons); 
        setBeaconSeleccionado(beaconFormMac); 
        guardarBeaconsBD(nuevosBeacons);
    };

    const abrirModalConexion = () => {
        setPlantaDestinoId("");
        setNodoDestinoId("");
        setModalConexionAbierto(true);
    };

    const handleConectarPlantas = async () => {
        if (!plantaDestinoId || !nodoDestinoId) return alert("Selecciona la planta y el nodo de destino.");

        setGuardandoConexion(true);
        guardarEnHistorial();
        
        try {
            const nuevosNodosLocal = nodosRef.current.map(n => {
                if (n.id === nodoInfo.id && !n.neighbors.includes(nodoDestinoId)) {
                    return { ...n, neighbors: [...n.neighbors, nodoDestinoId] };
                }
                return n;
            });
            setNodos(nuevosNodosLocal);
            await guardarNodosBD(nuevosNodosLocal); 

            const plantaDest = edificio.plantas.find((p: any) => p.plantaId === plantaDestinoId);
            if (plantaDest && plantaDest.nodos) {
                const nuevosNodosDestino = plantaDest.nodos.map((n: any) => {
                    if (n.id === nodoDestinoId && !n.neighbors.includes(nodoInfo.id)) {
                        return { ...n, neighbors: [...n.neighbors, nodoInfo.id] };
                    }
                    return n;
                });
                await axios.put(`https://tfg-controluma.onrender.com/api/mapas/${mapaId}/plantas/${plantaDestinoId}/nodos`, { nodos: nuevosNodosDestino });
            }

            setModalConexionAbierto(false);
            cargarDatos(); 
            alert("Conexión entre plantas establecida con éxito.");

        } catch (error) {
            console.error("Error al conectar plantas:", error);
            alert("Hubo un error al establecer la conexión bidireccional.");
        } finally {
            setGuardandoConexion(false);
        }
    };

    if (!edificio || !planta) {
        return <div className="p-8 text-slate-500">Cargando...</div>;
    }

    const rbPx = rubberBand ? {
        x: Math.min(rubberBand.x1, rubberBand.x2) / anchoMetros * imageSize.width,
        y: Math.min(rubberBand.y1, rubberBand.y2) / largoMetros * imageSize.height,
        w: Math.abs(rubberBand.x2 - rubberBand.x1) / anchoMetros * imageSize.width,
        h: Math.abs(rubberBand.y2 - rubberBand.y1) / largoMetros * imageSize.height,
    } : null;

    const renderPanelContextual = () => {
        if (seleccionados.size === 1 && modo === "seleccionar" && nodoInfo) {
            // Un nodo está conectado a otra planta si alguno de sus vecinos no existe en la lista de nodos de ESTA planta.
            const isCrossFloor = nodoInfo.neighbors?.some((vecinoId: string) => !nodos.find(n => n.id === vecinoId));

            return (
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border shadow-sm border-blue-100">
                        <h4 className="font-bold text-sm text-blue-900 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" /> Detalles del Nodo
                        </h4>
                        
                        {/* --- EDICIÓN DEL NODO --- */}
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600">ID del Nodo *</label>
                                <input 
                                    type="text" 
                                    value={nodoIdEdit} 
                                    onChange={e => setNodoIdEdit(e.target.value)} 
                                    disabled={isCrossFloor}
                                    className={`w-full border rounded p-2 text-sm mt-1 font-mono ${isCrossFloor ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white'}`} 
                                />
                                {isCrossFloor && <p className="text-[10px] text-red-500 mt-1 leading-tight">No puedes cambiar el ID de un nodo interplanta porque rompería la conexión vertical.</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Nombre del Nodo *</label>
                                <input 
                                    type="text" 
                                    value={nodoNameEdit} 
                                    onChange={e => setNodoNameEdit(e.target.value)} 
                                    className="w-full border rounded p-2 text-sm mt-1 bg-white" 
                                    placeholder="Ej: Pasillo principal"
                                />
                            </div>
                            
                            <Button onClick={handleGuardarCambiosNodo} variant="outline" className="w-full text-blue-700 border-blue-300 hover:bg-blue-100 h-8 text-xs">
                                <Save className="w-3 h-3 mr-2" /> Guardar Nombre / ID
                            </Button>
                        </div>

                        <div className="space-y-2 text-sm font-mono text-slate-700 bg-white p-3 rounded border border-slate-200">
                            <div className="flex justify-between">
                                <span>X:</span> 
                                <span>{nodoInfo.position.x} m</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Y:</span> 
                                <span>{nodoInfo.position.y} m</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                                <span>Conexiones:</span> 
                                <span className="font-bold text-blue-600">{nodoInfo.neighbors?.length || 0}</span>
                            </div>

                            {/* SELECTOR DE TIPO DE NODO */}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2">
                                <span>Tipo:</span>
                                <select
                                    value={nodoInfo.tipo || 'NORMAL'}
                                    onChange={(e) => handleCambiarTipoNodo(e.target.value)}
                                    className="border rounded text-xs p-1 font-semibold text-blue-700 bg-blue-50 outline-none cursor-pointer"
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="ESCALERA">Escalera</option>
                                    <option value="ASCENSOR">Ascensor</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <Button onClick={abrirModalConexion} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2">
                                <ArrowUpRight className="w-4 h-4" /> Conectar a otro Nivel
                            </Button>
                            {isCrossFloor && (
                                <p className="text-[10px] font-bold text-amber-600 text-center mt-2 uppercase bg-amber-50 rounded py-1 border border-amber-200">
                                    ⚠️ Nodo Interplanta ({nodoInfo.tipo === 'NORMAL' ? 'Sin Especificar' : nodoInfo.tipo})
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (seleccionados.size > 1 && modo === "seleccionar") {
            const nodosN = [...seleccionados].filter(id => id.startsWith("nodo:")).length;
            const beaconsN = [...seleccionados].filter(id => id.startsWith("beacon:")).length;
            
            return (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg border-b pb-2 flex items-center gap-2">
                        <MousePointer className="w-5 h-5 text-violet-500" /> Selección múltiple
                    </h3>
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-semibold text-violet-800">{seleccionados.size} elementos seleccionados</p>
                        {nodosN > 0 && <p className="text-sm text-violet-700">📍 {nodosN} nodo{nodosN > 1 ? "s" : ""}</p>}
                        {beaconsN > 0 && <p className="text-sm text-violet-700">📡 {beaconsN} beacon{beaconsN > 1 ? "s" : ""}</p>}
                    </div>

                    {nodosN > 1 && (
                        <div className="bg-slate-50 border rounded-lg p-3 space-y-3 mt-2">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alinear</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button onClick={() => handleAlinearSeleccion('y')} variant="outline" size="sm" className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50" title="Iguala la altura (Y)">
                                        <MoveHorizontal className="w-3 h-3 mr-1.5" /> Horizontal
                                    </Button>
                                    <Button onClick={() => handleAlinearSeleccion('x')} variant="outline" size="sm" className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50" title="Iguala la anchura (X)">
                                        <MoveVertical className="w-3 h-3 mr-1.5" /> Vertical
                                    </Button>
                                </div>
                            </div>
                            
                            {nodosN > 2 && (
                                <div className="pt-2 border-t border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Distribuir espacio</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button onClick={() => handleDistribuirSeleccion('x')} variant="outline" size="sm" className="text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50" title="Iguala la distancia horizontal entre nodos">
                                            <MoveHorizontal className="w-3 h-3 mr-1.5" /> En X
                                        </Button>
                                        <Button onClick={() => handleDistribuirSeleccion('y')} variant="outline" size="sm" className="text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50" title="Iguala la distancia vertical entre nodos">
                                            <MoveVertical className="w-3 h-3 mr-1.5" /> En Y
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TABLA DE ATAJOS */}
                    <div className="bg-slate-50 border rounded-lg p-3 text-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-500">
                            <span>Añadir/Quitar</span>
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border">Shift + Clic</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                            <span>Copiar / Pegar</span>
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border">Ctrl + C / V</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                            <span>Cortar</span>
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border">Ctrl + X</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                            <span>Deshacer</span>
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border">Ctrl + Z</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1 pt-1.5 border-t border-slate-200">
                            <span className="text-slate-600">Eliminar selección</span>
                            <span className="font-mono bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">Supr</span>
                        </div>
                    </div>
                    
                    <Button onClick={() => { guardarEnHistorial(); borrarSeleccionados(); }} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2">
                        <Trash2 className="w-4 h-4" /> Eliminar selección ({seleccionados.size})
                    </Button>
                </div>
            );
        }

        if (modo === "poi" && nodoSeleccionadoParaPoi) {
            return (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg border-b pb-2">Configurar POI</h3>
                    <div>
                        <label className="text-xs font-semibold text-slate-600">Nombre *</label>
                        <input type="text" value={poiForm.nombre} onChange={e => setPoiForm({ ...poiForm, nombre: e.target.value })} className="w-full border rounded p-2 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600">Tipo</label>
                        <select value={poiForm.tipo} onChange={e => setPoiForm({ ...poiForm, tipo: e.target.value })} className="w-full border rounded p-2 text-sm mt-1 bg-white">
                            <option value="AULA">Aula</option>
                            <option value="LABORATORIO">Laboratorio</option>
                            <option value="ASEO">Aseo</option>
                            <option value="CAFETERIA">Cafetería</option>
                            <option value="SECRETARIA">Secretaría</option>
                            <option value="BIBLIOTECA">Biblioteca</option>
                            <option value="CONSERJERIA">Conserjería</option>
                            <option value="SALON_ACTOS">Salón de Actos</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-600">Horario</label>
                            <input type="text" value={poiForm.horario || ""} onChange={e => setPoiForm({ ...poiForm, horario: e.target.value })} className="w-full border rounded p-2 text-sm mt-1" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-600">Capacidad</label>
                            <input type="number" value={poiForm.capacidad || ""} onChange={e => setPoiForm({ ...poiForm, capacidad: e.target.value })} className="w-full border rounded p-2 text-sm mt-1" />
                        </div>
                    </div>

                    {poiForm.tipo === 'ASEO' && (
                        <div className="flex items-center gap-2 mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                            <input 
                                type="checkbox" 
                                id="accesible" 
                                checked={poiForm.esAccesible || false} 
                                onChange={e => setPoiForm({ ...poiForm, esAccesible: e.target.checked })} 
                                className="w-4 h-4 cursor-pointer text-blue-600 rounded" 
                            />
                            <label htmlFor="accesible" className="text-sm text-blue-800 font-medium cursor-pointer">
                                Baño adaptado para movilidad reducida
                            </label>
                        </div>
                    )}

                    <div className="pt-4 flex flex-col gap-2">
                        <Button onClick={handleGuardarPoi} className="w-full bg-emerald-600 hover:bg-emerald-700">Guardar POI</Button>
                        {poiForm.id && <Button onClick={handleBorrarPoi} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">Eliminar POI</Button>}
                    </div>
                </div>
            );
        }

        if ((modo === "beacon" || modo === "seleccionar") && beaconSeleccionado && seleccionados.size <= 1) {
            const posBeacon = beacons[beaconSeleccionado];
            return (
                <div className="space-y-4">
                    <h3 className="font-bold text-yellow-800 text-lg border-b border-yellow-200 pb-2">Configurar Beacon</h3>
                    <div>
                        <label className="text-xs font-semibold text-slate-600">Dirección MAC del Beacon *</label>
                        <input type="text" value={beaconFormMac} onChange={e => setBeaconFormMac(e.target.value)} className="w-full border rounded p-2 text-sm mt-1 uppercase font-mono bg-yellow-50" placeholder="Ej: F0:DD:31:0E:CA:81" />
                    </div>
                    {posBeacon && (
                        <div className="bg-slate-50 p-3 rounded-lg border text-xs font-mono text-slate-600 mt-2">
                            <div>X: {posBeacon.x} m</div>
                            <div>Y: {posBeacon.y} m</div>
                        </div>
                    )}
                    <Button onClick={handleGuardarMacBeacon} className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 mt-4 font-semibold">Guardar Dirección MAC</Button>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg border-b pb-2 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" /> Modo: <span className="capitalize text-blue-600">{modo}</span>
                    </h3>
                    
                    <div className="mt-4 text-sm text-slate-600 space-y-2">
                        {modo === "seleccionar" && (
                            <div className="space-y-3 mt-1">
                                <p className="text-xs text-slate-500 mb-2">Interactúa con el plano usando el ratón y los atajos:</p>
                                <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600">Seleccionar varios</span>
                                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-500">Shift + Clic</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600">Copiar / Pegar</span>
                                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-500">Ctrl + C / V</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600">Cortar</span>
                                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-500">Ctrl + X</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600">Deshacer</span>
                                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-500">Ctrl + Z</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-1 pt-1.5 border-t border-slate-200">
                                        <span className="text-slate-600">Eliminar selección</span>
                                        <span className="font-mono bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">Supr</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {modo === "pan" && <p className="text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100">Arrastra el ratón sobre el mapa para desplazarte (Pan).</p>}
                        {modo === "nodo" && <p>Haz clic en el plano para insertar un nodo de ruta nuevo.</p>}
                        {modo === "beacon" && <p className="text-yellow-700 bg-yellow-50 p-2 rounded-md border border-yellow-100">Haz clic para colocar una baliza Bluetooth.</p>}
                        {modo === "conectar" && (!nodoOrigenId ? <div className="bg-indigo-50 border p-3 rounded-lg text-indigo-700">Paso 1: Selecciona nodo origen.</div> : <div className="bg-amber-50 border p-3 rounded-lg text-amber-700">Paso 2: Selecciona nodo destino.</div>)}
                        {modo === "borrar" && <div className="bg-red-50 border p-3 rounded-lg text-red-700">⚠️ Clic en un nodo o beacon para eliminarlo.</div>}
                        {modo === "poi" && <div className="bg-orange-50 border p-3 rounded-lg text-orange-700">Selecciona un nodo para configurar su POI.</div>}
                    </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm mb-2">Estadísticas Totales:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                        <li>📍 {nodos.length} Nodos en esta planta</li>
                        <li>🏫 {pois.length} POIs</li>
                        <li className="text-yellow-700 font-medium flex items-center gap-1.5"><Radio className="w-3.5 h-3.5" /> {Object.keys(beacons).length} Beacons</li>
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className={isFullScreen ? "fixed inset-0 z-50 bg-slate-50 flex flex-col" : "space-y-6 h-[calc(100vh-4rem)] flex flex-col"} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>

            <Dialog open={modalConexionAbierto} onOpenChange={setModalConexionAbierto}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-indigo-600" /> Conectar Escalera / Ascensor
                        </DialogTitle>
                        <DialogDescription>
                            Une este nodo con un nodo de otra planta para crear rutas verticales.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Selecciona la planta de destino</Label>
                            <select value={plantaDestinoId} onChange={(e) => { setPlantaDestinoId(e.target.value); setNodoDestinoId(""); }} className="w-full border rounded-md p-2.5 text-sm outline-none focus:border-indigo-500">
                                <option value="">-- Elige una planta --</option>
                                {edificio?.plantas?.filter((p: any) => p.plantaId !== plantaId).map((p: any) => (
                                    <option key={p.plantaId} value={p.plantaId}>Nivel {p.nivel} - {p.nombre}</option>
                                ))}
                            </select>
                        </div>
                        
                        {plantaDestinoId && (
                            <div className="space-y-2">
                                <Label>Selecciona el nodo destino</Label>
                                <select value={nodoDestinoId} onChange={(e) => setNodoDestinoId(e.target.value)} className="w-full border rounded-md p-2.5 text-sm outline-none focus:border-indigo-500">
                                    <option value="">-- Elige el nodo destino --</option>
                                    {(() => {
                                        const pd = edificio.plantas.find((p: any) => p.plantaId === plantaDestinoId);
                                        if (!pd) return null;
                                        return pd.nodos.map((n: any) => (
                                            <option key={n.id} value={n.id}>Nodo ID: {n.id} (X: {n.position.x}m, Y: {n.position.y}m)</option>
                                        ));
                                    })()}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Selecciona el ID del nodo que corresponde a la escalera o ascensor en la planta de destino.</p>
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setModalConexionAbierto(false)}>Cancelar</Button>
                        <Button onClick={handleConectarPlantas} className="bg-indigo-600 hover:bg-indigo-700" disabled={guardandoConexion || !plantaDestinoId || !nodoDestinoId}>
                            {guardandoConexion ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Crear Enlace Vertical"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex justify-between items-center border-b pb-4 bg-white px-4 pt-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/rutas")} className="text-slate-500">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Salir
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{edificio.nombre}</h1>
                        <p className="text-slate-500 text-sm flex items-center gap-1">
                            <Building2 className="w-3 h-3"/> {planta.nombre}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-lg border mr-2">
                    <Button variant="ghost" size="sm" title="Acercar" onClick={() => setZoom(z => Math.min(z + 0.2, 4))}><ZoomIn className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" title="Alejar" onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))}><ZoomOut className="w-4 h-4" /></Button>
                    <div className="w-px h-6 bg-slate-300 mx-1"></div>
                    <Button variant={modo === "pan" ? "default" : "ghost"} size="sm" title="Mover Mapa (Pan)" onClick={() => cambiarModo("pan")}><Move className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" title="Centrar Mapa" onClick={centrarVista}><Crosshair className="w-4 h-4" /></Button>
                    <Button variant={isFullScreen ? "default" : "ghost"} size="sm" title="Pantalla Completa" onClick={() => setIsFullScreen(!isFullScreen)}><Maximize className="w-4 h-4" /></Button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-lg border">
                    <Button variant="ghost" size="sm" onClick={() => setMostrarGrafo(!mostrarGrafo)} className={`gap-2 ${mostrarGrafo ? "text-blue-600" : "text-slate-400"}`}>
                        <Eye className="w-4 h-4" /> Grafo
                    </Button>
                    <div className="w-px h-6 bg-slate-300 mx-1"></div>
                    <Button variant={modo === "seleccionar" ? "default" : "ghost"} size="sm" onClick={() => cambiarModo("seleccionar")} className="gap-2"><MousePointer className="w-4 h-4" /> Sel</Button>
                    <Button variant={modo === "nodo" ? "default" : "ghost"} size="sm" onClick={() => cambiarModo("nodo")} className="gap-2"><PlusCircle className="w-4 h-4" /> Nodo</Button>
                    <Button variant={modo === "conectar" ? "default" : "ghost"} size="sm" onClick={() => cambiarModo("conectar")} className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"><LinkIcon className="w-4 h-4" /> Conectar</Button>
                    <Button variant={modo === "poi" ? "default" : "ghost"} size="sm" onClick={() => cambiarModo("poi")} className="gap-2 bg-orange-50 text-orange-700 hover:bg-orange-100"><MapPin className="w-4 h-4" /> POIs</Button>
                    <Button variant={modo === "beacon" ? "default" : "ghost"} size="sm" onClick={() => cambiarModo("beacon")} className="gap-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200"><Radio className="w-4 h-4" /> Beacons</Button>
                    <Button variant={modo === "borrar" ? "destructive" : "outline"} size="sm" onClick={() => cambiarModo("borrar")} className="gap-2"><Trash2 className="w-4 h-4" /> Borrar</Button>
                </div>
            </div>

            <div className={`flex-1 flex gap-6 overflow-hidden ${isFullScreen ? 'p-4' : ''}`}>
                <div
                    className="flex-1 bg-slate-100 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] rounded-xl overflow-hidden border relative"
                    onWheel={(e) => {
                        if (modo === "pan" || modo === "seleccionar") {
                            setZoom(z => Math.min(Math.max(0.2, z - e.deltaY * 0.001), 4));
                        }
                    }}
                >
                    <div
                        ref={contenedorRef}
                        onClick={handlePlanoClick}
                        onMouseDown={handlePlanoMouseDown}
                        style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: "0 0" }}
                        className={`absolute origin-top-left bg-white shadow-md select-none ${modo === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`}
                    >
                        {(planta?.imagenMapa || planta?.imagenBase64) ? (
                            <img 
                                src={planta.imagenMapa || planta.imagenBase64} 
                                alt="Plano" 
                                className="block pointer-events-none max-w-none"
                                onLoad={(e) => setImageSize({ width: e.currentTarget.clientWidth, height: e.currentTarget.clientHeight })} 
                            />
                        ) : (
                            <div className="w-[800px] h-[500px] flex items-center justify-center">
                                <span className="text-slate-400 font-mono text-sm bg-white/80 p-2 rounded">[ Sin imagen ]</span>
                            </div>
                        )}

                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {mostrarGrafo && nodos.map(nodo => {
                                const startX = (nodo.position?.x / anchoMetros) * imageSize.width;
                                const startY = (nodo.position?.y / largoMetros) * imageSize.height;
                                
                                return nodo.neighbors?.map((vecinoId: string) => {
                                    const vecino = nodos.find(n => n.id === vecinoId);
                                    if (!vecino?.position) return null;
                                    
                                    const endX = (vecino.position.x / anchoMetros) * imageSize.width;
                                    const endY = (vecino.position.y / largoMetros) * imageSize.height;
                                    
                                    return (
                                        <line 
                                            key={`${nodo.id}-${vecinoId}`} 
                                            x1={startX} 
                                            y1={startY} 
                                            x2={endX} 
                                            y2={endY} 
                                            stroke="#93c5fd" 
                                            strokeWidth={1.5} 
                                            className="pointer-events-none opacity-60" 
                                        />
                                    );
                                });
                            })}

                            {nodos.map((nodo) => {
                                const cxPx = (nodo.position?.x / anchoMetros) * imageSize.width;
                                const cyPx = (nodo.position?.y / largoMetros) * imageSize.height;
                                const isMulti = seleccionados.has(`nodo:${nodo.id}`);
                                const isSingle = !isMulti && (nodo.id === nodoInfo?.id || nodo.id === nodoSeleccionadoParaPoi || nodo.id === nodoOrigenId);
                                const isAny = isMulti || isSingle;

                                const isCrossFloor = nodo.neighbors.some((vecinoId: string) => !nodos.find(n => n.id === vecinoId));

                                return (
                                    <g 
                                        key={nodo.id} 
                                        className={`pointer-events-auto transition-all duration-150 ${modo === "pan" ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`} 
                                        onMouseDown={(e) => modo !== "pan" && handleMouseDownNodo(e, nodo)}
                                    >
                                        {isCrossFloor && (
                                            <circle 
                                                cx={cxPx} 
                                                cy={cyPx} 
                                                r={isAny ? 14 : 8} 
                                                fill="none" 
                                                stroke="#f59e0b" 
                                                strokeWidth={2} 
                                                strokeDasharray="3 2" 
                                                className="animate-spin-slow" 
                                                style={{ animationDuration: '8s' }} 
                                            />
                                        )}
                                        <circle 
                                            cx={cxPx} 
                                            cy={cyPx} 
                                            r={isAny ? 10 : 4}
                                            fill={isMulti ? "#a855f7" : nodo.id === nodoOrigenId ? "#fbbf24" : nodo.id === nodoSeleccionadoParaPoi ? "#f97316" : isSingle ? "#22c55e" : modo === "borrar" ? "#ef4444" : "#3b82f6"}
                                            stroke={isAny ? "#ffffff" : "#1e3a8a"} 
                                            strokeWidth={isAny ? 3 : 1}
                                            style={{ filter: isMulti ? "drop-shadow(0 0 6px rgba(168,85,247,0.8))" : isSingle ? "drop-shadow(0 0 8px rgba(34,197,94,0.9))" : "none" }}
                                        />
                                    </g>
                                );
                            })}

                            {pois.map((poi) => {
                                const nodoPadre = nodos.find(n => n.id === poi.nodoId);
                                if (!nodoPadre?.position) return null;
                                
                                const cxPx = (nodoPadre.position.x / anchoMetros) * imageSize.width;
                                const cyPx = (nodoPadre.position.y / largoMetros) * imageSize.height;
                                const isSel = poi.nodoId === nodoSeleccionadoParaPoi;
                                
                                return (
                                    <circle 
                                        key={poi.id} 
                                        cx={cxPx} 
                                        cy={cyPx} 
                                        r={isSel ? 10 : 5} 
                                        fill={isSel ? "#fb923c" : "#ef4444"} 
                                        stroke={isSel ? "#ffffff" : "none"} 
                                        strokeWidth={isSel ? 4 : 0} 
                                        style={{ filter: isSel ? "drop-shadow(0 0 8px rgba(251,146,60,0.9))" : "none" }} 
                                        className="pointer-events-none transition-all duration-200" 
                                    />
                                );
                            })}

                            {Object.entries(beacons).map(([mac, position]) => {
                                const cxPx = (position.x / anchoMetros) * imageSize.width;
                                const cyPx = (position.y / largoMetros) * imageSize.height;
                                const isMulti = seleccionados.has(`beacon:${mac}`);
                                const isSingle = !isMulti && beaconSeleccionado === mac;
                                const isAny = isMulti || isSingle;
                                
                                return (
                                    <rect 
                                        key={mac} 
                                        x={cxPx - (isAny ? 9 : 5)} 
                                        y={cyPx - (isAny ? 9 : 5)} 
                                        width={isAny ? 18 : 10} 
                                        height={isAny ? 18 : 10} 
                                        rx={isAny ? 4 : 2}
                                        fill={isMulti ? "#a855f7" : isSingle ? "#a855f7" : modo === "borrar" ? "#ef4444" : "#facc15"}
                                        stroke={isAny ? "#ffffff" : "#a16207"} 
                                        strokeWidth={isAny ? 3 : 1.5}
                                        style={{ filter: isAny ? "drop-shadow(0 0 8px rgba(168,85,247,0.8))" : "none" }}
                                        className={`pointer-events-auto transition-all duration-150 ${modo === "pan" ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
                                        onMouseDown={(e) => modo !== "pan" && handleMouseDownBeacon(e, mac)} 
                                    />
                                );
                            })}

                            {rbPx && (
                                <rect 
                                    x={rbPx.x} 
                                    y={rbPx.y} 
                                    width={rbPx.w} 
                                    height={rbPx.h} 
                                    fill="rgba(139,92,246,0.08)" 
                                    stroke="#a855f7" 
                                    strokeWidth={1.5} 
                                    strokeDasharray="5 3" 
                                    className="pointer-events-none" 
                                />
                            )}
                        </svg>
                    </div>
                </div>

                <div className="w-80 bg-white border rounded-xl p-6 shadow-sm overflow-y-auto shrink-0">
                    {renderPanelContextual()}
                </div>
            </div>
        </div>
    );
}