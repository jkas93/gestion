import { Controller, Post, Body, UseGuards, Get, Param, Delete } from '@nestjs/common';
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

            // 4. Generate password reset link
            const resetLink = await this.firebaseService.getAuth().generatePasswordResetLink(email);

            // 5. Send Welcome Email
            try {
                await this.mailService.sendWelcomeEmail(email, name, resetLink);
            } catch (mailError) {
                console.error('Failed to send welcome email, but user was created:', mailError);
                // We don't throw here to avoid failing the whole invite process if only mail fails
            }

            return {
                message: 'Usuario invitado exitosamente y correo enviado',
                uid,
                resetLink
            };
        } catch (error: any) {
            throw new Error(`Error inviting user: ${error.message}`);
        }
    }

    @Delete('invite/:uid')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async deleteInvite(@Param('uid') uid: string) {
        try {
            // 1. Delete from Firebase Auth
            await this.firebaseService.getAuth().deleteUser(uid);

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
            throw new Error(`Error deleting invitation: ${error.message}`);
        }
    }
}
