import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RRHHService {
    constructor(
        private firebaseService: FirebaseService,
        private mailService: MailService
    ) { }

    /**
     * Valida que DNI y Email sean únicos en la base de datos
     * @param dni - DNI a validar
     * @param email - Email a validar
     * @param excludeId - ID a excluir de la validación (para updates)
     * @throws ConflictException si encuentra duplicados
     */
    private async validateUniqueFields(
        dni?: string,
        email?: string,
        excludeId?: string
    ): Promise<void> {
        const db = this.firebaseService.getFirestore();

        if (dni) {
            const dniSnapshot = await db.collection('employees')
                .where('dni', '==', dni)
                .get();

            const duplicates = dniSnapshot.docs.filter(doc => doc.id !== excludeId);
            if (duplicates.length > 0) {
                const existing = duplicates[0].data();
                throw new ConflictException(
                    `❌ DNI ${dni} ya está registrado por ${existing.name || 'otro empleado'}`
                );
            }
        }

        if (email) {
            const emailSnapshot = await db.collection('employees')
                .where('email', '==', email)
                .get();

            const duplicates = emailSnapshot.docs.filter(doc => doc.id !== excludeId);
            if (duplicates.length > 0) {
                const existing = duplicates[0].data();
                throw new ConflictException(
                    `❌ Email ${email} ya está registrado por ${existing.name || 'otro empleado'}`
                );
            }
        }
    }

    async createEmployee(data: any): Promise<string> {
        const firestore = this.firebaseService.getFirestore();
        const auth = this.firebaseService.getAuth();

        // 1. Validación centralizada (ahora en una sola línea)
        await this.validateUniqueFields(data.dni, data.email);

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

    /**
     * Activa un usuario/empleado al iniciar sesión por primera vez.
     * Verifica tanto la colección 'employees' (RRHH) como 'users' (sistema general).
     * 
     * Flujo:
     * 1. Primero verifica 'employees' (prioridad para empleados con ficha laboral)
     * 2. Si no existe, verifica 'users' (para usuarios invitados sin ficha)
     * 3. Si no existe en ninguna, retorna silenciosamente (usuarios sin ficha tipo GERENTE)
     * 
     * @param id - UID del usuario
     */
    async activateEmployee(id: string): Promise<void> {
        const firestore = this.firebaseService.getFirestore();

        // 1. Intentar activar en employees primero (RRHH - empleados con ficha laboral)
        const employeeRef = firestore.collection('employees').doc(id);
        const employeeDoc = await employeeRef.get();

        if (employeeDoc.exists) {
            const employeeData = employeeDoc.data();
            // Solo actualizar si está en INVITADO
            if (employeeData?.status === 'INVITADO') {
                await employeeRef.update({
                    status: 'ACTIVO',
                    lastLogin: new Date().toISOString(),
                    activatedAt: new Date().toISOString()
                });
                console.log(`✅ Empleado activado (employees): ${id}`);
            } else {
                // Ya está activo, solo actualizar lastLogin
                await employeeRef.update({
                    lastLogin: new Date().toISOString()
                });
            }
            return;
        }

        // 2. Si no existe en employees, intentar en users (usuarios invitados sin ficha laboral)
        const userRef = firestore.collection('users').doc(id);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            // Solo activar si está en INVITADO
            if (userData?.status === 'INVITADO') {
                await userRef.update({
                    status: 'ACTIVO',
                    activatedAt: new Date().toISOString(),
                    firstLoginAt: new Date().toISOString()
                });
                console.log(`✅ Usuario activado (users): ${id}`);
            }
            return;
        }

        // 3. Usuario sin ficha (ej: GERENTE que solo existe en Auth) - silencioso, no es error
        console.log(`ℹ️ Usuario ${id} no requiere activación (sin ficha en employees/users)`);
    }

    /**
     * Obtiene lista paginada de empleados
     * @param limit - Número máximo de empleados a retornar (default: 50)
     * @param startAfter - ID del documento para iniciar después (cursor)
     * @returns Lista de empleados con cursor para siguiente página
     */
    async findAllEmployees(
        limit: number = 50,
        startAfter?: string
    ): Promise<{ employees: any[], nextCursor?: string }> {
        const db = this.firebaseService.getFirestore();

        // Query paginada con ordenamiento
        let query = db.collection('employees')
            .orderBy('createdAt', 'desc')
            .limit(limit + 1); // +1 para determinar si hay más páginas

        // Si hay cursor, iniciar después de ese documento
        if (startAfter) {
            const startDoc = await db.collection('employees').doc(startAfter).get();
            if (startDoc.exists) {
                query = query.startAfter(startDoc);
            }
        }

        const snapshot = await query.get();
        const docs = snapshot.docs;

        // Determinar si hay más páginas
        const hasMore = docs.length > limit;
        const employees = docs.slice(0, limit).map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            employees,
            nextCursor: hasMore ? docs[limit - 1].id : undefined
        };
    }



    async updateEmployee(id: string, data: any): Promise<void> {
        const firestore = this.firebaseService.getFirestore();

        // Validación centralizada (excluyendo el propio empleado)
        await this.validateUniqueFields(data.dni, data.email, id);

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
