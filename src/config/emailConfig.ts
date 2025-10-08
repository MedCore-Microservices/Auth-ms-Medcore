import nodemailer from 'nodemailer';

// === DEBUG CRÍTICO ===
console.log('🔧 [EMAIL DEBUG] SMTP_USER:', process.env.SMTP_USER || 'NO CONFIGURADO');
console.log('🔧 [EMAIL DEBUG] SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('🔧 [EMAIL DEBUG] NODE_ENV:', process.env.NODE_ENV);
// === FIN DEBUG ===

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

if (process.env.NODE_ENV !== 'test') {
  transporter.verify((error, success) => {
    if (error) {
      console.error(' [EMAIL] Error conexión SMTP:', error);
    } else {
      console.log(' [EMAIL] Servidor SMTP listo para enviar');
    }
  });
}


export const sendVerificationEmail = async (
  to: string,
  fullname: string,
  code: string
): Promise<void> => {
  const mailOptions = {
    from: `MedCore <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verifica tu cuenta en MedCore - Código de Verificación',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu cuenta - MedCore</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">MedCore</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestión Médica</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">¡Hola ${fullname}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Gracias por registrarte en <strong style="color: #667eea;">MedCore</strong>. 
                Para completar tu registro y activar tu cuenta, necesitas verificar tu dirección de correo electrónico.
            </p>
            
            <!-- Code Box -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 15px 0; font-size: 16px; opacity: 0.9;">Tu código de verificación es:</p>
                <div style="font-size: 42px; font-weight: bold; letter-spacing: 8px; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; display: inline-block; min-width: 200px;">
                    ${code}
                </div>
                <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.8;">
                    ⏳ Este código expira en 10 minutos
                </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                    💡 <strong>Consejo:</strong> Introduce este código en la aplicación para activar tu cuenta. 
                    Si no solicitaste este registro, por favor ignora este mensaje.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
                Equipo de MedCore<br>
                <span style="font-size: 12px;">Sistema de gestión médica integral</span>
            </p>
            <p style="margin: 10px 0 0 0; color: #adb5bd; font-size: 12px;">
                © 2024 MedCore. Todos los derechos reservados.
            </p>
        </div>
    </div>
</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
};