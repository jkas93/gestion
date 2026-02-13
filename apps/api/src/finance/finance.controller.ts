import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@erp/shared';

@Controller('finance')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export default class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Post('purchases')
    @Roles(UserRole.GERENTE, UserRole.PMO)
    async createPurchase(@Body() data: any) {
        const id = await this.financeService.createPurchase(data);
        return { id, message: 'Compra registrada' };
    }

    @Get('purchases')
    @Roles(UserRole.GERENTE, UserRole.PMO)
    async findAll() {
        return this.financeService.findAllPurchases();
    }

    @Get('purchases/project/:projectId')
    async findByProject(@Param('projectId') projectId: string) {
        return this.financeService.findPurchasesByProject(projectId);
    }

    @Patch('purchases/:id/status')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.SUPERVISOR)
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        await this.financeService.updatePurchaseStatus(id, status);
        return { success: true };
    }

    @Get('summary/:projectId')
    async getSummary(@Param('projectId') projectId: string) {
        return this.financeService.getProjectFinancialSummary(projectId);
    }
}
