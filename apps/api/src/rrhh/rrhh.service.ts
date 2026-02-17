import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RRHHService {
    constructor(
        private firebaseService: FirebaseService,
        private mailService: MailService
    ) {
        // Auto-limpieza de duplicados al iniciar el servicio
        this.autoCleanupDuplicates();
    }

    // Limpieza automática silenciosa en segundo plano
    private async autoCleanupDuplicates() {
        try {
            console.log('🔍 Auto-verificando duplicados al iniciar...');
            const result = await this.cleanupDuplicates();
            if (result.deleted > 0) {
                console.log(`✅ Auto-limpieza: Eliminados ${result.deleted} duplicados`);
                console.log(`   - Por DNI: ${result.details.deletedByDni}`);
                console.log(`   - Por Email: ${result.details.deletedByEmail}`);
            } else {
                console.log('✅ Base de datos limpia - No hay duplicados');
            }
        } catch (error) {
            console.error('❌ Error en auto-limpieza:', error.message);
        }
    }

    async createEmployee(data: any): Promise<string> {
        const firestore = this.firebaseService.getFirestore();
        const auth = this.firebaseService.getAuth();

        // 1. Validaciones previas (Solo lectura)
        if (data.dni) {
            const dniSnapshot = await firestore.collection('employees').where('dni', '==', data.dni).get();
            if (!dniSnapshot.empty) {
                const existingEmployee = dniSnapshot.docs[0].data();
                throw new ConflictException(`❌ DNI ${data.dni} ya registrado por ${existingEmployee.name}`);
            }
        }

        if (data.email) {
            const emailSnapshot = await firestore.collection('employees').where('email', '==', data.email).get();
            if (!emailSnapshot.empty) {
                throw new ConflictException(`❌ Email ${data.email} ya registrado como empleado.`);
            }
        }

        let uid = '';
        let isNewAuthUser = false;
        let resetLink = '';

        try {
            // 2. Transacción de Identidad (Auth)
            try {
                // Generar contraseña temporal si no viene (aunque idealmente usamos link de reset)
                const tempPassword = data.password || Math.random().toString(36).slice(-8) + "Aa1!";

                const userRecord = await auth.createUser({
                    email: data.email,
                    password: tempPassword,
                    displayName: `${data.name} ${data.lastName || ''}`.trim(),
                    disabled: false
                });
                uid = userRecord.uid;
                isNewAuthUser = true;

                // Generar Link de Activación
                try {
                    resetLink = await auth.generatePasswordResetLink(data.email);
                } catch (e) {
                    console.warn('⚠️ No se pudo generar link de reset (posiblemente falta config de dominios en Firebase)', e);
                }

                if (data.role) {
                    await auth.setCustomUserClaims(uid, { role: data.role });
                }

            } catch (authError: any) {
                if (authError.code === 'auth/email-already-exists') {
                    const existingUser = await auth.getUserByEmail(data.email);
                    uid = existingUser.uid;
                    // Usuario existente: No generamos link nuevo ni marcamos como nuevo auth
                } else {
                    throw authError; // Re-throw fatal auth errors
                }
            }

            if (!uid) {
                throw new InternalServerErrorException("No se pudo obtener el UID del usuario.");
            }

            // 3. Persistencia (Base de Datos)
            const docRef = firestore.collection('employees').doc(uid);

            // Doble check de seguridad
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                throw new ConflictException(`❌ Conflicto de Integridad: Ya existe ficha para UID ${uid}`);
            }

            const employeeData = {
                ...data,
                id: uid,
                roles: [data.role || 'EMPLEADO'],
                createdAt: new Date().toISOString(),
                status: 'INVITADO',
                // Limpieza de campos sensibles
            };
            delete employeeData.password;

            await docRef.set(employeeData);

            console.log(`✅ Colaborador unificado creado (INVITADO): ${data.name} (UID: ${uid})`);

            // 4. Notificación
            if (isNewAuthUser && resetLink) {
                try {
                    await this.mailService.sendWelcomeEmail(data.email, data.name, data.role || 'Colaborador', resetLink);
                    console.log(`📧 Correo de bienvenida enviado a ${data.email}`);
                } catch (mailError) {
                    console.error(`❌ Falló envío de correo a ${data.email}`, mailError);
                    // No hacemos rollback por fallo de correo, pero avisamos.
                }
            }

            return uid;

        } catch (error) {
            // ROLLBACK Transaccional
            if (isNewAuthUser && uid) {
                console.warn(`⚠️ ROLLBACK: Eliminando usuario Auth ${uid} tras fallo en proceso.`);
                await auth.deleteUser(uid).catch(e => console.error('Error en rollback:', e));
            }
            throw error;
        }
    }

    async activateEmployee(id: string): Promise<void> {
        const firestore = this.firebaseService.getFirestore();
        await firestore.collection('employees').doc(id).update({
            status: 'ACTIVO',
            lastLogin: new Date().toISOString()
        });
        console.log(`✅ Empleado activado: ${id}`);
    }

    async findAllEmployees(): Promise<any[]> {
        const firestore = this.firebaseService.getFirestore();

        // 1. Obtener todos los usuarios (legacy)
        const usersSnapshot = await firestore.collection('users').get();
        const usersMap = new Map();
        usersSnapshot.docs.forEach(doc => {
            usersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // 2. Obtener todos los empleados (nueva fuente de verdad)
        const employeesSnapshot = await firestore.collection('employees').get();
        const employeesMap = new Map();
        employeesSnapshot.docs.forEach(doc => {
            employeesMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // 3. Unificar: Usar Set de IDs para cubrir ambos casos (Legacy + Nuevos)
        const allIds = new Set([...usersMap.keys(), ...employeesMap.keys()]);
        const unifiedList: any[] = [];

        allIds.forEach(id => {
            const userData = usersMap.get(id) || {};
            const employeeData = employeesMap.get(id) || {};

            // Lógica de estado compatible (PENDIENTE -> INVITADO para frontend)
            let status = employeeData.status || userData.status || 'ACTIVO';
            if (status === 'PENDIENTE') status = 'INVITADO';

            unifiedList.push({
                ...userData,      // Datos básicos legacy
                ...employeeData,  // Datos nuevos (sobrescriben)
                id,
                status,
                hasLaborProfile: !!employeesMap.get(id)
            });
        });

        return unifiedList;
    }



    async updateEmployee(id: string, data: any): Promise<void> {
        const firestore = this.firebaseService.getFirestore();

        // VALIDACIÓN ESTRICTA: DNI debe ser ÚNICO (independiente del email)
        if (data.dni) {
            const dniSnapshot = await firestore.collection('employees').where('dni', '==', data.dni).get();
            if (!dniSnapshot.empty && dniSnapshot.docs[0].id !== id) {
                const existingEmployee = dniSnapshot.docs[0].data();
                throw new ConflictException(
                    `❌ DNI ${data.dni} ya está registrado por ${existingEmployee.name || 'otro empleado'} (ID: ${dniSnapshot.docs[0].id}). ` +
                    `No se permite duplicar DNIs bajo ninguna circunstancia.`
                );
            }
        }

        // VALIDACIÓN ESTRICTA: Email debe ser ÚNICO (independiente del DNI)
        if (data.email) {
            const emailSnapshot = await firestore.collection('employees').where('email', '==', data.email).get();
            if (!emailSnapshot.empty && emailSnapshot.docs[0].id !== id) {
                const existingEmployee = emailSnapshot.docs[0].data();
                throw new ConflictException(
                    `❌ Email ${data.email} ya está registrado por ${existingEmployee.name || 'otro empleado'} (ID: ${emailSnapshot.docs[0].id}). ` +
                    `No se permite duplicar emails bajo ninguna circunstancia.`
                );
            }
        }

        await firestore.collection('employees').doc(id).update(data);
        console.log(`✅ Empleado actualizado: ID ${id}`);
    }

    async findOneEmployee(id: string): Promise<any> {
        const firestore = this.firebaseService.getFirestore();

        const userDoc = await firestore.collection('users').doc(id).get();
        const userData = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;

        const employeeDoc = await firestore.collection('employees').doc(id).get();
        const employeeData = employeeDoc.exists ? { id: employeeDoc.id, ...employeeDoc.data() } : null;

        if (!userData && !employeeData) {
            throw new Error('Employee not found');
        }

        return {
            ...userData,
            ...(employeeData || {}),
            id,
            hasLaborProfile: !!employeeData
        };
    }

    async deleteEmployee(id: string): Promise<void> {
        const firestore = this.firebaseService.getFirestore();
        const auth = this.firebaseService.getAuth();

        try {
            // Eliminar de Auth primero (si falla, no borramos datos para no dejar huérfanos)
            await auth.deleteUser(id);
            console.log(`🗑️ Usuario Auth eliminado: ${id}`);
        } catch (error) {
            console.warn(`⚠️ No se pudo eliminar usuario Auth ${id} (quizás ya no existe):`, error.message);
        }

        // Eliminar Ficha de Empleado
        await firestore.collection('employees').doc(id).delete();
        console.log(`🗑️ Ficha de empleado eliminada: ${id}`);
    }

    // --- Deep Analysis & Cleanup ---
    async analyzeDeepConflicts(): Promise<any> {
        const firestore = this.firebaseService.getFirestore();

        // 1. Obtener TODOS los usuarios (Auth/Acceso)
        const usersSnapshot = await firestore.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ source: 'users', id: doc.id, ...doc.data() as any }));

        // 2. Obtener TODOS los empleados (Ficha Laboral)
        const employeesSnapshot = await firestore.collection('employees').get();
        const employees = employeesSnapshot.docs.map(doc => ({ source: 'employees', id: doc.id, ...doc.data() as any }));

        // 3. Unificar todo por Email
        const emailMap = new Map<string, any[]>();
        const allRecords = [...users, ...employees];

        allRecords.forEach(rec => {
            if (rec.email) {
                const normEmail = String(rec.email).trim().toLowerCase();
                const list = emailMap.get(normEmail) || [];
                list.push(rec);
                emailMap.set(normEmail, list);
            }
        });

        // 4. Detectar conflictos (Email repetido en IDs diferentes)
        const conflicts: any[] = [];

        for (const [email, list] of emailMap.entries()) {
            const uniqueIds = new Set(list.map(r => r.id));

            if (uniqueIds.size > 1) {
                conflicts.push({
                    email,
                    uniqueIds: Array.from(uniqueIds),
                    records: list.map(r => ({
                        id: r.id,
                        source: r.source,
                        name: r.name || 'Sin nombre',
                        createdAt: r.createdAt
                    }))
                });
            }
        }

        return {
            usersCount: users.length,
            employeesCount: employees.length,
            uniqueEmails: emailMap.size,
            conflictsCount: conflicts.length,
            conflicts
        };
    }

    async cleanupDeepConflicts(): Promise<any> {
        const analysis = await this.analyzeDeepConflicts();
        const firestore = this.firebaseService.getFirestore();
        const deletedIds = new Set<string>();
        let deletedUsers = 0;
        let deletedEmployees = 0;

        for (const conflict of analysis.conflicts) {
            const records = conflict.records;

            // Ordenar: Más reciente primero
            records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

            // Quedarse con el PRIMERO (Más nuevo)
            const losers = records.slice(1);

            for (const loser of losers) {
                if (!deletedIds.has(loser.id)) {
                    if (loser.source === 'users') {
                        await firestore.collection('users').doc(loser.id).delete();
                        deletedUsers++;
                    } else {
                        await firestore.collection('employees').doc(loser.id).delete();
                        deletedEmployees++;
                    }
                    deletedIds.add(loser.id);
                    console.log(`🗑️ Eliminado conflicto: ${loser.source} ID ${loser.id} (${conflict.email})`);
                }
            }
        }

        return {
            message: `Limpieza profunda completada. Eliminados ${deletedUsers} usuarios y ${deletedEmployees} fichas laborales en conflicto.`,
            deletedUsers,
            deletedEmployees
        };
    }

    // --- Maintenance ---
    async analyzeDuplicates(): Promise<{ hasDuplicates: boolean, summary: any, dniDuplicates: any[], emailDuplicates: any[] }> {
        const firestore = this.firebaseService.getFirestore();
        const snapshot = await firestore.collection('employees').get();
        const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        const dniMap = new Map<string, any[]>();
        const emailMap = new Map<string, any[]>();

        // Agrupar por DNI y Email (NORMALIZADO)
        employees.forEach(emp => {
            if (emp.dni) {
                const normalizedDni = String(emp.dni).trim();
                const list = dniMap.get(normalizedDni) || [];
                list.push(emp);
                dniMap.set(normalizedDni, list);
            }
            if (emp.email) {
                const normalizedEmail = String(emp.email).trim().toLowerCase();
                const list = emailMap.get(normalizedEmail) || [];
                list.push(emp);
                emailMap.set(normalizedEmail, list);
            }
        });

        const dniDuplicates: any[] = [];
        const emailDuplicates: any[] = [];
        let totalDniRecordsToDelete = 0;
        let totalEmailRecordsToDelete = 0;

        // Analizar DNI duplicados
        for (const [dni, list] of dniMap.entries()) {
            if (list.length > 1) {
                list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                totalDniRecordsToDelete += (list.length - 1);

                dniDuplicates.push({
                    dni,
                    count: list.length,
                    toDelete: list.length - 1,
                    records: list.map((emp, index) => ({
                        id: emp.id,
                        originalDni: emp.dni,
                        name: emp.name || 'Sin nombre',
                        email: emp.email,
                        createdAt: emp.createdAt,
                        willKeep: index === 0
                    }))
                });
            }
        }

        // Analizar Email duplicados
        for (const [email, list] of emailMap.entries()) {
            if (list.length > 1) {
                list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                totalEmailRecordsToDelete += (list.length - 1);

                emailDuplicates.push({
                    email,
                    count: list.length,
                    toDelete: list.length - 1,
                    records: list.map((emp, index) => ({
                        id: emp.id,
                        originalEmail: emp.email,
                        name: emp.name || 'Sin nombre',
                        dni: emp.dni,
                        createdAt: emp.createdAt,
                        willKeep: index === 0
                    }))
                });
            }
        }

        return {
            hasDuplicates: dniDuplicates.length > 0 || emailDuplicates.length > 0,
            summary: {
                totalEmployees: employees.length,
                dniDuplicatesCount: dniDuplicates.length,
                emailDuplicatesCount: emailDuplicates.length,
                totalRecordsToDelete: totalDniRecordsToDelete + totalEmailRecordsToDelete
            },
            dniDuplicates,
            emailDuplicates
        };
    }

    async cleanupDuplicates(): Promise<{ deleted: number, details: any, message: string }> {
        const firestore = this.firebaseService.getFirestore();
        const snapshot = await firestore.collection('employees').get();
        const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        const dniMap = new Map<string, any[]>();
        const emailMap = new Map<string, any[]>();
        const deletedIds = new Set<string>();

        let deletedByDni = 0;
        let deletedByEmail = 0;
        const details: any[] = [];

        // Group by DNI and Email (NORMALIZADO)
        employees.forEach(emp => {
            if (emp.dni) {
                const normalizedDni = String(emp.dni).trim();
                const list = dniMap.get(normalizedDni) || [];
                list.push(emp);
                dniMap.set(normalizedDni, list);
            }
            if (emp.email) {
                const normalizedEmail = String(emp.email).trim().toLowerCase();
                const list = emailMap.get(normalizedEmail) || [];
                list.push(emp);
                emailMap.set(normalizedEmail, list);
            }
        });

        // Process DNI duplicates
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
                            matchDni: dni,
                            email: emp.email,
                            name: emp.name || 'Sin nombre',
                            id: emp.id,
                            kept: toKeep.id
                        });
                        console.log(`🗑️ DNI: Eliminado ${emp.dni} (ID: ${emp.id}), conservado ID: ${toKeep.id}`);
                    }
                }
            }
        }

        // Process Email duplicates
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
                        matchEmail: email,
                        name: emp.name || 'Sin nombre',
                        id: emp.id,
                        kept: toKeep.id
                    });
                    console.log(`🗑️ EMAIL: Eliminado ${emp.email} (ID: ${emp.id}), conservado ID: ${toKeep.id}`);
                }
            }
        }

        const totalDeleted = deletedIds.size;
        return {
            deleted: totalDeleted,
            details: {
                deletedByDni,
                deletedByEmail,
                records: details
            },
            message: `Limpieza completada. Eliminados ${totalDeleted} registros duplicados (${deletedByDni} por DNI, ${deletedByEmail} por email).`
        };
    }

    // --- Attendance Management ---
    async recordAttendance(data: any): Promise<string> {
        const firestore = this.firebaseService.getFirestore();
        const docId = `${data.employeeId}_${data.date}`;
        const docRef = firestore.collection('attendance').doc(docId);

        await docRef.set({
            ...data,
            id: docId,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return docId;
    }

    async getEmployeeAttendance(employeeId: string): Promise<any[]> {
        const snapshot = await this.firebaseService.getFirestore()
            .collection('attendance')
            .where('employeeId', '==', employeeId)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }

    // --- Incident Management ---
    async createIncident(data: any): Promise<string> {
        const docRef = this.firebaseService.getFirestore().collection('incidents').doc();
        await docRef.set({
            ...data,
            id: docRef.id,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    }

    async findAllIncidents(): Promise<any[]> {
        const snapshot = await this.firebaseService.getFirestore().collection('incidents').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async updateIncidentStatus(id: string, status: string): Promise<void> {
        await this.firebaseService.getFirestore().collection('incidents').doc(id).update({ status });
    }

    async checkExistence(dni?: string, email?: string): Promise<{ exists: boolean, field?: string, name?: string, id?: string }> {
        const firestore = this.firebaseService.getFirestore();

        if (dni) {
            const dniSnapshot = await firestore.collection('employees').where('dni', '==', dni).get();
            if (!dniSnapshot.empty) {
                const doc = dniSnapshot.docs[0];
                const data = doc.data();

                // AUTO-MIGRATION FIX: Corregir status antiguo 'PENDIENTE' a 'INVITADO'
                if (data.status === 'PENDIENTE') {
                    await doc.ref.update({ status: 'INVITADO' });
                    console.log(`🔧 Auto-corregido status de ${data.name} a INVITADO`);
                }

                return { exists: true, field: 'DNI', name: data.name || 'Otro empleado', id: doc.id };
            }
        }

        if (email) {
            const emailSnapshot = await firestore.collection('employees').where('email', '==', email).get();
            if (!emailSnapshot.empty) {
                const doc = emailSnapshot.docs[0];
                const data = doc.data();

                // AUTO-MIGRATION FIX: Corregir status antiguo 'PENDIENTE' a 'INVITADO'
                if (data.status === 'PENDIENTE') {
                    await doc.ref.update({ status: 'INVITADO' });
                }

                return { exists: true, field: 'Email', name: data.name || 'Otro empleado', id: doc.id };
            }
        }

        return { exists: false };
    }
}
