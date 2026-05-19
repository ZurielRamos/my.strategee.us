import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCreatedResponse, ApiOkResponse, ApiNoContentResponse, ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { ApiExamplesResponse } from '@common/decorators/api-examples.decorator';
import { LocationConflictExamples, LocationNotFoundExamples } from './utils/location.examples';
import { HttpErrorDto } from '@common/dto/http-error.dto';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Post()
    @ApiOperation({ summary: 'Crear una nueva ubicación', description: 'Crea una nueva ubicación en el sistema.' })
    @ApiCreatedResponse({ type: LocationResponseDto, description: 'Ubicación creada exitosamente' })
    @ApiExamplesResponse(409, HttpErrorDto, LocationConflictExamples, { description: 'Ya existe una ubicación con este nombre' })
    create(@Body() createLocationDto: CreateLocationDto) {
        return this.locationsService.create(createLocationDto);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todas las ubicaciones', description: 'Obtiene todas las ubicaciones registradas en el sistema.' })
    @ApiOkResponse({ type: LocationResponseDto, description: 'Lista de ubicaciones', isArray: true })

    findAll() {
        return this.locationsService.findAll();
    }

    @Get('active')
    @ApiOperation({ summary: 'Obtener todas las ubicaciones activas', description: 'Obtiene todas las ubicaciones activas registradas en el sistema.' })
    @ApiOkResponse({ type: LocationResponseDto, description: 'Lista de ubicaciones activas', isArray: true })
    findAllActive() {
        return this.locationsService.findAllActive();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una ubicación por ID', description: 'Obtiene una ubicación por ID.' })
    @ApiOkResponse({ type: LocationResponseDto, description: 'Ubicación encontrada' })
    @ApiExamplesResponse(404, HttpErrorDto, LocationNotFoundExamples, { description: 'Ubicación no encontrada' })
    findOne(@Param('id') id: string) {
        return this.locationsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar una ubicación' })
    @ApiOkResponse({ type: LocationResponseDto, description: 'Ubicación actualizada exitosamente' })
    @ApiExamplesResponse(404, HttpErrorDto, LocationNotFoundExamples, { description: 'Ubicación no encontrada' })
    @ApiExamplesResponse(409, HttpErrorDto, LocationConflictExamples, { description: 'Ya existe una ubicación con este nombre' })
    update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
        return this.locationsService.update(id, updateLocationDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar una ubicación' })
    @ApiNoContentResponse({ description: 'Ubicación eliminada exitosamente' })
    @ApiNotFoundResponse({ description: 'Ubicación no encontrada' })
    @ApiConflictResponse({ description: 'No se puede eliminar porque está siendo utilizada' })
    remove(@Param('id') id: string) {
        return this.locationsService.remove(id);
    }

    @Patch(':id/toggle-active')
    @ApiOperation({ summary: 'Activar/Desactivar una ubicación' })
    @ApiOkResponse({ type: LocationResponseDto, description: 'Estado de la ubicación actualizado' })
    @ApiExamplesResponse(404, HttpErrorDto, LocationNotFoundExamples, { description: 'Ubicación no encontrada' })

    toggleActive(@Param('id') id: string) {
        return this.locationsService.toggleActive(id);
    }
}
