import axios from 'axios';

// Configuración base apuntando a tu servidor Node.js
const API = axios.create({
  baseURL: 'https://tfg-controluma.onrender.com/api',
});

//INTERCEPTOR DE SEGURIDAD
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken'); // Lee el token guardado en el Login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Se lo inyecta a TODAS las peticiones
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (credenciales: { idUsuario: string; password: string }) => {
    const respuesta = await API.post('/auth/login', credenciales);
    return respuesta.data;
  }
};

// Servicio para interactuar con las rutas de usuario/horarios
export const usuarioService = {
  getPerfil: async (idUsuario: string) => {
    const respuesta = await API.get(`/horarios/usuarios/${idUsuario}`);
    return respuesta.data;
  },

  getTodosUsuarios: async () => {
    const respuesta = await API.get('/usuario/todos');
    return respuesta.data;
  },

  crearUsuario: async (datos: any) => {
    const respuesta = await API.post('/usuario', datos);
    return respuesta.data;
  },

  editarUsuario: async (idUsuario: string, datos: any) => {
    const respuesta = await API.put(`/usuario/${idUsuario}`, datos);
    return respuesta.data;
  },

  eliminarUsuario: async (idUsuario: string) => {
    const respuesta = await API.delete(`/usuario/${idUsuario}`);
    return respuesta.data;
  }
};

// Servicio para mapas
export const mapaService = {
  getListaMapas: async () => {
    const respuesta = await API.get('/mapas');
    return respuesta.data;
  },
  getMapaId: async (id: string) => {
    const respuesta = await API.get(`/mapas/${id}`);
    return respuesta.data;
  },

  crearMapa: async (datos: any) => {
    const respuesta = await API.post('/mapas', datos);
    return respuesta.data;
  },
  
  editarMapa: async (id: string, datos: any) => {
    const respuesta = await API.put(`/mapas/${id}`, datos);
    return respuesta.data;
  },
  
  eliminarMapa: async (id: string) => {
    const respuesta = await API.delete(`/mapas/${id}`);
    return respuesta.data;
  },
  
  guardarNodos: async (mapaId: string, plantaId: string, nodos: any[]) => {
    const respuesta = await API.put(`/mapas/${mapaId}/plantas/${plantaId}/nodos`, { nodos });
    return respuesta.data;
  },

  crearPlanta: async (mapaId: string, datosPlanta: any) => {
    const respuesta = await API.post(`/mapas/${mapaId}/plantas`, datosPlanta);
    return respuesta.data;
  },

  eliminarPlanta: async (mapaId: string, plantaId: string) => {
    const respuesta = await API.delete(`/mapas/${mapaId}/plantas/${plantaId}`);
    return respuesta.data;
  },
  
  guardarPois: async (mapaId: string, plantaId: string, pois: any[]) => {
    const respuesta = await API.put(`/mapas/${mapaId}/plantas/${plantaId}/pois`, { pois });
    return respuesta.data;
  },
  
  guardarBeacons: async (mapaId: string, plantaId: string, beacons: any) => {
    const respuesta = await API.put(`/mapas/${mapaId}/plantas/${plantaId}/beacons`, { beacons });
    return respuesta.data;
  }
};

export const horarioService = {
  getAsignaturas: async () => {
    const respuesta = await API.get('/horarios/asignaturas');
    return respuesta.data;
  },
  
  getSesionesAsignatura: async (id: string) => {
    const respuesta = await API.get(`/horarios/asignaturas/${id}/sesiones`);
    return respuesta.data;
  },

  crearAsignatura: async (datos: any) => {
    const respuesta = await API.post('/horarios/asignaturas', datos);
    return respuesta.data;
  },

  editarAsignatura: async (id: string, datos: any) => {
    const respuesta = await API.put(`/horarios/asignaturas/${id}`, datos);
    return respuesta.data;
  },

  eliminarAsignatura: async (id: string) => {
    const respuesta = await API.delete(`/horarios/asignaturas/${id}`);
    return respuesta.data;
  },

  crearSesion: async (datos: any) => {
    const respuesta = await API.post('/horarios/sesion/crear', datos);
    return respuesta.data;
  },

  editarSesion: async (id: string, datos: any) => {
    const respuesta = await API.put(`/horarios/sesiones/${id}`, datos);
    return respuesta.data;
  },

  eliminarSesion: async (id: string) => {
    const respuesta = await API.delete(`/horarios/sesiones/${id}`);
    return respuesta.data;
  }
};