import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, CreateMaterialDto } from '@erp/shared';

@Controller('materials')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class MaterialsController {
    constructor(private readonly materialsService: MaterialsService) { }

    @Post()
    @Roles(UserRole.GERENTE, UserRole.LOGISTICO)
    async create(@Body() createMaterialDto: CreateMaterialDto) {
        const id = await this.materialsService.create(createMaterialDto);
        return { id, message: 'Material registrado' };
    }

    @Get()
    async findAll() {
        return this.materialsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.materialsService.findOne(id);
    }
}
