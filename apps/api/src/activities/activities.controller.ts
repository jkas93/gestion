import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, UsePipes } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, ActivityMasterSchema, CreateActivityMasterDto } from '@erp/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('activities')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Post()
    @Roles(UserRole.GERENTE, UserRole.PMO)
    @UsePipes(new ZodValidationPipe(ActivityMasterSchema))
    async create(@Body() data: CreateActivityMasterDto) {
        const id = await this.activitiesService.create(data);
        return { id, message: 'Actividad maestra creada correctamente' };
    }

    @Get()
    async findAll() {
        return this.activitiesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.activitiesService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.GERENTE, UserRole.PMO)
    async update(@Param('id') id: string, @Body() data: any) {
        await this.activitiesService.update(id, data);
        return { message: 'Actividad actualizada' };
    }

    @Delete(':id')
    @Roles(UserRole.GERENTE, UserRole.PMO)
    async delete(@Param('id') id: string) {
        await this.activitiesService.delete(id);
        return { message: 'Actividad eliminada' };
    }
}
