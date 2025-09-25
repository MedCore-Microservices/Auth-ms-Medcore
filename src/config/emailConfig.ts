import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      
    pass: process.env.EMAIL_PASS,      
  },
});

// Función para enviar correo de bienvenida
export const sendVerificationEmail = async (
  to: string,
  fullname: string,
  code: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Verifica tu cuenta en MedCore',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>¡Hola ${fullname}!</h2>
        <p>Gracias por registrarte en <strong>MedCore</strong>.</p>
        <p>Tu código de verificación es:</p>
        <div style="font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center;">
          ${code}
        </div>
        <p>Este código expira en 10 minutos.</p>
        <p>Equipo de MedCore</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};