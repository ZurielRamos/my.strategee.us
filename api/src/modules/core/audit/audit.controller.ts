import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService, AuditLogWithUser } from './audit.service';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get(':entityName/:entityId')
    @ApiOperation({ summary: 'Obtener historial de auditoría de una entidad' })
    async getEntityAuditHistory(
        @Param('entityName') entityName: string,
        @Param('entityId') entityId: string,
    ): Promise<AuditLogWithUser[]> {
        return this.auditService.findByEntity(entityName, entityId);
    }
}
