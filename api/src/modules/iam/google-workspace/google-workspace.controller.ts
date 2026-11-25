import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { ActiveUser } from '../authorization/decorators/active-user.decorator';
import { GoogleWorkspaceService } from './google-workspace.service';
import { ConnectGoogleWorkspaceDto } from './dto/connect-google-workspace.dto';

@ApiTags('Google Workspace')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('google-workspace')
export class GoogleWorkspaceController {
    constructor(private readonly googleWorkspaceService: GoogleWorkspaceService) { }

    @Get('status')
    @ApiOperation({ summary: 'Estado de la conexión con Google Workspace y permisos requeridos' })
    getStatus(@ActiveUser('sub') userId: string, @ActiveUser('email') email: string) {
        return this.googleWorkspaceService.getStatus(userId, email);
    }

    @Post('connect')
    @ApiOperation({ summary: 'Guarda la autorización de Google Workspace a partir de un código de autorización' })
    connect(@ActiveUser('sub') userId: string, @Body() dto: ConnectGoogleWorkspaceDto) {
        return this.googleWorkspaceService.connect(userId, dto.code, dto.redirectUri ?? '');
    }

    @Delete('disconnect')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Revoca y elimina la autorización de Google Workspace' })
    async disconnect(@ActiveUser('sub') userId: string) {
        await this.googleWorkspaceService.disconnect(userId);
    }
}
