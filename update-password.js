// Script para actualizar la contraseña de un usuario
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updatePassword() {
  const email = 'lorenzo.1701611861@ucaldas.edu.co';
  const newPassword = '12345678';
  
  try {
    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar en la base de datos
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { currentPassword: hashedPassword }
    });
    
    console.log('✅ Contraseña actualizada exitosamente');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Nueva contraseña: ${newPassword}`);
    console.log(`🔑 Hash: ${hashedPassword}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
