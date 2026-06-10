import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import DashboardLayout from "./pages/DashboardLayout"
import Usuarios from "./pages/Usuarios"
import Mapas from "./pages/Mapas"
import PlantasEdificio from "./pages/PlantasEdificios" 
import EditorPlanta from "./pages/EditorPlanta"
import GestionAsignaturas from "./pages/GestionAsignaturas"
import SesionesAsignatura from "./pages/SesionesAsignatura"
import SelectorRutas from "./pages/SelectorRutas"
import CalendarioAcademico from "./pages/CalendarioAcademico"
import Login from "./pages/Login"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === RUTA PÚBLICA === */}
        <Route path="/login" element={<Login />} />
        
        {/* Redirección por defecto a usuarios */}
        <Route path="/" element={<Navigate to="/usuarios" replace />} />
        
        {/* === RUTAS PROTEGIDAS (Requieren inicio de sesión) === */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Gestión */}
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/mapas" element={<Mapas />} />
            <Route path="/mapas/:mapaId" element={<PlantasEdificio />} />
            
            {/* Académico */}
            <Route path="/asignaturas" element={<GestionAsignaturas />} />
            <Route path="/asignaturas/:asignaturaId/sesiones" element={<SesionesAsignatura />} />
            <Route path="/calendario" element={<CalendarioAcademico />} />
            
            {/* Herramientas de Cartografía */}
            <Route path="/rutas" element={<SelectorRutas />} />
            <Route path="/rutas/:mapaId/editor/:plantaId" element={<EditorPlanta />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App