import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BenefitsService } from '@modules/core/benefits/benefits.service';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { BenefitRequestDetailsDto } from '@modules/operations/requests/dto/details/benefit-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BenefitType } from '@modules/core/benefits/enums/benefit-type.enum';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { EmployeesService } from '@modules/core/employees/employees.service';
import { IRequestStrategy } from './request-strategy.interface';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { RequestStatus } from '@modules/operations/requests/enums/request-status.enum';

@Injectable()
export class BenefitStrategy implements IRequestStrategy {
    constructor(
        private readonly benefitsService: BenefitsService,
        // Inyectamos el repo de Request para consultar el consumo del mes
        @InjectRepository(Request)
        private readonly requestRepository: Repository<Request>,
        private readonly httpService: HttpService,
        private readonly employeesService: EmployeesService
    ) { }

    async validate(details: any, employeeId: string): Promise<void> {
        // 1. Validar DTO
        const dto = plainToInstance(BenefitRequestDetailsDto, details);
        const errors = await validate(dto);
        if (errors.length > 0) throw new BadRequestException('Datos inválidos');

        // ---------------------------------------------------------
        // 1. CORRECCIÓN #1: VALIDAR FECHAS PASADAS
        // ---------------------------------------------------------
        const requestDate = new Date(dto.date);

        // Creamos fecha de "hoy" sin horas para comparar solo días
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Ajustamos requestDate sin horas para la comparación
        const targetDate = new Date(requestDate);
        targetDate.setHours(0, 0, 0, 0);

        if (targetDate < today) {
            throw new BadRequestException('No se permiten solicitudes de beneficios para fechas pasadas.');
        }


        // ---------------------------------------------------------
        // 2. CORRECCIÓN #2: VALIDACIÓN EXTERNA DE IDO
        // ---------------------------------------------------------
        const idoRestrictedTypes = [
            BenefitType.REMOTE_SATURDAY,    // Sábado Remoto
            BenefitType.IDO_REST_SATURDAY   // Sábado Descanso IDO
        ];

        if (idoRestrictedTypes.includes(dto.benefitType)) {
            await this.validateIdoRequirement(employeeId, dto.date);
        }

        // 2. Determinar el mes objetivo basado en la FECHA DEL BENEFICIO (No de creación)
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();

        // 3. Obtener Cupo
        const quota = await this.benefitsService.getMonthlyQuota(employeeId, dto.benefitType);
        if (quota === 0) throw new BadRequestException(`No tienes asignado el beneficio: ${dto.benefitType}`);

        // 4. Buscar solicitudes existentes
        // Traemos todas las solicitudes de BENEFIT de este empleado que NO estén rechazadas/canceladas.
        // Nota: Es mejor filtrar las fechas en memoria porque filtrar JSON en SQL varía entre motores.
        const allBenefitRequests = await this.requestRepository.find({
            where: {
                employeeId,
                type: RequestType.BENEFIT,
                // No filtramos por createdAt aquí, lo haremos abajo por la fecha real dentro del JSON
            }
        });

        let consumed = 0;

        for (const req of allBenefitRequests) {
            // A. Ignorar solicitudes muertas
            if (req.status === RequestStatus.REJECTED || req.status === RequestStatus.CANCELLED) continue;

            // B. Ignorar otros tipos de beneficios (ej: si pido Home Office, ignoro los Sábados Remotos)
            if (req.details['benefitType'] !== dto.benefitType) continue;

            // C. CRÍTICO: Verificar si la solicitud pertenece al MISMO MES objetivo
            const reqDate = new Date(req.details['date']);
            if (reqDate.getMonth() === targetMonth && reqDate.getFullYear() === targetYear) {
                // Aquí sumamos APPROVED y PENDING
                consumed += Number(req.details['amount']);
            }
        }

        // 5. Validación Final
        // Consumido (Incluye Pendientes) + Nuevo > Cupo
        if ((consumed + dto.amount) > quota) {
            throw new BadRequestException(
                `Cupo excedido para ${dto.benefitType} en ${(targetMonth + 1)}/${targetYear}. ` +
                `Cupo: ${quota}, Usado+Pendiente: ${consumed}, Solicitado: ${dto.amount}`
            );
        }
    }

