/**
 * Script de Limpieza Profunda (Usuarios + Empleados)
 * Elimina duplicados de Email incluso si tienen IDs diferentes en Users y Employees
 * 
 * Uso:
 *   node scripts/run-deep-cleanup.js          -> Solo analiza
 *   node scripts/run-deep-cleanup.js --clean  -> Ejecuta limpieza
 */

const API_URL = 'http://localhost:4001/rrhh/maintenance';
const colors = {
    reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m'
};

async function analyzeDeep() {
    console.log(`${colors.cyan}🔍 Analizando conflictos profundos (Users vs Employees)...${colors.reset}\n`);

    try {
        const response = await fetch(`${API_URL}/analyze-deep`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        console.log(`Total Usuarios: ${data.usersCount}`);
        console.log(`Total Empleados: ${data.employeesCount}`);

        if (data.conflictsCount === 0) {
            console.log(`\n${colors.green}✅ No se encontraron conflictos.${colors.reset}`);
            return false;
        }

        console.log(`\n${colors.red}⚠️  SE ENCONTRARON ${data.conflictsCount} CONFLICTOS:${colors.reset}\n`);

        data.conflicts.forEach((c, i) => {
            console.log(`${i + 1}. Email duplicado: ${colors.yellow}${c.email}${colors.reset}`);
            c.records.forEach(r => {
                const type = r.source === 'users' ? '[USUARIO]' : '[FICHA]  ';
                console.log(`   ${type} ID: ${r.id} | ${r.name} | Creado: ${r.createdAt || 'N/A'}`);
            });
            console.log('');
        });

        return true;
    } catch (error) {
        console.error(`${colors.red}Error:${colors.reset}`, error.message);
        return false;
    }
}

async function cleanupDeep() {
    console.log(`${colors.yellow}🧹 Ejecutando limpieza profunda...${colors.reset}`);
    try {
        const response = await fetch(`${API_URL}/cleanup-deep`, { method: 'POST' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        console.log(`\n${colors.green}✅ Limpieza terminada${colors.reset}`);
        console.log(data.message);
        console.log(`Usuarios eliminados: ${data.deletedUsers}`);
        console.log(`Fichas laborales eliminadas: ${data.deletedEmployees}`);

    } catch (error) {
        console.error(`${colors.red}Error al limpiar:${colors.reset}`, error.message);
    }
}

(async () => {
    const hasConflicts = await analyzeDeep();

    if (hasConflicts) {
        if (process.argv.includes('--clean')) {
            await cleanupDeep();
        } else {
            console.log(`${colors.cyan}\n💡 Para eliminar estos conflictos automáticamente, ejecuta:${colors.reset}`);
            console.log(`   node scripts/run-deep-cleanup.js --clean`);
        }
    }
})();
