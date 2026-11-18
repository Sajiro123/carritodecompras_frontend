export interface CalculoEnvio {
  costoEnvio: number;
  gratis: boolean;
  umbralGratis: number;
  subtotal: number;
  faltanteParaGratis: number;
  porcentajeGratis: number;
  mensaje: string;
  zona: string;
  diasEntrega: string;
}

export interface Tienda {
  id: number;
  nombre: string;
  direccion: string;
  distrito: string;
  departamento: string;
  telefono: string | null;
  horario: string;
  activo: boolean;
}

export interface AgenciaEnvio {
  id: number;
  empresa: string;
  nombre: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  telefono: string | null;
  activo: boolean;
}
