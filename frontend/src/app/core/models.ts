export interface User {
  id: string;
  empresa_id: string | null;
  nombre: string;
  correo: string;
  telefono?: string | null;
  email_verificado: boolean;
  estado: string;
  rol: string;
  sucursal_id?: string | null;
  ultimo_acceso?: string | null;
  created_at?: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  usuario: User;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterResponse {
  mensaje: string;
  usuario_id: string;
  empresa_id: string;
  email_verificado: boolean;
  verification_token?: string | null;
}

export interface VerifyEmailResponse {
  mensaje: string;
  usuario_id: string;
  empresa_id: string;
}

export interface ApiError {
  detail?: {
    code?: string;
    message?: string;
  };
}
