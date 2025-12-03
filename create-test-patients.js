const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestPatients() {
  try {
    console.log('Ìø• Creando pacientes de prueba...\n');

    const patients = [
      {
        email: 'maria.rodriguez@email.com',
        fullname: 'Mar√≠a Rodr√≠guez Garc√≠a',
        identificationNumber: 'CC1234567890',
        phone: '3201234567',
        dateOfBirth: new Date('1985-03-15'),
        age: 40,
        gender: 'Femenino',
        bloodType: 'O+',
        allergies: 'Penicilina, Polen',
        chronicDiseases: 'Hipertensi√≥n arterial',
        emergencyContact: 'Juan Rodr√≠guez - 3209876543',
        currentPassword: await bcrypt.hash('12345678', 10),
        role: 'PACIENTE',
        status: 'ACTIVE'
      },
      {
        email: 'carlos.mendez@email.com',
        fullname: 'Carlos Andr√©s M√©ndez Torres',
        identificationNumber: 'CC9876543210',
        phone: '3159876543',
        dateOfBirth: new Date('1978-07-22'),
        age: 47,
        gender: 'Masculino',
        bloodType: 'A-',
        allergies: 'Aspirina, Mariscos',
        chronicDiseases: 'Diabetes tipo 2',
        emergencyContact: 'Ana M√©ndez - 3157654321',
        currentPassword: await bcrypt.hash('12345678', 10),
        role: 'PACIENTE',
        status: 'ACTIVE'
      },
      {
        email: 'sofia.martinez@email.com',
        fullname: 'Sof√≠a Mart√≠nez L√≥pez',
        identificationNumber: 'CC5678901234',
        phone: '3187654321',
        dateOfBirth: new Date('1992-11-08'),
        age: 33,
        gender: 'Femenino',
        bloodType: 'B+',
        allergies: null,
        chronicDiseases: null,
        emergencyContact: 'Pedro Mart√≠nez - 3186543210',
        currentPassword: await bcrypt.hash('12345678', 10),
        role: 'PACIENTE',
        status: 'ACTIVE'
      }
    ];

    for (const patient of patients) {
      const created = await prisma.user.create({
        data: patient
      });

      console.log(`‚úÖ Paciente creado:`);
      console.log(`   ID: ${created.id}`);
      console.log(`   Nombre: ${created.fullname}`);
      console.log(`   Email: ${created.email}`);
      console.log(`   Documento: ${created.identificationNumber}`);
      console.log(`   Contrase√±a: 12345678`);
      console.log('');
    }

    console.log('Ìæâ ¬°3 pacientes de prueba creados exitosamente!\n');
    console.log('Ì≥ã Resumen:');
    console.log('   Todos los pacientes tienen la contrase√±a: 12345678');
    console.log('   Rol: PACIENTE');
    console.log('   Estado: ACTIVE');

  } catch (error) {
    console.error('‚ùå Error:', error.message);
    if (error.code === 'P2002') {
      console.error('   Uno de los emails o documentos ya existe en la base de datos');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestPatients();
