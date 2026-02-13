import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, UsePipes } from '@nestjs/common';
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
    async findAll(@Request() req: any) {
        const userId = req.user.uid;
        const role = req.user.role;
        return this.projectsService.findAll(userId, role);
    }

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

    // Task Endpoints
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
}
