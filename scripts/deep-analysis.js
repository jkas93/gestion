/**
 * Script de Diagnóstico Profundo de Usuarios y Empleados
 * Analiza duplicados cruzando las colecciones 'users' y 'employees'
 */

const API_URL = 'http://localhost:4001/rrhh/maintenance-deep';

// Colores para consola
const c = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

async function deepAnalyze() {
    console.log(`${c.cyan}${c.bold}🔍 Iniciando Análisis Profundo (Users + Employees)...${c.reset}\n`);

    try {
        // Nota: Necesitaremos crear este endpoint temporal
        const response = await fetch(API_URL);

        if (!response.ok) {
            console.log("El endpoint no existe aún. Creándolo...");
            return;
        }

        const data = await response.json();

        console.log(`${c.bold}📊 Resumen General:${c.reset}`);
        console.log(`- Total Usuarios (Auth/Acceso): ${data.usersCount}`);
        console.log(`- Total Empleados (Ficha Laboral): ${data.employeesCount}`);
        console.log(`- Total Correos Únicos: ${data.uniqueEmails}\n`);

        if (data.duplicates.length > 0) {
            console.log(`${c.red}${c.bold}🔴 SE ENCONTRARON ${data.duplicates.length} CORREOS DUPLICADOS:${c.reset}`);

            data.duplicates.forEach((dup, i) => {
                console.log(`\n${c.yellow}${i + 1}. Correo: ${dup.email}${c.reset}`);
                console.log(`   Total registros: ${dup.records.length}`);

                dup.records.forEach(rec => {
                    let type = rec.source === 'users' ? '[USUARIO ACCESO]' : '[FICHA LABORAL]';
                    let color = rec.source === 'users' ? c.cyan : c.green;
                    let warning = rec.hasWarning ? `${c.red}⚠️ NO COINCIDE${c.reset}` : '';

                    console.log(`   - ${color}${type}${c.reset} ID: ${rec.id} | Nombre: ${rec.name} ${warning}`);
                });

                console.log(`   ${c.bold}Acción recomendada:${c.reset} Fusionar o eliminar el más antiguo.`);
            });
        } else {
            console.log(`${c.green}✅ No se encontraron conflictos entre Users y Employees.${c.reset}`);
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

deepAnalyze();
