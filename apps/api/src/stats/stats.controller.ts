import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@erp/shared';

@Controller('stats')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get('dashboard')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
    async getDashboardStats() {
        return this.statsService.getDashboardStats();
    }
}
