/**
 * Script para ejecutar análisis y limpieza de duplicados
 * Ejecutar con: node scripts/run-cleanup.mjs
 */

const API_URL = 'http://localhost:4001/rrhh/maintenance';

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

async function analyzeDuplicates() {
    console.log(`${colors.cyan}🔍 Analizando duplicados...${colors.reset}\n`);

    try {
        const response = await fetch(`${API_URL}/analyze-duplicates`);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(`HTTP ${response.status}: ${error.message}`);
        }

        const data = await response.json();

        console.log(`${colors.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.cyan}📊 ANÁLISIS DE DUPLICADOS${colors.reset}`);
        console.log(`${colors.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

        console.log(`Total de empleados: ${colors.white}${data.summary.totalEmployees}${colors.reset}`);
        console.log(`DNIs con duplicados: ${colors.yellow}${data.summary.dniDuplicatesCount}${colors.reset}`);
        console.log(`Emails con duplicados: ${colors.yellow}${data.summary.emailDuplicatesCount}${colors.reset}`);
        console.log(`Total a eliminar: ${colors.red}${data.summary.totalRecordsToDelete}${colors.reset}\n`);

        if (data.summary.dniDuplicatesCount > 0) {
            console.log(`${colors.red}🔴 DNIs DUPLICADOS:${colors.reset}`);
            data.dniDuplicates.forEach(dup => {
                console.log(`\n  DNI: ${colors.yellow}${dup.dni}${colors.reset} (${dup.count} registros)`);
                dup.records.forEach(rec => {
                    const status = rec.willKeep
                        ? `${colors.green}✅ MANTENER${colors.reset}`
                        : `${colors.red}❌ ELIMINAR${colors.reset}`;
                    console.log(`    ${status} - ${rec.name} (${rec.email})`);
                });
            });
            console.log('');
        }

        if (data.summary.emailDuplicatesCount > 0) {
            console.log(`${colors.blue}🔵 EMAILS DUPLICADOS:${colors.reset}`);
            data.emailDuplicates.forEach(dup => {
                console.log(`\n  Email: ${colors.yellow}${dup.email}${colors.reset} (${dup.count} registros)`);
                dup.records.forEach(rec => {
                    const status = rec.willKeep
                        ? `${colors.green}✅ MANTENER${colors.reset}`
                        : `${colors.blue}❌ ELIMINAR${colors.reset}`;
                    console.log(`    ${status} - ${rec.name} (DNI: ${rec.dni})`);
                });
            });
            console.log('');
        }

        if (!data.hasDuplicates) {
            console.log(`${colors.green}✅ La base de datos está limpia. No hay duplicados.${colors.reset}\n`);
        }

        return data;
    } catch (error) {
        console.error(`${colors.red}❌ Error al analizar:${colors.reset}`, error.message);
        throw error;
    }
}

async function cleanupDuplicates() {
    console.log(`${colors.yellow}\n⚠️  ADVERTENCIA: Esta acción es IRREVERSIBLE${colors.reset}`);
    console.log(`  Se eliminarán permanentemente los registros duplicados más antiguos.\n`);

    // En un entorno real, aquí pedirías confirmación del usuario
    console.log(`${colors.cyan}🧹 Ejecutando limpieza...${colors.reset}\n`);

    try {
        const response = await fetch(`${API_URL}/cleanup-duplicates`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(`HTTP ${response.status}: ${error.message}`);
        }

        const data = await response.json();

        console.log(`${colors.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.green}✅ LIMPIEZA COMPLETADA${colors.reset}`);
        console.log(`${colors.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

        console.log(`${data.message}\n`);
        console.log(`Total eliminados: ${colors.green}${data.deleted}${colors.reset}`);
        console.log(`Por DNI duplicado: ${colors.yellow}${data.details.deletedByDni}${colors.reset}`);
        console.log(`Por Email duplicado: ${colors.blue}${data.details.deletedByEmail}${colors.reset}\n`);

        if (data.details.records.length > 0) {
            console.log(`${colors.cyan}📝 Registros eliminados:${colors.reset}\n`);
            data.details.records.forEach((rec, i) => {
                console.log(`  ${i + 1}. ${rec.name}`);
                console.log(`     Razón: ${rec.reason}`);
                console.log(`     DNI: ${rec.dni || 'N/A'} | Email: ${rec.email || 'N/A'}`);
                console.log(`     ID eliminado: ${rec.id} | ID conservado: ${rec.kept}\n`);
            });
        }

        return data;
    } catch (error) {
        console.error(`${colors.red}❌ Error al limpiar:${colors.reset}`, error.message);
        throw error;
    }
}

// Ejecución principal
(async () => {
    try {
        // Análisis
        const analysis = await analyzeDuplicates();

        // Si hay duplicados, preguntar si limpiar
        if (analysis.hasDuplicates && process.argv.includes('--clean')) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa de 2 segundos
            await cleanupDuplicates();
        } else if (analysis.hasDuplicates) {
            console.log(`${colors.yellow}💡 Para ejecutar la limpieza, ejecuta:${colors.reset}`);
            console.log(`   node scripts/run-cleanup.mjs --clean\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error(`\n${colors.red}❌ Error fatal:${colors.reset}`, error.message);
        process.exit(1);
    }
})();
