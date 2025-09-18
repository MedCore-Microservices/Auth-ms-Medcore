
// Payload para el ACCESS TOKEN (contiene toda la info del usuario)
export interface AccessTokenPayload {
  userId: number;
  email: string;
  role: string;
}

// Payload para el REFRESH TOKEN (solo contiene el ID, por seguridad)
export interface RefreshTokenPayload {
  userId: number;
}

// Tipo unificado para la declaración global
// Puede ser AccessTokenPayload, RefreshTokenPayload, o undefined
export type JwtUserPayload = AccessTokenPayload | RefreshTokenPayload | undefined;