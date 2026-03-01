import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, UsePipes, Query, Req } from '@nestjs/common';
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

    @Get('check-existence')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async checkExistence(@Query('dni') dni?: string, @Query('email') email?: string) {
        return this.rrhhService.checkExistence(dni, email);
    }

    @Post('employees')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    @UsePipes(new ZodValidationPipe(EmployeeSchema))
    async create(@Body() data: CreateEmployeeDto) {
        const id = await this.rrhhService.createEmployee(data);
        return { id, message: 'Employee registered successfully' };
    }

    // --- Self-Activation Endpoint ---
    @Post('activate')
    async activate(@Req() req: any) {
        // El usuario se activa a sí mismo al hacer login por primera vez
        const uid = req.user.uid;
        await this.rrhhService.activateEmployee(uid);
        return { message: 'Cuenta activada y confirmada' };
    }

    @Get('employees')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async findAll(
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string
    ) {
        const pageSize = limit ? parseInt(limit, 10) : 50;
        return this.rrhhService.findAllEmployees(pageSize, cursor);
    }

    @Patch('employees/:id')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async update(@Param('id') id: string, @Body() data: any) {
        await this.rrhhService.updateEmployee(id, data);
        return { message: 'Employee updated' };
    }

    @Get('employees/:id')
    @Roles(UserRole.GERENTE, UserRole.RRHH)
    async findOne(@Param('id') id: string) {
        return this.rrhhService.findOneEmployee(id);
    }

    @Delete('employees/:id')
    @Roles(UserRole.GERENTE)
    async delete(@Param('id') id: string) {
        await this.rrhhService.deleteEmployee(id);
        return { message: 'Employee deleted successfully' };
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
