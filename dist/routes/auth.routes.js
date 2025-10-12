"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const refreshToken_middleware_1 = require("../middleware/refreshToken.middleware");
const emailConfig_1 = require("../config/emailConfig");
const router = (0, express_1.Router)();
//  RUTA TEMPORAL PARA DEBUG 
router.post('/debug-email', async (req, res) => {
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
        await (0, emailConfig_1.sendVerificationEmail)(email, "Usuario Test", "999999");
        console.log('✅ [DEBUG] Email enviado exitosamente');
        res.json({
            success: true,
            message: ' Email de prueba enviado correctamente',
            to: email
        });
    }
    catch (error) {
        console.error(' [DEBUG] Error enviando email:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Revisa configuración SMTP'
        });
    }
});
router.post('/seguridad/registro-publico-usuarios', auth_controller_1.registerPublicUser);
//router.post('/register', register);
router.post('/login', auth_controller_1.login);
router.post('/verify-email', auth_controller_1.verifyEmail);
router.post('/resend-verification', auth_controller_1.resendVerification);
router.post('/logout', auth_middleware_1.authenticateToken, auth_controller_1.logout);
router.get('/profile', auth_middleware_1.authenticateToken, auth_controller_1.getProfile);
router.post('/refresh-token', refreshToken_middleware_1.refreshTokenMiddleware, auth_controller_1.refreshToken);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map