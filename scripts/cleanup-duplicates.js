/**
 * Script para limpiar duplicados en la base de datos de empleados
 * Ejecuta el endpoint de limpieza y muestra los resultados
 */

const API_URL = 'http://localhost:3000/api/rrhh/maintenance/cleanup-duplicates';

async function cleanupDuplicates() {
    try {
        console.log('🚀 Iniciando limpieza de duplicados...\n');

        // Necesitarás obtener un token válido de autenticación
        // Por ahora, haremos el request directo
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Aquí deberías agregar tu token de autenticación
                // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error:', errorData);
            return;
        }

        const result = await response.json();
        console.log('✅ Limpieza completada\n');
        console.log('📊 Resultados:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Total eliminados: ${result.deleted}`);
        console.log(`Por DNI duplicado: ${result.details.deletedByDni}`);
        console.log(`Por Email duplicado: ${result.details.deletedByEmail}`);
        console.log('\n📝 Detalles de registros eliminados:');

        if (result.details.records && result.details.records.length > 0) {
            result.details.records.forEach((record, index) => {
                console.log(`\n${index + 1}. ${record.reason}`);
                console.log(`   Nombre: ${record.name}`);
                console.log(`   DNI: ${record.dni || 'N/A'}`);
                console.log(`   Email: ${record.email || 'N/A'}`);
                console.log(`   ID eliminado: ${record.id}`);
                console.log(`   ID conservado: ${record.kept}`);
            });
        } else {
            console.log('   ✨ No se encontraron duplicados');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n${result.message}`);

    } catch (error) {
        console.error('❌ Error ejecutando la limpieza:', error.message);
    }
}

cleanupDuplicates();
