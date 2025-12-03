// Script para verificar y actualizar el usuario
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixUser() {
  try {
    // Buscar el usuario con ID 1701688945
    const user = await prisma.user.findUnique({
      where: { id: 1701688945 }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('📋 Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: "${user.email}"`);
    console.log(`   Nombre: ${user.fullname}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Estado: ${user.status}`);
    console.log('');
    
    // Nueva contraseña
    const newPassword = '12345678';
    console.log(`🔐 Generando hash para contraseña: "${newPassword}"`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`🔑 Hash generado: ${hashedPassword}`);
    console.log('');
    
    // Actualizar
    await prisma.user.update({
      where: { id: 1701688945 },
      data: { 
        currentPassword: hashedPassword,
        status: 'ACTIVE' // Asegurar que esté activo
      }
    });
    
    console.log('✅ ¡Contraseña actualizada exitosamente!');
    console.log('');
    console.log('📝 Credenciales de login:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Contraseña: ${newPassword}`);
    console.log('');
    
    // Verificar que funcione
    console.log('🧪 Probando la contraseña...');
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`   Verificación: ${isValid ? '✅ CORRECTA' : '❌ INCORRECTA'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
