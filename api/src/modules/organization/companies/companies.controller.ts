import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) { }

    @Post()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Crear una nueva empresa' })
    @ApiResponse({ status: 201, description: 'Empresa creada exitosamente', type: CompanyResponseDto })
    create(@Body() createCompanyDto: CreateCompanyDto) {
        return this.companiesService.create(createCompanyDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar todas las empresas' })
    @ApiResponse({ status: 200, description: 'Lista de empresas', type: [CompanyResponseDto] })
    findAll() {
        return this.companiesService.findAll();
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener una empresa por ID' })
    @ApiResponse({ status: 200, description: 'Empresa encontrada', type: CompanyResponseDto })
    @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
    findOne(@Param('id') id: string) {
        return this.companiesService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Actualizar una empresa' })
    @ApiResponse({ status: 200, description: 'Empresa actualizada', type: CompanyResponseDto })
    update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
        return this.companiesService.update(id, updateCompanyDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminar una empresa' })
    @ApiResponse({ status: 200, description: 'Empresa eliminada' })
    @ApiResponse({
        status: 409,
        description: 'No se puede eliminar - tiene dependencias',
        schema: {
            example: {
                statusCode: 409,
                message: 'No se puede eliminar la empresa porque está siendo utilizada',
                error: 'Conflict',
                dependencies: [
                    {
                        entity: 'departments',
                        count: 3,
                        examples: ['Departamento de TI', 'Departamento de RRHH', 'Departamento de Ventas']
                    },
                    {
                        entity: 'contracts',
                        count: 15
                    }
                ]
            }
        }
    })
    remove(@Param('id') id: string) {
        return this.companiesService.remove(id);
    }
}
