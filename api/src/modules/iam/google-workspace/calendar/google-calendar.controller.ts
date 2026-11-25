import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../authentication/guards/access-token.guard';
import { ActiveUser } from '../../authorization/decorators/active-user.decorator';
import { GoogleCalendarService } from './google-calendar.service';
import { CreateCalendarEventLinkDto, ListCalendarEventsDto } from './dto/calendar.dto';

@ApiTags('Google Calendar')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('google-calendar')
export class GoogleCalendarController {
    constructor(private readonly calendarService: GoogleCalendarService) { }

    @Get('status')
    @ApiOperation({ summary: 'Indica si el usuario tiene Google Calendar conectado' })
    getStatus(@ActiveUser('sub') userId: string, @ActiveUser('email') email: string) {
        return this.calendarService.getStatus(userId, email);
    }

    @Get('events')
    @ApiOperation({ summary: 'Eventos del calendario principal del usuario en un rango de fechas' })
    getEvents(@ActiveUser('sub') userId: string, @Query() query: ListCalendarEventsDto) {
        return this.calendarService.getEvents(userId, query);
    }

    @Delete('disconnect')
    @ApiOperation({ summary: 'Revoca el acceso de Google Workspace del usuario' })
    disconnect(@ActiveUser('sub') userId: string) {
        return this.calendarService.disconnect(userId);
    }

    @Get('event-links')
    @ApiOperation({ summary: 'Vínculos evento-acta del usuario' })
    getEventLinks(@ActiveUser('sub') userId: string) {
        return this.calendarService.getEventLinks(userId);
    }

    @Get('event-links/:googleEventId')
    @ApiOperation({ summary: 'Acta vinculada a un evento (null si no tiene)' })
    getEventLink(@ActiveUser('sub') userId: string, @Param('googleEventId') googleEventId: string) {
        return this.calendarService.getEventLink(userId, googleEventId);
    }

    @Post('event-links')
    @ApiOperation({ summary: 'Vincula un evento con un acta' })
    linkEventToMinute(@ActiveUser('sub') userId: string, @Body() dto: CreateCalendarEventLinkDto) {
        return this.calendarService.linkEventToMinute(userId, dto.googleEventId, dto.minuteId);
    }

    @Delete('event-links/:googleEventId')
    @ApiOperation({ summary: 'Desvincula el acta de un evento' })
    unlinkEvent(@ActiveUser('sub') userId: string, @Param('googleEventId') googleEventId: string) {
        return this.calendarService.unlinkEvent(userId, googleEventId);
    }
}
