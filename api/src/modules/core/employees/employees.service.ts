import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeSettings } from './entities/employee-settings.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeSettingsDto } from './dto/update-employee-settings.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { CreateEmployeeCredentialsDto } from './dto/create-employee-credentials.dto';
import { UsersService } from '@modules/iam/users/users.service';
import { PasswordResetService } from '@modules/iam/authentication/services/password-reset.service';
import * as crypto from 'crypto';
import { ResponseEmployeeDto } from './dto/response-empoyee.dto';
import { ContractsService } from '@modules/core/contracts/contracts.service';
import { GlobalParametersService } from '@modules/finance/global-parameters/global-parameters.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AuditLog } from '@modules/core/audit/entities/audit-log.entity';
import { EmployeeStatus } from './enums/employee-status.enum';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { EmployeeParafiscales } from '@modules/core/parafiscales/entities/employee-parafiscales.entity';
import { Role } from '@modules/iam/authorization/enums/role.enum';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(Employee)
        private readonly employeesRepository: Repository<Employee>,
        @InjectRepository(EmployeeSettings)
        private readonly employeeSettingsRepository: Repository<EmployeeSettings>,
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
        private readonly usersService: UsersService,
        private readonly passwordResetService: PasswordResetService,
        private readonly dataSource: DataSource,
        private readonly contractsService: ContractsService,
        private readonly globalParametersService: GlobalParametersService,
        private readonly httpService: HttpService,
    ) { }

    /**
     * Create employee record with personal data only
     */
    async create(createEmployeeDto: CreateEmployeeDto): Promise<ResponseEmployeeDto> {
        // Check if document number already exists
        const existingEmployee = await this.employeesRepository.findOne({
            where: { documentNumber: createEmployeeDto.documentNumber },
        });

        const existingCorporateEmail = await this.employeesRepository.findOne({
            where: { corporateEmail: createEmployeeDto.corporateEmail },
        });

        const existingPersonalEmail = await this.employeesRepository.findOne({
            where: { personalEmail: createEmployeeDto.personalEmail },
        });



        if (existingCorporateEmail) {
            throw new ConflictException(
                'Ya existe un empleado con este correo corporativo',
            );
        }
        if (existingPersonalEmail) {
            throw new ConflictException(
                'Ya existe un empleado con este correo personal',
            );
        }

        if (existingEmployee) {
            throw new ConflictException(
                'Ya existe un empleado con este número de documento',
            );
        }

        const employee = this.employeesRepository.create(
            {
                ...createEmployeeDto,
                corporateEmail: createEmployeeDto.corporateEmail || null,
            });
        return this.employeesRepository.save(employee);
    }

    /**
     * Find all employees with pagination
     */
    async findAll(
        page: number = 1,
        limit: number = 10,
        search?: string,
        hasCredentials?: boolean,
        contractStatus?: string,
        companyId?: string,
        status: EmployeeStatus = EmployeeStatus.ACTIVE,
    ): Promise<{
        data: Employee[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        const skip = (page - 1) * limit;

        const queryBuilder = this.employeesRepository.createQueryBuilder('employee');

        // Include user, profilePhoto and contracts relations
        queryBuilder.leftJoinAndSelect('employee.user', 'user');
        queryBuilder.leftJoinAndSelect('employee.profilePhoto', 'profilePhoto');
        queryBuilder.leftJoinAndSelect('employee.contracts', 'contracts');
        queryBuilder.leftJoinAndSelect('contracts.company', 'company');
        queryBuilder.leftJoinAndSelect('employee.company', 'employeeCompany');

        queryBuilder.andWhere('employee.status = :status', { status });
        if (search) {
            // Search by full name (firstName + lastName)
            queryBuilder.andWhere(
                `CONCAT(employee.firstName, ' ', employee.lastName) LIKE :search`,
                { search: `%${search}%` },
            );
        }

        // Filter by credentials
        if (hasCredentials !== undefined) {
            if (hasCredentials) {
                queryBuilder.andWhere('employee.user IS NOT NULL');
                queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
            } else {
                queryBuilder.andWhere('(employee.user IS NULL OR user.isActive = :isActive)', { isActive: false });
            }
        }

        // Filter by contract status
        if (contractStatus) {
            queryBuilder.andWhere('contracts.status = :contractStatus', { contractStatus });
        }

        // Filter by company
        if (companyId) {
            queryBuilder.andWhere(
                `(contracts.companyId = :companyId OR (employee.companyId = :companyId AND NOT EXISTS (
                    SELECT 1 FROM contracts ac WHERE ac.employee_id = employee.id AND ac.status = 'active'
                )))`,
                { companyId },
            );
        }

        queryBuilder
            .orderBy('employee.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Find one employee by ID
     */
    async findOne(id: string): Promise<Employee> {
        const employee = await this.employeesRepository.findOne({
            where: { id },
            relations: [
                'user',
                'profilePhoto',
                'benefitAllocations',
                'company',
                'position',
                'department',
                'contracts',
                'contracts.memorandums',
                'contracts.memorandums.position',
                'contracts.memorandums.department',
                'contracts.memorandums.schedule',
                'contracts.memorandums.location',
                'compensations'
            ],
            order: {
                contracts: {
                    createdAt: 'DESC',
                }
            } as any
        });

        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }

        // Filter active compensations and resolve global parameters
        if (employee.compensations) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const activeCompensations: import('../../finance/compensation/entities/compensation.entity').Compensation[] = [];

            for (const compensation of employee.compensations) {
                const startDate = new Date(compensation.startDate);
                const endDate = compensation.endDate ? new Date(compensation.endDate) : null;
                startDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(0, 0, 0, 0);

                const isActive = compensation.isActive && (
                    (!endDate || endDate >= now) ||
                    (compensation.paymentDate && new Date(compensation.paymentDate) >= now)
                );

                if (isActive) {
                    if (compensation.isLinkedGlobalParameter && compensation.linkedGlobalParameter) {
                        try {
                            const value = await this.globalParametersService.getValue(compensation.linkedGlobalParameter);
                            compensation.amount = value;
                        } catch (error) {
                            // If parameter not found, maybe keep existing amount or set to 0.
                            // For now, let's log and keep existing (or 0 if null)
                            console.warn(`Could not fetch global parameter ${compensation.linkedGlobalParameter} for compensation ${compensation.id}`);
                        }
                    }
                    activeCompensations.push(compensation);
                }
            }
            employee.compensations = activeCompensations;
        } else {
            employee.compensations = [];
        }

        const activeContract = await this.contractsService.findActiveByEmployee(id);
        (employee as any).contract = activeContract || null;

        return employee;
    }

    async findProfile(id: string) {
        const employee = await this.employeesRepository.findOne({
            where: { id },
            relations: [
                'profilePhoto',
                'company',
                'position',
                'department',
            ],
        });

        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }

        // Obtener el contrato activo con toda su información
        const activeContract = await this.contractsService.findActiveByEmployee(id);

        // Estructura organizada del perfil
        const profile = {
            // Datos principales del empleado
            employee: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                documentNumber: employee.documentNumber,
                documentType: employee.documentType,
                birthDate: employee.birthDate,
                gender: employee.gender,
                address: employee.address,
                personalPhone: employee.personalPhone,
                personalEmail: employee.personalEmail,
                corporateEmail: employee.corporateEmail,
                photoUrl: employee.photoUrl,
                profilePhoto: employee.profilePhoto,
                isActive: employee.isActive,
            },
            // Datos laborales guardados en la información personal (se usan si no hay contrato activo)
            employment: {
                hireDate: employee.hireDate,
                contractType: employee.contractType,
                company: employee.company ? { id: employee.company.id, name: employee.company.name } : null,
                position: employee.position ? { id: employee.position.id, name: employee.position.name } : null,
                department: employee.department ? { id: employee.department.id, name: employee.department.name } : null,
            },
            // Información del contrato y memorando vigente
            currentContract: activeContract ? {
                contractId: activeContract.id,
                contractNumber: activeContract.contractNumber,
                startDate: activeContract.startDate,
                endDate: activeContract.endDate,
                type: activeContract.type,
                status: activeContract.status,
                // Información del memorando vigente
                currentMemorandum: activeContract.memorandums && activeContract.memorandums.length > 0 ? {
                    memorandumId: activeContract.memorandums[0].id,
                    startDate: activeContract.memorandums[0].startDate,
                    endDate: activeContract.memorandums[0].endDate,
                    salaryType: activeContract.memorandums[0].salaryType,
                    salaryAmount: activeContract.memorandums[0].salaryAmount,
                    // Cargo/Puesto
                    position: activeContract.memorandums[0].position ? {
                        id: activeContract.memorandums[0].position.id,
                        name: activeContract.memorandums[0].position.name,
                        riskLevel: activeContract.memorandums[0].position.riskLevel,
                    } : null,
                    // Área/Departamento
                    department: activeContract.memorandums[0].department ? {
                        id: activeContract.memorandums[0].department.id,
                        name: activeContract.memorandums[0].department.name,
                        costCenterCode: activeContract.memorandums[0].department.costCenterCode,
                    } : null,
                    // Empresa/Ubicación
                    location: activeContract.memorandums[0].location ? {
                        id: activeContract.memorandums[0].location.id,
                        name: activeContract.memorandums[0].location.name,
                        description: activeContract.memorandums[0].location.description,
                    } : null,
                    // Horario
                    schedule: activeContract.memorandums[0].schedule ? {
                        id: activeContract.memorandums[0].schedule.id,
                        name: activeContract.memorandums[0].schedule.name,
                        description: activeContract.memorandums[0].schedule.description,
                    } : null,
                } : null,
            } : null,
        };

        return profile;
    }


    /**
     * Update employee personal data
     */
    async update(
        id: string,
        updateEmployeeDto: UpdateEmployeeDto,
    ): Promise<Employee> {
        const employee = await this.findOne(id);

        // Check if document number is being changed and if it already exists
        if (
            updateEmployeeDto.documentNumber &&
            updateEmployeeDto.documentNumber !== employee.documentNumber
        ) {
            const existingEmployee = await this.employeesRepository.findOne({
                where: { documentNumber: updateEmployeeDto.documentNumber },
            });

            if (existingEmployee) {
                throw new ConflictException(
                    'Ya existe un empleado con este número de documento',
                );
            }
        }

        Object.assign(employee, updateEmployeeDto);
        // Las relaciones cargadas tienen prioridad sobre los IDs al guardar; se descartan si el ID cambió
        if ('companyId' in updateEmployeeDto) employee.company = undefined as any;
        if ('positionId' in updateEmployeeDto) employee.position = undefined as any;
        if ('departmentId' in updateEmployeeDto) employee.department = undefined as any;
        await this.employeesRepository.save(employee);
        return this.findOne(id);
    }

    /**
     * Grant system access to employee by creating user credentials
     * Uses transaction to ensure atomicity
     * Sends password setup email to employee
     */
    async createCredentials(
        employeeId: string,
        credentialsDto: CreateEmployeeCredentialsDto,
    ): Promise<Employee> {
        // Verify employee exists
        const employee = await this.findOne(employeeId);

        // Check if employee already has active credentials
        if (employee.user && employee.user.isActive) {
            throw new BadRequestException(
                'Este empleado ya tiene credenciales de acceso asignadas',
            );
        }

        // Use transaction to ensure atomicity
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (!employee.corporateEmail) {
                throw new BadRequestException('El empleado no tiene correo corporativo asignado');
            }

            // Check if user exists but is inactive (reactivation case)
            if (employee.user && !employee.user.isActive) {
                const userId = employee.user.id;

                // Reactivate the user and update roles
                await queryRunner.manager.update('users', { id: userId }, {
                    isActive: true,
                    roles: credentialsDto.roles,
                });

                // Commit transaction
                await queryRunner.commitTransaction();

                // Send welcome email with password setup link (24-hour expiry)
                await this.passwordResetService.sendFirstTimeSetupEmail(
                    employee.corporateEmail,
                    employee.firstName,
                );

                // Return updated employee with user relation
                return this.employeesRepository.findOne({
                    where: { id: employeeId },
                    relations: ['user'],
                }) as Promise<Employee>;
            }

            // Generate strong temporary password (will be replaced when user sets their own)
            const temporaryPassword = crypto.randomBytes(32).toString('hex');

            // Create user account with temporary password
            const user = await this.usersService.create({
                email: employee.corporateEmail,
                password: temporaryPassword,
                roles: credentialsDto.roles,
            });

            // Link user to employee
            employee.user = user;
            await queryRunner.manager.save(employee);

            // Commit transaction
            await queryRunner.commitTransaction();

            // Send welcome email with password setup link (24-hour expiry)
            await this.passwordResetService.sendFirstTimeSetupEmail(
                employee.corporateEmail,
                employee.firstName,
            );

            // Return updated employee with user relation
            return this.employeesRepository.findOne({
                where: { id: employeeId },
                relations: ['user'],
            }) as Promise<Employee>;
        } catch (error) {
            // Rollback on error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Release query runner
            await queryRunner.release();
        }
    }
    /**
     * Aprueba una solicitud de registro pendiente: activa al empleado, crea sus
     * credenciales (rol EMPLOYEE) y envía el correo de bienvenida para configurar
     * la contraseña. Requiere correo corporativo (es el usuario de acceso).
     */
    async approveRegistration(id: string): Promise<Employee> {
        const employee = await this.findOne(id);
        if (employee.status !== EmployeeStatus.PENDING) {
            throw new BadRequestException('Este empleado no tiene una solicitud pendiente');
        }
        if (!employee.corporateEmail) {
            throw new BadRequestException(
                'Asigna un correo corporativo al empleado antes de aprobar: es el usuario con el que iniciará sesión',
            );
        }
        const missing: string[] = [];
        if (!employee.hireDate) missing.push('fecha de ingreso');
        if (!employee.contractType) missing.push('tipo de contrato');
        if (missing.length) {
            throw new BadRequestException(`Completa antes de aprobar: ${missing.join(', ')}`);
        }

        // Activar primero para que las validaciones posteriores lo vean como empleado vigente
        await this.employeesRepository.update({ id }, { status: EmployeeStatus.ACTIVE, isActive: true });
        try {
            // Crea el usuario y envía el correo de bienvenida (configurar contraseña)
            await this.createCredentials(id, { roles: [Role.EMPLOYEE] });
        } catch (error) {
            await this.employeesRepository.update({ id }, { status: EmployeeStatus.PENDING, isActive: false });
            throw error;
        }
        return this.findOne(id);
    }

    /**
     * Rechaza una solicitud pendiente eliminando el registro (y sus contactos y parafiscales).
     */
    async rejectRegistration(id: string): Promise<void> {
        const employee = await this.employeesRepository.findOne({ where: { id } });
        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }
        if (employee.status !== EmployeeStatus.PENDING) {
            throw new BadRequestException('Solo se pueden rechazar solicitudes pendientes');
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.delete(EmergencyContact, { employeeId: id });
            await manager.delete(EmployeeParafiscales, { employeeId: id });
            await manager.delete(Employee, { id });
        });
    }

    /**
     * Soft delete employee (set isActive to false)
     */
    async remove(id: string): Promise<void> {
        const employee = await this.findOne(id);
        employee.isActive = false;
        await this.employeesRepository.save(employee);
    }

    /**
     * Update employee profile photo
     */
    async updateProfilePhoto(
        id: string,
        profilePhotoId: string | null,
    ): Promise<Employee> {
        const employee = await this.findOne(id);

        if (profilePhotoId) {
            // Verify attachment exists
            // Note: You might want to add validation here to ensure the attachment exists
            employee.profilePhoto = { id: profilePhotoId } as any;
        } else {
            employee.profilePhoto = null;
        }

        return this.employeesRepository.save(employee);
    }

    /**
     * Delete employee credentials (revoke system access)
     */
    async deleteCredentials(employeeId: string): Promise<void> {
        // Verify employee exists
        const employee = await this.findOne(employeeId);

        // Check if employee has credentials
        if (!employee.user) {
            throw new BadRequestException(
                'Este empleado no tiene credenciales de acceso asignadas',
            );
        }

        // Use transaction to ensure atomicity
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const userId = employee.user.id;

            // Delete all sessions for this user first (within transaction)
            await queryRunner.manager.delete('sessions', { userId });

            // Delete all password reset tokens for this user (within transaction)
            await queryRunner.manager.delete('password_reset_tokens', { userId });

            // Deactivate the user account instead of deleting it
            await queryRunner.manager.update('users', { id: userId }, { isActive: false });

            // Commit transaction
            await queryRunner.commitTransaction();
        } catch (error) {
            // Rollback on error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Release query runner
            await queryRunner.release();
        }
    }

    /**
     * Get employee IDO from external API
     */
    async getEmployeeIdo(employeeId: string) {
        const employee = await this.findOne(employeeId);

        if (!employee.corporateEmail) {
            throw new BadRequestException('El empleado no tiene correo corporativo configurado para consultar el IDO.');
        }

        // Obtener fecha actual en formato YYYY-MM-DD
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const apiUrl = 'https://tickets.strategee.us/tickets/getIDO';
        const payload = {
            email: employee.corporateEmail,
            fecha_solicitud: dateString,
            sabado: false
        };

        console.log('[IDO Query] Employee ID:', employeeId);
        console.log('[IDO Query] Corporate Email:', employee.corporateEmail);
        console.log('[IDO Query] Date:', dateString);
        console.log('[IDO Query] Payload:', JSON.stringify(payload, null, 2));

        try {
            const { data } = await firstValueFrom(
                this.httpService.post(apiUrl, payload)
            );

            console.log('[IDO Query] Response:', JSON.stringify(data, null, 2));

            if (!data.result || !data.Response || !data.Response.ido) {
                console.warn('[IDO Query] Invalid response structure');
                throw new BadRequestException('No se pudo obtener el IDO desde el sistema externo.');
            }

            const idoValue = parseFloat(data.Response.ido);
            const idoLimit = Number(employee.idoLimit);

            console.log('[IDO Query] IDO Value:', idoValue);
            console.log('[IDO Query] IDO Limit:', idoLimit);
            console.log('[IDO Query] Meets Requirement:', idoValue > idoLimit);

            return {
                ido: idoValue,
                idoLimit: idoLimit,
                meetsRequirement: idoValue > idoLimit,
                consultedAt: new Date().toISOString(),
                date: dateString
            };

        } catch (error) {
            console.error('[IDO Query] Error:', error.message);
            console.error('[IDO Query] Stack:', error.stack);
            
            if (error instanceof BadRequestException) {
                throw error;
            }
            
            throw new InternalServerErrorException('Error al consultar el IDO desde el sistema externo. Intente más tarde.');
        }
    }

    /**
     * Get employee settings, creates default if not exists
     */
    async getSettings(employeeId: string): Promise<EmployeeSettings> {
        await this.findOne(employeeId);

        let settings = await this.employeeSettingsRepository.findOne({
            where: { employeeId },
        });

        if (!settings) {
            settings = this.employeeSettingsRepository.create({ employeeId });
            settings = await this.employeeSettingsRepository.save(settings);
        }

        return settings;
    }

    /**
     * Update employee settings
     */
    async updateSettings(employeeId: string, dto: UpdateEmployeeSettingsDto): Promise<EmployeeSettings> {
        const settings = await this.getSettings(employeeId);
        Object.assign(settings, dto);
        return this.employeeSettingsRepository.save(settings);
    }

    /**
     * Update employee contact info (address, phone, personalEmail) and log the change
     */
    async updateContactInfo(
        employeeId: string,
        dto: UpdateContactInfoDto,
        userId: string,
    ): Promise<Employee> {
        const employee = await this.employeesRepository.findOne({ where: { id: employeeId } });
        if (!employee) throw new NotFoundException('Empleado no encontrado');

        // Check personalEmail uniqueness if being changed
        if (dto.personalEmail && dto.personalEmail !== employee.personalEmail) {
            const existing = await this.employeesRepository.findOne({
                where: { personalEmail: dto.personalEmail },
            });
            if (existing) throw new ConflictException('Ya existe un empleado con este correo personal');
        }

        // Build changes log: only record fields that actually changed
        const fieldLabels: Record<string, string> = {
            address: 'Dirección',
            phone: 'Teléfono Personal',
            personalEmail: 'Email Personal',
        };

        const changes: Record<string, { from: string | null; to: string }> = {};

        if (dto.address !== undefined && dto.address !== employee.address) {
            changes['address'] = { from: employee.address, to: dto.address };
            employee.address = dto.address;
        }
        if (dto.phone !== undefined && dto.phone !== employee.personalPhone) {
            changes['phone'] = { from: employee.personalPhone, to: dto.phone };
            employee.personalPhone = dto.phone;
        }
        if (dto.personalEmail !== undefined && dto.personalEmail !== employee.personalEmail) {
            changes['personalEmail'] = { from: employee.personalEmail, to: dto.personalEmail };
            employee.personalEmail = dto.personalEmail;
        }

        if (Object.keys(changes).length === 0) {
            // Nothing changed — return as-is
            return employee;
        }

        const saved = await this.employeesRepository.save(employee);

        // Write audit log
        const log = this.auditLogRepository.create({
            entityName: 'Employee',
            entityId: employeeId,
            action: 'update_contact_info',
            userId,
            changes: {
                fields: Object.entries(changes).map(([key, val]) => ({
                    field: key,
                    label: fieldLabels[key] ?? key,
                    from: val.from,
                    to: val.to,
                })),
            },
        });
        await this.auditLogRepository.save(log);

        return saved;
    }

    /**
     * Get contact info change logs for an employee
     */
    async getContactInfoLogs(employeeId: string): Promise<any[]> {
        const logs = await this.auditLogRepository.find({
            where: { entityName: 'Employee', entityId: employeeId, action: 'update_contact_info' },
            order: { createdAt: 'DESC' },
        });

        // Enrich with user name
        const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))];
        const users = userIds.length
            ? await this.dataSource
                .getRepository('users')
                .createQueryBuilder('u')
                .leftJoinAndSelect('u.employee', 'e')
                .where('u.id IN (:...ids)', { ids: userIds })
                .getMany()
            : [];

        const userMap = new Map(
            users
                .filter((u: any) => u.employee)
                .map((u: any) => [u.id, `${u.employee.firstName} ${u.employee.lastName}`]),
        );

        return logs.map(log => ({
            id: log.id,
            createdAt: log.createdAt,
            changedBy: log.userId ? (userMap.get(log.userId) ?? 'Usuario desconocido') : 'Sistema',
            fields: log.changes?.fields ?? [],
        }));
    }

}
