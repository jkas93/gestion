import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { MaterialRequestsService } from './material-requests.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, CreateMaterialRequestDto } from '@erp/shared';

@Controller('material-requests')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class MaterialRequestsController {
    constructor(private readonly requestsService: MaterialRequestsService) { }

    @Post()
    @Roles(UserRole.SUPERVISOR, UserRole.COORDINADOR)
    async create(@Body() createDto: CreateMaterialRequestDto) {
        const id = await this.requestsService.create(createDto);
        return { id, message: 'Solicitud enviada' };
    }

    @Get('project/:projectId')
    async findByProject(@Param('projectId') projectId: string) {
        return this.requestsService.findByProject(projectId);
    }

    @Patch(':id/status')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: any,
        @Body('rejectionReason') rejectionReason?: string
    ) {
        await this.requestsService.updateStatus(id, status, rejectionReason);
        return { success: true };
    }
}
