// Script interactivo para actualizar contraseña de cualquier usuario
// Uso: node change-password.js <email> <nueva_contraseña>

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function changePassword(email, newPassword) {
  try {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullname: true, role: true, status: true }
    });
    
    if (!user) {
      console.error('❌ Usuario no encontrado:', email);
      process.exit(1);
    }
    
    console.log('📋 Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.fullname}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Estado: ${user.status}`);
    console.log('');
    
    // Hashear la nueva contraseña
    console.log('🔐 Hasheando nueva contraseña...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar en la base de datos
    await prisma.user.update({
      where: { email },
      data: { currentPassword: hashedPassword }
    });
    
    console.log('✅ ¡Contraseña actualizada exitosamente!');
    console.log('');
    console.log('📝 Nuevas credenciales:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${newPassword}`);
    console.log('');
    console.log('🔗 Puedes iniciar sesión en: http://localhost:3000/seguridad/identificacion-usuario');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener argumentos de línea de comandos
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('❌ Uso incorrecto');
  console.log('');
  console.log('📖 Uso:');
  console.log('   node change-password.js <email> <nueva_contraseña>');
  console.log('');
  console.log('📝 Ejemplo:');
  console.log('   node change-password.js usuario@example.com MiNuevaPass123');
  console.log('');
  process.exit(1);
}

changePassword(email, password);
