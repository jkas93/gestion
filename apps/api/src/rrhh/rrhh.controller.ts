import { Controller, Get, Post, Body, Param, Patch, UseGuards, UsePipes } from '@nestjs/common';
import { RRHHService } from './rrhh.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, EmployeeSchema, CreateEmployeeDto } from '@erp/shared';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('rrhh')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class RRHHController {
    constructor(private readonly rrhhService: RRHHService) { }

    @Post('employees')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    @UsePipes(new ZodValidationPipe(EmployeeSchema))
    async create(@Body() data: CreateEmployeeDto) {
        const id = await this.rrhhService.createEmployee(data);
        return { id, message: 'Employee registered successfully' };
    }

    @Get('employees')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async findAll() {
        return this.rrhhService.findAllEmployees();
    }

    @Patch('employees/:id')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async update(@Param('id') id: string, @Body() data: any) {
        await this.rrhhService.updateEmployee(id, data);
        return { message: 'Employee updated' };
    }

    // --- Attendance Endpoints ---
    @Post('attendance')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async recordAttendance(@Body() data: any) {
        const id = await this.rrhhService.recordAttendance(data);
        return { id, message: 'Attendance recorded' };
    }

    @Get('attendance/:employeeId')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async getAttendance(@Param('employeeId') employeeId: string) {
        return this.rrhhService.getEmployeeAttendance(employeeId);
    }

    // --- Incident Endpoints ---
    @Post('incidents')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async createIncident(@Body() data: any) {
        const id = await this.rrhhService.createIncident(data);
        return { id, message: 'Incident created' };
    }

    @Get('incidents')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async findAllIncidents() {
        return this.rrhhService.findAllIncidents();
    }

    @Patch('incidents/:id/status')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async updateIncidentStatus(@Param('id') id: string, @Body('status') status: string) {
        await this.rrhhService.updateIncidentStatus(id, status);
        return { message: 'Incident status updated' };
    }
}
