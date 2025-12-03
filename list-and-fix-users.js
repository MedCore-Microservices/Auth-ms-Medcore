// Script para listar y actualizar usuarios
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function listAndFixUsers() {
  try {
    // Listar todos los usuarios
    console.log('📋 Buscando usuarios...\n');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        status: true,
        currentPassword: true
      }
    });
    
    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios');
      return;
    }
    
    console.log(`✅ Se encontraron ${users.length} usuario(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.fullname}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Estado: ${user.status}`);
      console.log(`   Hash actual: ${user.currentPassword.substring(0, 20)}...`);
      console.log('');
    });
    
    // Buscar el usuario de Lorenzo
    const targetUser = users.find(u => u.email.includes('lorenzo') || u.email.includes('1701611861'));
    
    if (targetUser) {
      console.log('🎯 Usuario objetivo encontrado!\n');
      
      const newPassword = '12345678';
      console.log(`🔐 Actualizando contraseña a: "${newPassword}"`);
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { 
          currentPassword: hashedPassword,
          status: 'ACTIVE'
        }
      });
      
      console.log('✅ ¡Contraseña actualizada exitosamente!\n');
      console.log('📝 Nuevas credenciales:');
      console.log(`   Email: ${targetUser.email}`);
      console.log(`   Contraseña: ${newPassword}`);
      console.log(`   Estado: ACTIVE`);
      console.log('\n🔗 Login: http://localhost:3000/seguridad/identificacion-usuario');
      
      // Verificar
      const isValid = await bcrypt.compare(newPassword, hashedPassword);
      console.log(`\n🧪 Verificación: ${isValid ? '✅ CORRECTA' : '❌ INCORRECTA'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listAndFixUsers();
