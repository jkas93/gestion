/**
 * Script administrativo para análisis y limpieza de duplicados
 * Ejecutar con: node scripts/admin-duplicates.mjs
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync('./apps/api/src/config/serviceAccountKey.json', 'utf-8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function analyzeDuplicates() {
    console.log('🔍 Analizando empleados en la base de datos...\n');

    const snapshot = await firestore.collection('employees').get();
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`📊 Total de empleados: ${employees.length}\n`);

    const dniMap = new Map();
    const emailMap = new Map();

    // Agrupar por DNI y Email
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

    // Analizar DNIs duplicados
    console.log('🔴 DNIs DUPLICADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    let dniDuplicates = 0;
    let totalDniRecordsToDelete = 0;

    for (const [dni, list] of dniMap.entries()) {
        if (list.length > 1) {
            dniDuplicates++;
            totalDniRecordsToDelete += (list.length - 1);
            console.log(`\n${dni} (${list.length} registros - se eliminarán ${list.length - 1}):`);

            // Ordenar por createdAt para mostrar cuál se mantendría
            list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

            list.forEach((emp, index) => {
                const status = index === 0 ? '✅ MANTENER' : '❌ ELIMINAR';
                console.log(`  ${status} - ${emp.name || 'Sin nombre'}`);
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
        console.log(`⚠️  Registros a eliminar: ${totalDniRecordsToDelete}`);
    }

    // Analizar Emails duplicados
    console.log('\n\n🔴 EMAILS DUPLICADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    let emailDuplicates = 0;
    let totalEmailRecordsToDelete = 0;

    for (const [email, list] of emailMap.entries()) {
        if (list.length > 1) {
            emailDuplicates++;
            totalEmailRecordsToDelete += (list.length - 1);
            console.log(`\n${email} (${list.length} registros - se eliminarán ${list.length - 1}):`);

            // Ordenar por createdAt
            list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

            list.forEach((emp, index) => {
                const status = index === 0 ? '✅ MANTENER' : '❌ ELIMINAR';
                console.log(`  ${status} - ${emp.name || 'Sin nombre'}`);
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
        console.log(`\n⚠️  Registros a eliminar: ${totalEmailRecordsToDelete}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📋 Resumen:`);
    console.log(`   Total empleados: ${employees.length}`);
    console.log(`   DNIs con duplicados: ${dniDuplicates}`);
    console.log(`   Emails con duplicados: ${emailDuplicates}`);
    console.log(`   Total a eliminar: ${totalDniRecordsToDelete + totalEmailRecordsToDelete}`);

    return {
        hasDuplicates: dniDuplicates > 0 || emailDuplicates > 0,
        dniDuplicates,
        emailDuplicates,
        totalToDelete: totalDniRecordsToDelete + totalEmailRecordsToDelete
    };
}

async function cleanupDuplicates() {
    console.log('\n🧹 Ejecutando limpieza de duplicados...\n');

    const snapshot = await firestore.collection('employees').get();
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const dniMap = new Map();
    const emailMap = new Map();
    const deletedIds = new Set();

    let deletedByDni = 0;
    let deletedByEmail = 0;
    const details = [];

    // Agrupar
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

    // Procesar DNI duplicados
    for (const [dni, list] of dniMap.entries()) {
        if (list.length > 1) {
            list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            const toKeep = list[0];
            const toDelete = list.slice(1);

            for (const emp of toDelete) {
                if (!deletedIds.has(emp.id)) {
                    await firestore.collection('employees').doc(emp.id).delete();
                    deletedIds.add(emp.id);
                    deletedByDni++;
                    details.push({
                        reason: 'DNI duplicado',
                        dni: emp.dni,
                        email: emp.email,
                        name: emp.name || 'Sin nombre',
                        id: emp.id,
                        kept: toKeep.id
                    });
                    console.log(`🗑️  DNI: Eliminado ${emp.dni} (${emp.name}) - ID: ${emp.id}`);
                }
            }
        }
    }

    // Procesar Email duplicados
    for (const [email, list] of emailMap.entries()) {
        const activeList = list.filter(emp => !deletedIds.has(emp.id));

        if (activeList.length > 1) {
            activeList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            const toKeep = activeList[0];
            const toDelete = activeList.slice(1);

            for (const emp of toDelete) {
                await firestore.collection('employees').doc(emp.id).delete();
                deletedIds.add(emp.id);
                deletedByEmail++;
                details.push({
                    reason: 'Email duplicado',
                    dni: emp.dni,
                    email: emp.email,
                    name: emp.name || 'Sin nombre',
                    id: emp.id,
                    kept: toKeep.id
                });
                console.log(`🗑️  EMAIL: Eliminado ${emp.email} (${emp.name}) - ID: ${emp.id}`);
            }
        }
    }

    const totalDeleted = deletedIds.size;
    console.log('\n✅ Limpieza completada');
    console.log(`   Total eliminados: ${totalDeleted}`);
    console.log(`   Por DNI: ${deletedByDni}`);
    console.log(`   Por Email: ${deletedByEmail}`);

    return {
        deleted: totalDeleted,
        deletedByDni,
        deletedByEmail,
        details
    };
}

// Main execution
(async () => {
    try {
        const analysis = await analyzeDuplicates();

        if (analysis.hasDuplicates) {
            console.log('\n\n⚠️  ¿Deseas ejecutar la limpieza? (Esta acción es IRREVERSIBLE)');
            console.log('    Ejecuta el script con el argumento --clean para continuar:');
            console.log('    node scripts/admin-duplicates.mjs --clean\n');

            if (process.argv.includes('--clean')) {
                console.log('\n⚠️  INICIANDO LIMPIEZA EN 3 SEGUNDOS...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                await cleanupDuplicates();
            }
        } else {
            console.log('\n✅ La base de datos está limpia, no hay duplicados.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
