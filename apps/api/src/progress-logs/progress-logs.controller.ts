import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ProgressLogsService } from './progress-logs.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, CreateProgressLogDto } from '@erp/shared';

@Controller('projects/:projectId/progress-logs')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ProgressLogsController {
    constructor(private readonly progressLogsService: ProgressLogsService) { }

    @Post()
    @Roles(UserRole.SUPERVISOR) // Strictly restricted to Supervisor as requested
    async create(
        @Param('projectId') projectId: string,
        @Body() logData: CreateProgressLogDto,
        @Request() req
    ) {
        return this.progressLogsService.create(projectId, logData, req.user.uid);
    }

    @Get()
    async getLogs(@Param('projectId') projectId: string) {
        return this.progressLogsService.findByProject(projectId);
    }

    @Get('task/:taskId')
    async getTaskLogs(
        @Param('projectId') projectId: string,
        @Param('taskId') taskId: string
    ) {
        return this.progressLogsService.findByTask(projectId, taskId);
    }
}
