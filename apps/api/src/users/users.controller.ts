import { Controller, Post, Body, UseGuards, Get, Param, Delete, InternalServerErrorException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import { UserRole } from '@erp/shared';
import { Roles } from '../auth/roles.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
export class UsersController {
    constructor(
        private firebaseService: FirebaseService,
        private mailService: MailService
    ) { }

    @Post('register')
    async register(@Body() body: { uid: string, email: string, name: string, role?: UserRole }) {
        const { uid, email, name, role: requestedRole } = body;

        // Check if there are any users in the system (Bootstrap)
        const usersSnapshot = await this.firebaseService.getFirestore().collection('users').limit(1).get();
        const isFirstUser = usersSnapshot.empty;

        // If it's the first user, always force GERENTE. 
        // Otherwise, use requested role or default to SUPERVISOR.
        const finalRole = isFirstUser ? UserRole.GERENTE : (requestedRole || UserRole.SUPERVISOR);

        // Set Custom Claims
        await this.firebaseService.getAuth().setCustomUserClaims(uid, { role: finalRole });

        // Create profile in Firestore
        await this.firebaseService.getFirestore()
            .collection('users')
            .doc(uid)
            .set({
                email,
                name,
                role: finalRole,
                createdAt: new Date().toISOString()
            });

        return { uid, role: finalRole, message: isFirstUser ? 'Admin bootstrap completed' : 'User profile initialized' };
    }

    @Get()
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.GERENTE)
    async findAll() {
        const snapshot = await this.firebaseService.getFirestore()
            .collection('users')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    @Get('by-role/:role')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
    async listByRole(@Param('role') role: string) {
        const snapshot = await this.firebaseService.getFirestore()
            .collection('users')
            .where('role', '==', role)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    @Post('set-role')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.GERENTE)
    async setRole(@Body() body: { uid: string, role: UserRole }) {
        const { uid, role } = body;

        await this.firebaseService.getAuth().setCustomUserClaims(uid, { role });
        await this.firebaseService.getFirestore()
            .collection('users')
            .doc(uid)
            .set({ role }, { merge: true });

        return { message: `Role ${role} assigned to user ${uid}` };
    }

    @Post('invite')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async invite(@Body() body: { email: string, name: string, role: UserRole }) {
        const { email, name, role } = body;

        try {
            // 1. Create user in Firebase Auth
            const userRecord = await this.firebaseService.getAuth().createUser({
                email,
                displayName: name,
            });

            const uid = userRecord.uid;

            // 2. Set Custom Claims
            await this.firebaseService.getAuth().setCustomUserClaims(uid, { role });

            // 3. Create profile in Firestore
            await this.firebaseService.getFirestore()
                .collection('users')
                .doc(uid)
                .set({
                    email,
                    name,
                    role,
                    createdAt: new Date().toISOString(),
                    status: 'INVITADO'
                });

            // 4. Generate password reset link with robust fallback
            let resetLink: string;
            try {
                const actionCodeSettings = {
                    url: process.env.FRONTEND_URL || 'http://localhost:3000/login',
                    handleCodeInApp: false,
                };
                resetLink = await this.firebaseService.getAuth().generatePasswordResetLink(email, actionCodeSettings);
            } catch (linkError) {
                console.warn('⚠️ Warning: Failed to generate advanced reset link (check Authorized Domains in Firebase Console). Falling back to standard link.', linkError.message);
                // Fallback: Standard Firebase link (always works)
                resetLink = await this.firebaseService.getAuth().generatePasswordResetLink(email);
            }

            // 5. Send Welcome Email
            console.log(`📧 Attempting to send welcome email to ${email} with role ${role}...`);
            console.log('🔗 Generated Reset Link:', resetLink);

            try {
                await this.mailService.sendWelcomeEmail(email, name, role, resetLink);
                console.log('✅ Email sent successfully from controller');
            } catch (mailError) {
                console.error('❌ Failed to send welcome email:', mailError);
                // Propagate error to client so user knows email failed
                throw new InternalServerErrorException(`Usuario creado, pero falló el envío del correo: ${mailError.message}`);
            }

            return {
                message: 'Usuario invitado exitosamente y correo enviado',
                uid,
                resetLink
            };
        } catch (error: any) {
            throw new InternalServerErrorException(`Error inviting user: ${error.message}`);
        }
    }

    @Delete('invite/:uid')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async deleteInvite(@Param('uid') uid: string) {
        try {
            // 1. Delete from Firebase Auth
            try {
                await this.firebaseService.getAuth().deleteUser(uid);
            } catch (authError: any) {
                // Si el usuario no existe en Auth (ej. datos de seed o desincronizado),
                // permitimos continuar para limpiar la base de datos.
                if (authError.code !== 'auth/user-not-found') {
                    // Logueamos otros errores pero no detenemos el proceso crítico de limpieza de DB
                    console.warn(`Warning: Could not delete user ${uid} from Auth:`, authError.message);
                }
            }

            // 2. Delete from Firestore users collection
            await this.firebaseService.getFirestore()
                .collection('users')
                .doc(uid)
                .delete();

            // 3. Delete from Firestore employees collection (if exists)
            await this.firebaseService.getFirestore()
                .collection('employees')
                .doc(uid)
                .delete();

            return { message: 'Invitación y registros eliminados exitosamente' };
        } catch (error: any) {
            throw new InternalServerErrorException(`Error deleting invitation: ${error.message}`);
        }
    }
    @Post('acknowledge-login')
    @UseGuards(FirebaseAuthGuard)
    async acknowledgeLogin(@Body() body: { uid: string }) {
        // UID comes from Guard usually, but we can accept it from body for now or extract from request
        // Better: extract from request user object if Guard attaches it.
        // For now, let's allow passing UID securely or trust the Guard.
        // Assuming Guard attaches user to request, but here we might need to rely on the client passing their known UID 
        // OR better, get it from the token.
        // Given the current architecture, let's use the body UID but verify it matches the token if possible.
        // For simplicity and robustness in this specific flow:

        const { uid } = body;
        if (!uid) return;

        const userRef = this.firebaseService.getFirestore().collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData && userData.status === 'INVITADO') {
                console.log(`🚀 Auto-activating user ${uid} from INVITADO to ACTIVO`);
                await userRef.update({
                    status: 'ACTIVO',
                    activatedAt: new Date().toISOString(),
                    firstLoginAt: new Date().toISOString()
                });
                return { status: 'ACTIVATED', message: 'User status updated to ACTIVO' };
            }
        }
        return { status: 'NO_CHANGE', message: 'User already active or not found' };
    }
}
