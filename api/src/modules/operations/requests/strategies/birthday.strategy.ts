import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { IRequestStrategy } from './request-strategy.interface';
import { BenefitsService } from '@modules/core/benefits/benefits.service';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { RequestStatus } from '@modules/operations/requests/enums/request-status.enum';
import { BenefitType } from '@modules/core/benefits/enums/benefit-type.enum';
import { BirthdayRequestDetailsDto } from '@modules/operations/requests/dto/details/birthday-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EmployeesService } from '@modules/core/employees/employees.service';

@Injectable()
export class BirthdayStrategy implements IRequestStrategy {
    constructor(
        private readonly employeesService: EmployeesService,
        private readonly benefitsService: BenefitsService,
        @InjectRepository(Request)
        private readonly requestRepository: Repository<Request>
    ) { }

    async validate(details: any, employeeId: string): Promise<void> {
        const dto = plainToInstance(BirthdayRequestDetailsDto, details);
        const errors = await validate(dto);
        if (errors.length > 0) throw new BadRequestException('Datos inválidos para cumpleaños');

        // 1. Obtener datos del empleado
        const employee = await this.employeesService.findOne(employeeId);
        if (!employee.birthDate) {
            throw new BadRequestException('No tienes registrada tu fecha de nacimiento. Contacta a RRHH.');
        }

        // Parsear requestedDate sin conversión de zona horaria
        const requestedDateStr = String(dto.date).split('T')[0];
        const [reqYear, reqMonth, reqDay] = requestedDateStr.split('-').map(Number);
        const requestedDate = new Date(reqYear, reqMonth - 1, reqDay);
        const requestYear = requestedDate.getFullYear();

        // 2. Verificar DUPLICIDAD (Solo uno por año calendario)
        // Buscamos solicitudes de CUMPLEAÑOS en el mismo AÑO de la fecha solicitada
        const startOfYear = new Date(requestYear, 0, 1);
        const endOfYear = new Date(requestYear, 11, 31);

        const existingRequests = await this.requestRepository.find({
            where: {
                employeeId,
                type: RequestType.BIRTHDAY,
                status: Not(In([RequestStatus.REJECTED, RequestStatus.CANCELLED])), // Ignoramos rechazadas
                createdAt: Between(startOfYear, endOfYear) // Ojo: mejor filtrar por la fecha dentro del JSON en memoria si la DB es grande, pero para rango anual esto funciona bien como primer filtro.
            }
        });

        // Verificación exacta buscando en el JSON para asegurar que es del mismo año fiscal
        const alreadyTaken = existingRequests.some(req => {
            const reqDate = new Date(req.details['date']);
            return reqDate.getFullYear() === requestYear;
        });

        if (alreadyTaken) {
            throw new BadRequestException(`Ya has solicitado tu beneficio de cumpleaños para el año ${requestYear}.`);
        }

        // 3. Calcular Ventana de Validez (Fecha Cumpleaños -> +1 Mes)
        // Parsear birthDate sin conversión de zona horaria
        const birthDateStr = String(employee.birthDate).split('T')[0];
        const [birthYear, birthMonth, birthDay] = birthDateStr.split('-').map(Number);
        const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

        // Construimos el cumpleaños de ESTE año (o del año de la solicitud)
        const currentBirthday = new Date(requestYear, birthDate.getMonth(), birthDate.getDate());
        const expirationDate = new Date(currentBirthday);
        expirationDate.setMonth(expirationDate.getMonth() + 1);

        // Ajuste: El día solicitado debe ser >= Cumpleaños Y <= Expiración
        // Normalizamos horas
        requestedDate.setHours(0, 0, 0, 0);
        currentBirthday.setHours(0, 0, 0, 0);
        expirationDate.setHours(23, 59, 59, 999);

        const isValidDate = requestedDate >= currentBirthday && requestedDate <= expirationDate;

        if (!isValidDate) {
            // 4. LÓGICA DE REACTIVACIÓN (Override del Admin)
            // Si la fecha no es válida, verificamos si el Admin le dio una "Extensión"
            const extensionQuota = await this.benefitsService.getMonthlyQuota(employeeId, BenefitType.BIRTHDAY_EXTENSION);

            if (extensionQuota >= 0.5) {
                // Si tiene cupo de extensión, permitimos la solicitud (y consumiremos ese cupo en onApprove si quisieras, 
                // pero como la allocation es mensual, simplemente validamos que exista).
                return; // ✅ VALIDACIÓN EXITOSA POR EXTENSIÓN
            }

            // Formatear fechas correctamente en formato dd/mm/yyyy
            const formatDate = (date: Date): string => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            };

            throw new BadRequestException(
                `El beneficio solo es válido entre ${formatDate(currentBirthday)} y ${formatDate(expirationDate)}. ` +
                `Si necesitas reactivarlo, solicita una extensión al Administrador.`
            );
        }
    }

    async processBeforeSave(details: any): Promise<any> {
        return details;
    }

    async onApprove(request: Request): Promise<void> {
        // 1. Verificamos si el empleado tenía una extensión/reactivación asignada
        const extensionQuota = await this.benefitsService.getMonthlyQuota(
            request.employeeId,
            BenefitType.BIRTHDAY_EXTENSION
        );

        // 2. Si tenía cupo de extensión (independientemente de si lo usó o si la fecha era válida por sí sola),
        // lo eliminamos para limpiar el registro, ya que el beneficio ya fue otorgado.
        if (extensionQuota > 0) {
            await this.benefitsService.removeAllocation(
                request.employeeId,
                BenefitType.BIRTHDAY_EXTENSION
            );
            console.log(`[Cumpleaños] Extensión consumida y eliminada para el empleado ${request.employeeId}`);
        }
    }

    async onReject(request: Request): Promise<void> {
        // Nada especial
    }

    getRequestType(): string {
        return RequestType.BIRTHDAY;
    }
}