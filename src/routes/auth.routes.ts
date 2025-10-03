
import { Router } from 'express';
import { getProfile, login, logout, refreshToken, register, registerPublicUser, resendVerification, verifyEmail } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { refreshTokenMiddleware } from '../middleware/refreshToken.middleware';
import { sendVerificationEmail } from '../config/emailConfig'; 
import { Request, Response } from 'express';

const router = Router();


//  RUTA TEMPORAL PARA DEBUG 
router.post('/debug-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email es requerido' 
      });
    }
    
    console.log('🧪 [DEBUG] ==================================');
    console.log('🧪 [DEBUG] Probando email a:', email);
    console.log('🧪 [DEBUG] SMTP_USER:', process.env.SMTP_USER || 'NO CONFIGURADO');
    console.log('🧪 [DEBUG] ==================================');
    
    await sendVerificationEmail(email, "Usuario Test", "999999");
    
    console.log('✅ [DEBUG] Email enviado exitosamente');
    
    res.json({ 
      success: true, 
      message: ' Email de prueba enviado correctamente',
      to: email
    });
  } catch (error: any) {
    console.error(' [DEBUG] Error enviando email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Revisa configuración SMTP'
    });
  }
});
router.post('/seguridad/registro-publico-usuarios', registerPublicUser);
//router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail); 
router.post('/resend-verification', resendVerification); 
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.post('/refresh-token', refreshTokenMiddleware, refreshToken);
export default router;