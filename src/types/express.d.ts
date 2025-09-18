
import { JwtUserPayload } from './jwt.types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload; // Tipo unificado
    }
  }
}


export {};