import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { BahamasService } from './bahamas.service';
import { ApiKeyAuth } from '../api-keys/decorators/api-key.decorator';

@ApiTags('Bahamas Integration')
@Controller('integration/bahamas')
export class BahamasIntegrationController {
    constructor(private readonly bahamasService: BahamasService) {}

    @Get('config')
    @ApiKeyAuth()
    @ApiOperation({
        summary: 'Obtener configuración de Bahamas para integración',
        description: 'Endpoint protegido por API Key. Devuelve la configuración completa incluyendo datos de WhatsApp y horarios.',
    })
    @ApiResponse({
        status: 200,
        description: 'Configuración de integración',
        schema: {
            type: 'object',
            properties: {
                whatsapp: {
                    type: 'object',
                    properties: {
                        instanceName: { type: 'string', example: 'bahamas-bot' },
                        apiUrl: { type: 'string', example: 'https://evolution.example.com' },
                        apiKey: { type: 'string', example: 'evo-api-key-here' },
                    },
                },
                schedule: {
                    type: 'object',
                    properties: {
                        morning: {
                            type: 'object',
                            properties: {
                                start: { type: 'string', example: '07:00' },
                                end: { type: 'string', example: '09:00' },
                                delivery: { type: 'string', example: '10:00' },
                            },
                        },
                        afternoon: {
                            type: 'object',
                            properties: {
                                start: { type: 'string', example: '12:00' },
                                end: { type: 'string', example: '14:00' },
                                delivery: { type: 'string', example: '15:00' },
                            },
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'API key inválida o no proporcionada' })
    @ApiResponse({ status: 404, description: 'Configuración incompleta' })
    getIntegrationConfig() {
        return this.bahamasService.getIntegrationConfig();
    }
}
