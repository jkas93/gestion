import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, UsePipes, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, Project } from '@erp/shared';

import { ProjectSchema, CreateProjectDto } from '@erp/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('projects')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
    @UsePipes(new ZodValidationPipe(ProjectSchema))
    async create(@Body() createProjectDto: CreateProjectDto) {
        const id = await this.projectsService.create(createProjectDto);
        return { id, message: 'Project created successfully' };
    }

    @Get()
    async findAll(
        @Request() req: any,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string
    ) {
        const pageSize = limit ? parseInt(limit, 10) : 20;
        return this.projectsService.findAll(req.user.uid, req.user.role, pageSize, cursor);
    }

    // ========================================
    // PROJECT HEALTH DASHBOARD (DEBE IR ANTES DE :id genérico)
    // ========================================

    @Get(':id/health')
    async getProjectHealth(
        @Param('id') id: string,
        @Request() req: any
    ) {
        return this.projectsService.getProjectHealth(id, req.user.uid, req.user.role);
    }

    // ========================================
    // MILESTONES / HITOS (DEBE IR ANTES DE :id genérico)
    // ========================================

    @Post(':projectId/milestones')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
    async createMilestone(
        @Param('projectId') projectId: string,
        @Body() milestoneData: any,
        @Request() req: any
    ) {
        const id = await this.projectsService.createMilestone(
            projectId,
            milestoneData,
            req.user.uid,
            req.user.role
        );
        return { id, message: 'Milestone created successfully' };
    }

    @Get(':projectId/milestones')
    async getMilestones(
        @Param('projectId') projectId: string,
        @Request() req: any
    ) {
        return this.projectsService.getMilestones(projectId, req.user.uid, req.user.role);
    }

    @Patch(':projectId/milestones/:milestoneId')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
    async updateMilestoneStatus(
        @Param('projectId') projectId: string,
        @Param('milestoneId') milestoneId: string,
        @Body('status') status: string,
        @Request() req: any
    ) {
        await this.projectsService.updateMilestoneStatus(
            projectId,
            milestoneId,
            status as any,
            req.user.uid,
            req.user.role
        );
        return { message: 'Milestone status updated successfully' };
    }

    // Task Endpoints (DEBEN IR ANTES DE :id genérico)
    @Post(':projectId/tasks')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR, UserRole.SUPERVISOR)
    async addTask(@Param('projectId') projectId: string, @Body() taskData: any, @Request() req: any) {
        const id = await this.projectsService.addTask(projectId, taskData, req.user.uid, req.user.role);
        return { id, message: 'Task added successfully' };
    }

    @Get(':projectId/tasks')
    async getTasks(@Param('projectId') projectId: string, @Request() req: any) {
        return this.projectsService.getTasks(projectId, req.user.uid, req.user.role);
    }

    @Patch(':projectId/tasks/:taskId')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR, UserRole.SUPERVISOR)
    async updateTask(
        @Param('projectId') projectId: string,
        @Param('taskId') taskId: string,
        @Body() taskData: any,
        @Request() req: any
    ) {
        await this.projectsService.updateTask(projectId, taskId, taskData, req.user.uid, req.user.role);
        return { message: 'Task updated successfully' };
    }

    @Delete(':projectId/tasks/:taskId')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR, UserRole.SUPERVISOR)
    async deleteTask(
        @Param('projectId') projectId: string,
        @Param('taskId') taskId: string,
        @Request() req: any
    ) {
        await this.projectsService.deleteTask(projectId, taskId, req.user.uid, req.user.role);
        return { message: 'Task deleted successfully' };
    }

    // ========================================
    // GENERIC PROJECT ENDPOINTS (DEBEN IR AL FINAL)
    // ========================================

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.projectsService.findOne(id, req.user.uid, req.user.role);
    }

    @Patch(':id')
    @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR, UserRole.SUPERVISOR)
    async update(@Param('id') id: string, @Body() updateProjectDto: Partial<Project>, @Request() req: any) {
        await this.projectsService.update(id, updateProjectDto, req.user.uid, req.user.role);
        return { message: 'Project updated successfully' };
    }

}