    /**
     * Lógica privada para consultar la API externa y validar el IDO
     */
    private async validateIdoRequirement(employeeId: string, dateString: string): Promise<void> {
        // A. Obtener datos del empleado (Email corporativo y Límite IDO)
        const employee = await this.employeesService.findOne(employeeId);

        console.log('[IDO Validation] Employee ID:', employeeId);
        console.log('[IDO Validation] Corporate Email:', employee.corporateEmail);
        console.log('[IDO Validation] IDO Limit:', employee.idoLimit);

        if (!employee.corporateEmail) {
            throw new BadRequestException('El empleado no tiene correo corporativo configurado para validar el IDO.');
        }

        // B. Preparar Payload para API Externa
        const apiUrl = 'https://tickets.strategee.us/tickets/getIDO';
        const payload = {
            email: employee.corporateEmail,
            fecha_solicitud: dateString, // Formato YYYY-MM-DD (viene del DTO)
            sabado: true
        };

        console.log('[IDO API Request] URL:', apiUrl);
        console.log('[IDO API Request] Payload:', JSON.stringify(payload, null, 2));

        try {
            // C. Hacer la petición POST
            // Usamos firstValueFrom para convertir el Observable de NestJS en una Promise
            const { data } = await firstValueFrom(
                this.httpService.post(apiUrl, payload)
            );

            console.log('[IDO API Response] Full Response:', JSON.stringify(data, null, 2));

            // Estructura esperada: { result: true, Response: { ido: "96.98", ... } }

            if (!data.result || !data.Response || !data.Response.ido) {
                // Si la API responde pero sin datos válidos
                console.warn('[IDO API Warning] Invalid structure detected');
                console.warn('[IDO API Warning] data.result:', data.result);
                console.warn('[IDO API Warning] data.Response:', data.Response);
                console.warn('[IDO API Warning] data.Response.ido:', data.Response?.ido);
                throw new BadRequestException('No se pudo verificar tu indicador IDO en el sistema externo.');
            }

            const idoValue = parseFloat(data.Response.ido);
            const idoLimit = Number(employee.idoLimit); // Asegurar que sea número

            console.log('[IDO Validation] IDO Value from API:', idoValue);
            console.log('[IDO Validation] IDO Limit from Employee:', idoLimit);
            console.log('[IDO Validation] Comparison:', idoValue > idoLimit ? 'PASS' : 'FAIL');

            // D. Validar Umbral
            if (idoValue <= idoLimit) {
                throw new BadRequestException(
                    `Tu indicador IDO (${idoValue}%) no supera el límite requerido (${idoLimit}%) para solicitar este beneficio.`
                );
            }

            console.log('[IDO Validation] ✓ Validation successful');
            // Si pasa, no retornamos nada (void), la validación es exitosa.

        } catch (error) {
            // Manejo de errores de conexión o lógica
            if (error instanceof BadRequestException) throw error;

            console.error('[IDO API Error] Exception caught:', error.message);
            console.error('[IDO API Error] Stack:', error.stack);
            console.error('[IDO API Error] Full error:', error);
            throw new InternalServerErrorException('Error de conexión al validar el indicador IDO. Intente más tarde.');
        }
    }



    async processBeforeSave(details: any): Promise<any> {
        return details; // Se guarda tal cual
    }

    async onApprove(request: Request): Promise<void> {
        // No necesitamos descontar de un Ledger porque el cálculo es dinámico por mes.
        // Podríamos enviar una notificación aquí.
        console.log(`Beneficio ${request.details['benefitType']} aprobado para ${request.employeeId}`);
    }

    async onReject(request: Request): Promise<void> {
        // Al rechazar, el estado cambia a REJECTED, por lo que la función 'validate'
        // dejará de sumar esta cantidad automáticamente la próxima vez.
    }

    getRequestType(): string {
        return RequestType.BENEFIT;
    }
}