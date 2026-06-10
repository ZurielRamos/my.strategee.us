import { Controller, Get, Post, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('API Keys')
@Controller('api-keys')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) {}

    @Post()
    @ApiOperation({ summary: 'Crear una nueva API key' })
    @ApiResponse({ status: 201, description: 'API key creada. La key completa solo se muestra una vez.' })
    create(@Body() createDto: CreateApiKeyDto) {
        return this.apiKeysService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas las API keys activas' })
    @ApiResponse({ status: 200, description: 'Lista de API keys (enmascaradas)' })
    findAll() {
        return this.apiKeysService.findAll();
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Revocar una API key' })
    @ApiResponse({ status: 200, description: 'API key revocada exitosamente' })
    @ApiResponse({ status: 404, description: 'API key no encontrada' })
    revoke(@Param('id', ParseIntPipe) id: number) {
        return this.apiKeysService.revoke(id);
    }
}
