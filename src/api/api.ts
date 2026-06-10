import axios from 'axios';

// Configuración base apuntando a tu servidor Node.js
const API = axios.create({
  baseURL: 'https://tfg-controluma.onrender.com/api',
});

// Servicio para interactuar con las rutas de usuario/horarios
export const usuarioService = {
  getPerfil: async (idUsuario: string) => {
    const respuesta = await API.get(`/horarios/usuarios/${idUsuario}`);
    return respuesta.data;
  },
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
  }
};