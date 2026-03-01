/**
 * Script para analizar duplicados en la base de datos ANTES de limpiar
 * Muestra qué DNIs y emails están duplicados
 */

const API_URL = 'http://localhost:3000/api/rrhh/employees';

async function analyzeDuplicates() {
    try {
        console.log('🔍 Analizando empleados en la base de datos...\n');

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Aquí deberías agregar tu token de autenticación si es necesario
            }
        });

        if (!response.ok) {
            console.error('❌ Error obteniendo empleados');
            return;
        }

        const employees = await response.json();
        console.log(`📊 Total de empleados: ${employees.length}\n`);

        // Analizar DNIs duplicados
        const dniMap = new Map();
        const emailMap = new Map();

        employees.forEach(emp => {
            if (emp.dni) {
                const list = dniMap.get(emp.dni) || [];
                list.push(emp);
                dniMap.set(emp.dni, list);
            }
            if (emp.email) {
                const list = emailMap.get(emp.email) || [];
                list.push(emp);
                emailMap.set(emp.email, list);
            }
        });

        // Mostrar DNIs duplicados
        console.log('🔴 DNIs DUPLICADOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        let dniDuplicates = 0;
        for (const [dni, list] of dniMap.entries()) {
            if (list.length > 1) {
                dniDuplicates++;
                console.log(`\n${dni} (${list.length} registros):`);
                list.forEach((emp, index) => {
                    console.log(`  ${index + 1}. ${emp.name || 'Sin nombre'}`);
                    console.log(`     ID: ${emp.id}`);
                    console.log(`     Email: ${emp.email || 'N/A'}`);
                    console.log(`     Creado: ${emp.createdAt || 'N/A'}`);
                });
            }
        }
        if (dniDuplicates === 0) {
            console.log('✅ No hay DNIs duplicados');
        } else {
            console.log(`\n⚠️  Total de DNIs con duplicados: ${dniDuplicates}`);
        }

        // Mostrar Emails duplicados
        console.log('\n\n🔴 EMAILS DUPLICADOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        let emailDuplicates = 0;
        for (const [email, list] of emailMap.entries()) {
            if (list.length > 1) {
                emailDuplicates++;
                console.log(`\n${email} (${list.length} registros):`);
                list.forEach((emp, index) => {
                    console.log(`  ${index + 1}. ${emp.name || 'Sin nombre'}`);
                    console.log(`     ID: ${emp.id}`);
                    console.log(`     DNI: ${emp.dni || 'N/A'}`);
                    console.log(`     Creado: ${emp.createdAt || 'N/A'}`);
                });
            }
        }
        if (emailDuplicates === 0) {
            console.log('✅ No hay emails duplicados');
        } else {
            console.log(`\n⚠️  Total de emails con duplicados: ${emailDuplicates}`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📋 Resumen:`);
        console.log(`   Total empleados: ${employees.length}`);
        console.log(`   DNIs con duplicados: ${dniDuplicates}`);
        console.log(`   Emails con duplicados: ${emailDuplicates}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analyzeDuplicates();
