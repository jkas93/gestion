import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Inicializar Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });
}

const db = admin.firestore();

// Datos de muestra realistas (nombres peruanos)
const sampleEmployees = [
    {
        id: 'emp001',
        name: 'Carlos Ramírez Vega',
        email: 'carlos.ramirez@goldentower.pe',
        role: 'GERENTE',
        dni: '45678912',
        phone: '+51 987 654 321',
        salary: 8500.00,
        hireDate: '2022-03-15',
        address: 'Av. Javier Prado 1234, San Isidro, Lima',
        emailVerified: true,
    },
    {
        id: 'emp002',
        name: 'María Fernanda Torres',
        email: 'maria.torres@goldentower.pe',
        role: 'PMO',
        dni: '47856234',
        phone: '+51 965 234 876',
        salary: 6500.00,
        hireDate: '2022-06-10',
        address: 'Calle Las Begonias 567, San Isidro, Lima',
        emailVerified: true,
    },
    {
        id: 'emp003',
        name: 'Luis Alberto Mendoza',
        email: 'luis.mendoza@goldentower.pe',
        role: 'COORDINADOR',
        dni: '43652178',
        phone: '+51 945 678 234',
        salary: 5200.00,
        hireDate: '2023-01-20',
        address: 'Av. Arequipa 2345, Lince, Lima',
        emailVerified: true,
    },
    {
        id: 'emp004',
        name: 'Carmen Rosa Flores',
        email: 'carmen.flores@goldentower.pe',
        role: 'RRHH',
        dni: '46123789',
        phone: '+51 932 456 789',
        salary: 4800.00,
        hireDate: '2023-03-12',
        address: 'Jr. Miraflores 456, Miraflores, Lima',
        emailVerified: true,
    },
    {
        id: 'emp005',
        name: 'Jorge Enrique Castillo',
        email: 'jorge.castillo@goldentower.pe',
        role: 'SIG',
        dni: '45789234',
        phone: '+51 921 345 678',
        salary: 5500.00,
        hireDate: '2023-05-08',
        address: 'Av. La Marina 789, Pueblo Libre, Lima',
        emailVerified: true,
    },
    {
        id: 'emp006',
        name: 'Andrea Patricia Quispe',
        email: 'andrea.quispe@goldentower.pe',
        role: 'CALIDAD',
        dni: '48234567',
        phone: '+51 956 789 123',
        salary: 4500.00,
        hireDate: '2023-07-15',
        address: 'Calle Los Cedros 234, Surco, Lima',
        emailVerified: true,
    },
    {
        id: 'emp007',
        name: 'Roberto Carlos Díaz',
        email: 'roberto.diaz@goldentower.pe',
        role: 'COORDINADOR',
        dni: '44567891',
        phone: '+51 978 123 456',
        salary: 5000.00,
        hireDate: '2023-09-01',
        address: 'Av. República de Panamá 567, Surco, Lima',
        emailVerified: true,
    },
    {
        id: 'emp008',
        name: 'Sofía Alejandra Herrera',
        email: 'sofia.herrera@goldentower.pe',
        role: 'ASISTENTE',
        dni: '47234568',
        phone: '+51 934 567 891',
        salary: 2800.00,
        hireDate: '2024-01-10',
        address: 'Jr. Las Flores 123, Jesús María, Lima',
        emailVerified: true,
    },
    {
        id: 'emp009',
        name: 'Miguel Ángel Rojas',
        email: 'miguel.rojas@goldentower.pe',
        role: 'ASISTENTE',
        dni: '46345678',
        phone: '+51 923 678 912',
        salary: 2600.00,
        hireDate: '2024-02-15',
        address: 'Av. Brasil 456, Breña, Lima',
        emailVerified: true,
    },
    {
        id: 'emp010',
        name: 'Valeria Lucía Paredes',
        email: 'valeria.paredes@goldentower.pe',
        role: 'ASISTENTE',
        dni: '48567123',
        phone: '+51 945 234 789',
        salary: 2700.00,
        hireDate: '2024-03-01',
        address: 'Calle San Martín 789, Magdalena, Lima',
        emailVerified: false,
        status: 'INVITADO' // Usuario pendiente
    },
];

async function seedDatabase() {
    console.log('🌱 Iniciando población de base de datos con datos de muestra...\n');

    try {
        // Limpiar datos existentes (opcional)
        console.log('🗑️  Limpiando datos existentes...');
        const usersSnapshot = await db.collection('users').get();
        const employeesSnapshot = await db.collection('employees').get();

        const deleteBatch = db.batch();
        usersSnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        employeesSnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
        console.log('✅ Datos existentes eliminados\n');

        // Agregar nuevos datos
        console.log('📝 Agregando empleados de muestra...\n');

        for (const emp of sampleEmployees) {
            const { id, emailVerified, salary, hireDate, ...userData } = emp as any;

            // 1. Crear usuario (cuenta de acceso)
            await db.collection('users').doc(id).set({
                ...userData,
                emailVerified,
                status: userData.status || 'ACTIVO',
                createdAt: new Date().toISOString(),
            });
            console.log(`✅ Usuario creado: ${emp.name} (${emp.role})`);

            // 2. Crear ficha laboral completa (excepto para usuarios pendientes)
            if (emailVerified) {
                await db.collection('employees').doc(id).set({
                    id,
                    name: emp.name,
                    email: emp.email,
                    dni: emp.dni,
                    phone: emp.phone,
                    salary,
                    hireDate,
                    address: emp.address,
                    role: emp.role,
                    createdAt: new Date().toISOString(),
                });
                console.log(`   └─ Ficha laboral creada con salario S/ ${salary.toFixed(2)}`);
            } else {
                console.log(`   └─ Sin ficha laboral (usuario pendiente)`);
            }
            console.log('');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Base de datos poblada exitosamente!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📊 Total de empleados: ${sampleEmployees.length}`);
        console.log(`   ├─ Con ficha laboral: ${sampleEmployees.filter(e => e.emailVerified).length}`);
        console.log(`   └─ Pendientes: ${sampleEmployees.filter(e => !e.emailVerified).length}`);
        console.log('\n✨ Ahora puedes probar la aplicación en http://localhost:3000/dashboard/rrhh\n');

    } catch (error) {
        console.error('❌ Error al poblar la base de datos:', error);
        throw error;
    }
}

// Ejecutar script
seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
