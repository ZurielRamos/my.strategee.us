import { Controller, Post, Body, Get, UseGuards, Query, ValidationPipe, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { FilterRequestsDto } from './dto/filter-request.dto';
import { Request as RequestEntity } from './entities/request.entity';
import { ProcessRequestDto } from './dto/processs-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { PaginatedResult } from '@common/interfaces/pagination.interface';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { RequestType } from './enums/request-type.enum';
import { VacationDetailsDto } from './dto/details/vacation-details.dto';
import { SickLeaveDetailsDto } from './dto/details/sick-leave-details.dto';
import { OrdinaryPermissionDetailsDto } from './dto/details/ordinary-permission-details.dto';
import { MedicalAppointmentDetailsDto } from './dto/details/medical-appointment-details.dto';
import { DocumentDetailsDto, DocumentType } from './dto/details/document-details.dto';
import { BirthdayRequestDetailsDto, DayShift } from './dto/details/birthday-details.dto';
import { BenefitType } from '@modules/core/benefits/enums/benefit-type.enum';
import { BenefitRequestDetailsDto } from './dto/details/benefit-details.dto';

@ApiTags('Solicitudes de Empleados (Unified Inbox)')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) { }

  @Post()
  @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
  @ApiBody({
    type: CreateRequestDto,
    description: 'Tipos de solicitudes: vacation, document, etc.',
    examples: {
      vacation: {
        summary: 'Solicitud de vacaciones',
        value: {
          type: RequestType.VACATION,
          details: {
            startDate: '2022-01-01',
            endDate: '2022-01-05',
            comments: 'Vacaciones',
          } as VacationDetailsDto
        } as CreateRequestDto,
      },
      sick_leave: {
        summary: 'Solicitud de incapacidad',
        value: {
          type: RequestType.SICK_LEAVE,
          details: {
            startDate: '2022-01-01',
            endDate: '2022-01-05',
            comments: 'Incapacidad',
          } as SickLeaveDetailsDto
        } as CreateRequestDto,
      },
      ordinary_leave: {
        summary: 'Solicitud de permiso ordinario',
        value: {
          type: RequestType.ORDINARY_PERMISSION,
          details: {
            exitDateTime: '2022-01-01T12:00:00',
            returnDateTime: '2022-01-01T12:00:00',
            isUpToDate: true,
            reason: 'Permiso ordinario',
            makeupProposal: 'Propuesta de reposición del tiempo',
          } as OrdinaryPermissionDetailsDto
        } as CreateRequestDto,
      },
      medical_appointment: {
        summary: 'Solicitud de permiso medico',
        value: {
          type: RequestType.MEDICAL_APPOINTMENT,
          details: {
            exitDateTime: '2022-01-01T12:00:00',
            returnDateTime: '2022-01-01T12:00:00',
            attachmentUrl: 'https://example.com',
          } as MedicalAppointmentDetailsDto
        } as CreateRequestDto,
      },
      document: {
        summary: 'Solicitud de documento',
        value: {
          type: RequestType.DOCUMENT,
          details: {
            documentType: DocumentType.LABOR_CERTIFICATE,
            addressedTo: 'Dirigido a',
          } as DocumentDetailsDto
        } as CreateRequestDto,
      },
      birthday: {
        summary: 'Solicitud de cumpleaños',
        value: {
          type: RequestType.BIRTHDAY,
          details: {
            date: '2022-01-01',
            shift: DayShift.MORNING,
          } as BirthdayRequestDetailsDto
        } as CreateRequestDto,
      },
      benefit: {
        summary: 'Solicitud de Beneficio',
        value: {
          type: RequestType.BENEFIT,
          details: {
            benefitType: BenefitType.IDO_REST_SATURDAY,
            date: '2022-01-01',
            amount: 1,
          } as BenefitRequestDetailsDto
        } as CreateRequestDto,
      },
    },
  })
  @ApiOperation({ summary: 'Crear una solicitud (Vacaciones, Documentos, etc).' })
  create(@ActiveUser('employeeId') employeeId: string, @Body() createDto: CreateRequestDto) {
    console.log(employeeId)
    return this.requestsService.create(employeeId, createDto);
  }

  @Get('my-requests')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Listar mis solicitudes con filtros y paginación.' })
  @ApiResponse({ status: 200, description: 'Mis solicitudes paginadas.' })
  findAllMyRequests(
    @ActiveUser('employeeId') employeeId: string,
    @Query(new ValidationPipe({ transform: true })) query: FilterRequestsDto
  ): Promise<PaginatedResult<RequestEntity>> {
    console.log('my-requests endpoint called with:', { employeeId, query });
    return this.requestsService.findAllByEmployee(employeeId, query);
  }



  @Get('admin')
  @Roles(Role.ADMIN) // 👈 Solo Administradores
  @ApiOperation({ summary: 'Listar todas las solicitudes (Admin) con filtros y paginación.' })
  @ApiResponse({ status: 200, description: 'Bandeja de entrada administrativa paginada.' })
  async findAllAdmin(
    @Query(new ValidationPipe({ transform: true })) query: FilterRequestsDto
  ): Promise<PaginatedResult<RequestEntity>> {

    return this.requestsService.findAll(query);
  }






  @Patch(':id/approve')
  @Roles(Role.ADMIN) // 🔒 Solo Admin
  @ApiOperation({ summary: 'Aprobar una solicitud (Admin). Ejecuta lógica de negocio asociada.' })
  approve(@Param('id') id: string, @Body() processDto: ProcessRequestDto) {
    return this.requestsService.approve(+id, processDto);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN) // 🔒 Solo Admin
  @ApiOperation({ summary: 'Rechazar una solicitud (Admin).' })
  reject(@Param('id') id: string, @Body() processDto: ProcessRequestDto) {
    return this.requestsService.reject(+id, processDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar mi propia solicitud (Solo si está pendiente).' })
  cancel(@Param('id') id: string, @ActiveUser('employeeId') employeeId: string) {
    return this.requestsService.cancel(+id, employeeId);
  }

  @Patch(':id')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar mi propia solicitud (Solo si está pendiente).' })
  update(
    @Param('id') id: string,
    @ActiveUser('employeeId') employeeId: string,
    @Body() updateDto: UpdateRequestDto
  ) {
    return this.requestsService.update(+id, employeeId, updateDto);
  }
}