import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vault } from './entities/vault.entity';
import { Credential } from './entities/credential.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Company } from '@modules/organization/companies/entities/company.entity';
import { Area } from '@modules/organization/areas/entities/area.entity';
import { Position } from '@modules/organization/positions/entities/position.entity';
import { CredentialVisibilityCompany } from './entities/credential-visibility-company.entity';
import { CredentialVisibilityArea } from './entities/credential-visibility-area.entity';
import { CredentialVisibilityPosition } from './entities/credential-visibility-position.entity';
import { CredentialVisibilityEmployee } from './entities/credential-visibility-employee.entity';
import { CredentialAccessLog } from './entities/credential-access-log.entity';
import { CreateVaultDto } from './dto/create-vault.dto';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';
import { EncryptionService } from './services/encryption.service';
import { AccessControlService } from './services/access-control.service';
import { VisibilityLevel } from './enums/visibility-level.enum';

@Injectable()
export class PasswordVaultService {
    constructor(
        @InjectRepository(Vault)
        private readonly vaultRepository: Repository<Vault>,
        @InjectRepository(Credential)
        private readonly credentialRepository: Repository<Credential>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Company)
        private readonly companyRepository: Repository<Company>,
        @InjectRepository(Area)
        private readonly areaRepository: Repository<Area>,
        @InjectRepository(Position)
        private readonly positionRepository: Repository<Position>,
        @InjectRepository(CredentialVisibilityCompany)
        private readonly credentialVisibilityCompanyRepository: Repository<CredentialVisibilityCompany>,
        @InjectRepository(CredentialVisibilityArea)
        private readonly credentialVisibilityAreaRepository: Repository<CredentialVisibilityArea>,
        @InjectRepository(CredentialVisibilityPosition)
        private readonly credentialVisibilityPositionRepository: Repository<CredentialVisibilityPosition>,
        @InjectRepository(CredentialVisibilityEmployee)
        private readonly credentialVisibilityEmployeeRepository: Repository<CredentialVisibilityEmployee>,
        @InjectRepository(CredentialAccessLog)
        private readonly credentialAccessLogRepository: Repository<CredentialAccessLog>,
        private readonly encryptionService: EncryptionService,
        private readonly accessControlService: AccessControlService,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Crea un nuevo vault para un empleado
     * Requisitos: 13.1, 13.2, 13.3, 13.4
     */
    async createVault(employeeId: string, createVaultDto: CreateVaultDto): Promise<Vault> {
        // Validar que el empleado existe y está activo
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
        });

        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }

        if (!employee.isActive) {
            throw new ForbiddenException('El empleado no está activo');
        }

        // Crear vault con ownerId del empleado autenticado
        const vault = this.vaultRepository.create({
            name: createVaultDto.name,
            description: createVaultDto.description,
            ownerId: employeeId,
        });

        // Guardar y retornar vault creado (timestamps se establecen automáticamente)
        return await this.vaultRepository.save(vault);
    }

    /**
     * Crea una nueva credencial con cifrado y control de visibilidad
     * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 11.6, 11.7, 11.8, 11.9
     */
    async createCredential(
        employeeId: string,
        createCredentialDto: CreateCredentialDto,
    ): Promise<Credential> {
        // Validar que el empleado existe y está activo
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
        });

        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }

        if (!employee.isActive) {
            throw new ForbiddenException('El empleado no está activo');
        }

        // Validar que el vault existe y pertenece al empleado
        const vault = await this.vaultRepository.findOne({
            where: { id: createCredentialDto.vaultId },
        });

        if (!vault) {
            throw new NotFoundException('Vault no encontrado');
        }

        if (vault.ownerId !== employeeId) {
            throw new ForbiddenException('El vault no pertenece al empleado');
        }

        // Validar existencia de entidades según visibilityLevel
        await this.validateVisibilityEntities(createCredentialDto);

        // Cifrar username y password
        const encryptedUsername = this.encryptionService.encrypt(
            createCredentialDto.username,
        );
        const encryptedPassword = this.encryptionService.encrypt(
            createCredentialDto.password,
        );

        // Usar transacción para garantizar atomicidad
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Crear credencial con ownerId del empleado autenticado
            const credential = this.credentialRepository.create({
                title: createCredentialDto.title,
                url: createCredentialDto.url,
                encryptedUsername,
                encryptedPassword,
                directLoginUrl: createCredentialDto.directLoginUrl,
                notes: createCredentialDto.notes,
                logoId: createCredentialDto.logoId,
                visibilityLevel: createCredentialDto.visibilityLevel,
                ownerId: employeeId,
                vaultId: createCredentialDto.vaultId,
            });

            // Guardar credencial (timestamps se establecen automáticamente)
            const savedCredential = await queryRunner.manager.save(credential);

            // Crear registros de visibilidad según visibilityLevel
            await this.createVisibilityRecords(
                queryRunner,
                savedCredential.id,
                createCredentialDto,
            );

            // Commit de la transacción
            await queryRunner.commitTransaction();

            // Retornar credencial creada
            return savedCredential;
        } catch (error) {
            // Rollback en caso de error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Liberar recursos
            await queryRunner.release();
        }
    }

    /**
     * Valida que las entidades especificadas en los arrays de visibilidad existan
     * Requisitos: 11.6, 11.7, 11.8, 11.9
     */
    private async validateVisibilityEntities(
        createCredentialDto: CreateCredentialDto,
    ): Promise<void> {
        const { visibilityLevel, companyIds, areaIds, positionIds, employeeIds } =
            createCredentialDto;

        // Validar empresas si visibilityLevel es BY_COMPANY
        if (
            visibilityLevel === VisibilityLevel.BY_COMPANY &&
            companyIds &&
            companyIds.length > 0
        ) {
            const companies = await this.companyRepository.findByIds(companyIds);
            if (companies.length !== companyIds.length) {
                throw new BadRequestException(
                    'Una o más empresas especificadas no existen',
                );
            }
        }

        // Validar áreas si visibilityLevel es BY_AREA
        if (
            visibilityLevel === VisibilityLevel.BY_AREA &&
            areaIds &&
            areaIds.length > 0
        ) {
            const areas = await this.areaRepository.findByIds(areaIds);
            if (areas.length !== areaIds.length) {
                throw new BadRequestException(
                    'Una o más áreas especificadas no existen',
                );
            }
        }

        // Validar puestos si visibilityLevel es BY_POSITION
        if (
            visibilityLevel === VisibilityLevel.BY_POSITION &&
            positionIds &&
            positionIds.length > 0
        ) {
            const positions = await this.positionRepository.findByIds(positionIds);
            if (positions.length !== positionIds.length) {
                throw new BadRequestException(
                    'Uno o más puestos especificados no existen',
                );
            }
        }

        // Validar empleados si visibilityLevel es BY_EMPLOYEE_LIST
        if (
            visibilityLevel === VisibilityLevel.BY_EMPLOYEE_LIST &&
            employeeIds &&
            employeeIds.length > 0
        ) {
            const employees = await this.employeeRepository.findByIds(employeeIds);
            if (employees.length !== employeeIds.length) {
                throw new BadRequestException(
                    'Uno o más empleados especificados no existen',
                );
            }
        }
    }

    /**
     * Crea registros de visibilidad según el nivel de visibilidad configurado
     * Requisitos: 2.3, 2.4, 2.5, 2.6
     */
    private async createVisibilityRecords(
        queryRunner: any,
        credentialId: string,
        createCredentialDto: CreateCredentialDto,
    ): Promise<void> {
        const { visibilityLevel, companyIds, areaIds, positionIds, employeeIds } =
            createCredentialDto;

        // Crear registros de visibilidad por empresa
        if (
            visibilityLevel === VisibilityLevel.BY_COMPANY &&
            companyIds &&
            companyIds.length > 0
        ) {
            const visibilityCompanies = companyIds.map((companyId) =>
                this.credentialVisibilityCompanyRepository.create({
                    credentialId,
                    companyId,
                }),
            );
            await queryRunner.manager.save(visibilityCompanies);
        }

        // Crear registros de visibilidad por área
        if (
            visibilityLevel === VisibilityLevel.BY_AREA &&
            areaIds &&
            areaIds.length > 0
        ) {
            const visibilityAreas = areaIds.map((areaId) =>
                this.credentialVisibilityAreaRepository.create({
                    credentialId,
                    areaId,
                }),
            );
            await queryRunner.manager.save(visibilityAreas);
        }

        // Crear registros de visibilidad por puesto
        if (
            visibilityLevel === VisibilityLevel.BY_POSITION &&
            positionIds &&
            positionIds.length > 0
        ) {
            const visibilityPositions = positionIds.map((positionId) =>
                this.credentialVisibilityPositionRepository.create({
                    credentialId,
                    positionId,
                }),
            );
            await queryRunner.manager.save(visibilityPositions);
        }

        // Crear registros de visibilidad por empleado
        if (
            visibilityLevel === VisibilityLevel.BY_EMPLOYEE_LIST &&
            employeeIds &&
            employeeIds.length > 0
        ) {
            const visibilityEmployees = employeeIds.map((employeeId) =>
                this.credentialVisibilityEmployeeRepository.create({
                    credentialId,
                    employeeId,
                }),
            );
            await queryRunner.manager.save(visibilityEmployees);
        }
    }

    /**
     * Lista todos los vaults del empleado autenticado con conteo de credenciales,
     * incluyendo vaults ajenos que contienen credenciales accesibles para él.
     * Requisitos: 14.1, 14.2, 14.3, 14.4
     */
    async findAllVaults(employeeId: string, search?: string): Promise<Vault[]> {
        // 1. Vaults propios del empleado
        const ownQueryBuilder = this.vaultRepository
            .createQueryBuilder('vault')
            .where('vault.ownerId = :employeeId', { employeeId })
            .loadRelationCountAndMap('vault.credentialCount', 'vault.credentials');

        if (search && search.trim()) {
            ownQueryBuilder.andWhere('LOWER(vault.name) LIKE LOWER(:search)', {
                search: `%${search}%`,
            });
        }

        ownQueryBuilder.orderBy('vault.name', 'ASC');
        const ownVaults = await ownQueryBuilder.getMany();

        // 2. Vaults ajenos que contienen credenciales compartidas con este empleado
        const sharedVaultIds = await this.credentialRepository
            .createQueryBuilder('credential')
            .select('DISTINCT credential.vaultId', 'vaultId')
            .innerJoin(
                'credential_visibility_employees',
                'cve',
                'cve.credential_id = credential.id AND cve.employee_id = :employeeId',
                { employeeId },
            )
            .where('credential.ownerId != :employeeId', { employeeId })
            .getRawMany();

        const sharedIds = sharedVaultIds.map((r) => r.vaultId).filter(Boolean);

        if (sharedIds.length === 0) {
            return ownVaults;
        }

        const sharedVaults = await this.vaultRepository
            .createQueryBuilder('vault')
            .where('vault.id IN (:...sharedIds)', { sharedIds })
            .loadRelationCountAndMap('vault.credentialCount', 'vault.credentials')
            .orderBy('vault.name', 'ASC')
            .getMany();

        // Merge deduplicando por id
        const ownIds = new Set(ownVaults.map((v) => v.id));
        const merged = [...ownVaults, ...sharedVaults.filter((v) => !ownIds.has(v.id))];
        return merged;
    }

    /**
     * Actualiza un vault existente
     * Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5
     */
    async updateVault(
        employeeId: string,
        vaultId: string,
        updateVaultDto: UpdateVaultDto,
    ): Promise<Vault> {
        // Buscar el vault con su propietario
        const vault = await this.vaultRepository.findOne({
            where: { id: vaultId },
        });

        // Validar que el vault existe
        if (!vault) {
            throw new NotFoundException('Vault no encontrado');
        }

        // Validar que el empleado sea el propietario del vault
        if (vault.ownerId !== employeeId) {
            throw new ForbiddenException('No tienes permisos para actualizar este vault');
        }

        // Actualizar campos proporcionados
        if (updateVaultDto.name !== undefined) {
            vault.name = updateVaultDto.name;
        }

        if (updateVaultDto.description !== undefined) {
            vault.description = updateVaultDto.description;
        }

        // Guardar y retornar vault actualizado (updatedAt se establece automáticamente)
        return await this.vaultRepository.save(vault);
    }

    /**
     * Elimina un vault vacío
     * Requisitos: 16.1, 16.2, 16.3, 16.4
     */
    async deleteVault(employeeId: string, vaultId: string): Promise<void> {
        // Buscar el vault
        const vault = await this.vaultRepository.findOne({
            where: { id: vaultId },
        });

        // Validar que el vault existe
        if (!vault) {
            throw new NotFoundException('Vault no encontrado');
        }

        // Validar que el empleado sea el propietario del vault
        if (vault.ownerId !== employeeId) {
            throw new ForbiddenException('No tienes permisos para eliminar este vault');
        }

        // Verificar que el vault no contenga credenciales
        const credentialCount = await this.credentialRepository.count({
            where: { vaultId },
        });

        // Lanzar error si contiene credenciales
        if (credentialCount > 0) {
            throw new BadRequestException(
                'No se puede eliminar un vault que contiene credenciales',
            );
        }

        // Eliminar vault si está vacío
        await this.vaultRepository.remove(vault);
    }

    /**
     * Lista todas las credenciales accesibles para un empleado con filtros y paginación
     * Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 9.1, 9.2, 9.3, 9.4, 9.5, 17.1, 17.2, 17.3
     */
    async findAllCredentials(
        employeeId: string,
        filters?: {
            search?: string;
            vaultId?: string;
            page?: number;
            limit?: number;
        },
    ): Promise<{ data: Credential[]; total: number; page: number; limit: number }> {
        // Validar que el empleado existe y está activo
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
        });

        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }

        if (!employee.isActive) {
            throw new ForbiddenException('El empleado no está activo');
        }

        // Configurar paginación
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        // Construir query base con relaciones necesarias
        const queryBuilder = this.credentialRepository
            .createQueryBuilder('credential')
            .leftJoinAndSelect('credential.vault', 'vault')
            .leftJoinAndSelect('credential.owner', 'owner')
            .leftJoinAndSelect('credential.logo', 'logo')
            .leftJoinAndSelect('credential.visibilityCompanies', 'visibilityCompanies')
            .leftJoinAndSelect('credential.visibilityAreas', 'visibilityAreas')
            .leftJoinAndSelect('credential.visibilityPositions', 'visibilityPositions')
            .leftJoinAndSelect('credential.visibilityEmployees', 'visibilityEmployees');

        // Construir condiciones de visibilidad con OR
        queryBuilder.where(
            '(' +
            // 1. Credenciales propias del empleado
            'credential.ownerId = :employeeId OR ' +
            // 2. Credenciales públicas
            'credential.visibilityLevel = :publicLevel OR ' +
            // 3. Credenciales por empresa (requiere join con contratos activos)
            'EXISTS (' +
            '  SELECT 1 FROM memorandums m ' +
            '  INNER JOIN contracts c ON m.contract_id = c.id ' +
            '  INNER JOIN positions p ON m.position_id = p.id ' +
            '  INNER JOIN departments d ON p.department_id = d.id ' +
            '  INNER JOIN credential_visibility_companies cvc ON cvc.credential_id = credential.id ' +
            '  WHERE c.employee_id = :employeeId ' +
            '  AND c.status = :activeStatus ' +
            '  AND m.start_date <= :now ' +
            '  AND (m.end_date IS NULL OR m.end_date >= :now) ' +
            '  AND cvc.company_id = d.company_id' +
            ') OR ' +
            // 4. Credenciales por área (actualmente no soportado en el esquema)
            // TODO: Implementar cuando se agregue areaId a memorandums
            // 5. Credenciales por puesto (requiere join con contratos activos)
            'EXISTS (' +
            '  SELECT 1 FROM memorandums m ' +
            '  INNER JOIN contracts c ON m.contract_id = c.id ' +
            '  INNER JOIN credential_visibility_positions cvp ON cvp.credential_id = credential.id ' +
            '  WHERE c.employee_id = :employeeId ' +
            '  AND c.status = :activeStatus ' +
            '  AND m.start_date <= :now ' +
            '  AND (m.end_date IS NULL OR m.end_date >= :now) ' +
            '  AND cvp.position_id = m.position_id' +
            ') OR ' +
            // 6. Credenciales por lista de empleados
            'EXISTS (' +
            '  SELECT 1 FROM credential_visibility_employees cve ' +
            '  WHERE cve.credential_id = credential.id ' +
            '  AND cve.employee_id = :employeeId' +
            ')' +
            ')',
            {
                employeeId,
                publicLevel: VisibilityLevel.PUBLIC,
                activeStatus: 'active',
                now: new Date(),
            },
        );

        // Aplicar filtro de búsqueda si se proporciona
        if (filters?.search && filters.search.trim()) {
            queryBuilder.andWhere(
                '(LOWER(credential.title) LIKE LOWER(:search) OR ' +
                'LOWER(credential.url) LIKE LOWER(:search) OR ' +
                'LOWER(vault.name) LIKE LOWER(:search))',
                { search: `%${filters.search}%` },
            );
        }

        // Aplicar filtro por vaultId si se proporciona
        if (filters?.vaultId) {
            queryBuilder.andWhere('credential.vaultId = :vaultId', {
                vaultId: filters.vaultId,
            });
        }

        // Ordenar por fecha de creación descendente
        queryBuilder.orderBy('credential.createdAt', 'DESC');

        // Obtener total de registros antes de aplicar paginación
        const total = await queryBuilder.getCount();

        // Aplicar paginación
        queryBuilder.skip(skip).take(limit);

        // Ejecutar query y obtener resultados
        const data = await queryBuilder.getMany();

        // Retornar resultados paginados (passwords permanecen cifrados)
        return {
            data,
            total,
            page,
            limit,
        };
    }

    /**
     * Obtiene el detalle de una credencial con datos descifrados
     * Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 10.1, 10.2, 10.3
     */
    async findOneCredential(
        employeeId: string,
        credentialId: string,
    ): Promise<Credential & { username: string; password: string }> {
        // Cargar credencial con todas las relaciones de visibilidad
        const credential = await this.credentialRepository.findOne({
            where: { id: credentialId },
            relations: [
                'vault',
                'owner',
                'logo',
                'visibilityCompanies',
                'visibilityCompanies.company',
                'visibilityAreas',
                'visibilityAreas.area',
                'visibilityPositions',
                'visibilityPositions.position',
                'visibilityPositions.position.department',
                'visibilityEmployees',
                'visibilityEmployees.employee',
                'visibilityEmployees.employee.profilePhoto',
            ],
        });

        // Validar que la credencial existe
        if (!credential) {
            throw new NotFoundException('Credencial no encontrada');
        }

        // Validar acceso usando AccessControlService
        const hasAccess = await this.accessControlService.canAccessCredential(
            employeeId,
            credential,
        );

        // Lanzar error 403 si no tiene acceso
        if (!hasAccess) {
            throw new ForbiddenException('No tienes permisos para acceder a esta credencial');
        }

        // Descifrar username y password usando EncryptionService
        const username = this.encryptionService.decrypt(credential.encryptedUsername);
        const password = this.encryptionService.decrypt(credential.encryptedPassword);

        // Registrar acceso en CredentialAccessLog
        const accessLog = this.credentialAccessLogRepository.create({
            credentialId: credential.id,
            employeeId,
        });
        await this.credentialAccessLogRepository.save(accessLog);

        // Retornar credencial con datos descifrados
        return {
            ...credential,
            username,
            password,
        };
    }

    /**
     * Actualiza una credencial existente
     * Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11
     */
    async updateCredential(
        employeeId: string,
        credentialId: string,
        updateCredentialDto: UpdateCredentialDto,
    ): Promise<Credential> {
        // Buscar la credencial
        const credential = await this.credentialRepository.findOne({
            where: { id: credentialId },
        });

        // Validar que la credencial existe
        if (!credential) {
            throw new NotFoundException('Credencial no encontrada');
        }

        // Validar que el empleado sea el propietario
        if (credential.ownerId !== employeeId) {
            throw new ForbiddenException('No tienes permisos para actualizar esta credencial');
        }

        // Validar existencia de entidades según visibilityLevel si se actualiza
        if (updateCredentialDto.visibilityLevel !== undefined) {
            await this.validateVisibilityEntities({
                ...updateCredentialDto,
                visibilityLevel: updateCredentialDto.visibilityLevel,
            } as CreateCredentialDto);
        }

        // Usar transacción para garantizar atomicidad
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Actualizar campos proporcionados
            if (updateCredentialDto.title !== undefined) {
                credential.title = updateCredentialDto.title;
            }

            if (updateCredentialDto.url !== undefined) {
                credential.url = updateCredentialDto.url;
            }

            // Cifrar username si se proporciona
            if (updateCredentialDto.username !== undefined) {
                credential.encryptedUsername = this.encryptionService.encrypt(
                    updateCredentialDto.username,
                );
            }

            // Cifrar password si se proporciona
            if (updateCredentialDto.password !== undefined) {
                credential.encryptedPassword = this.encryptionService.encrypt(
                    updateCredentialDto.password,
                );
            }

            if (updateCredentialDto.directLoginUrl !== undefined) {
                credential.directLoginUrl = updateCredentialDto.directLoginUrl;
            }

            if (updateCredentialDto.notes !== undefined) {
                credential.notes = updateCredentialDto.notes;
            }

            if (updateCredentialDto.logoId !== undefined) {
                credential.logoId = updateCredentialDto.logoId;
            }

            if (updateCredentialDto.vaultId !== undefined) {
                credential.vaultId = updateCredentialDto.vaultId;
            }

            // Si cambia visibilityLevel, actualizar registros de visibilidad
            if (updateCredentialDto.visibilityLevel !== undefined) {
                credential.visibilityLevel = updateCredentialDto.visibilityLevel;

                // Eliminar registros antiguos de visibilidad
                await queryRunner.manager.delete(CredentialVisibilityCompany, {
                    credentialId: credential.id,
                });
                await queryRunner.manager.delete(CredentialVisibilityArea, {
                    credentialId: credential.id,
                });
                await queryRunner.manager.delete(CredentialVisibilityPosition, {
                    credentialId: credential.id,
                });
                await queryRunner.manager.delete(CredentialVisibilityEmployee, {
                    credentialId: credential.id,
                });

                // Crear nuevos registros de visibilidad
                await this.createVisibilityRecords(
                    queryRunner,
                    credential.id,
                    updateCredentialDto as CreateCredentialDto,
                );
            }

            // Guardar credencial actualizada (updatedAt se establece automáticamente)
            const updatedCredential = await queryRunner.manager.save(credential);

            // Commit de la transacción
            await queryRunner.commitTransaction();

            // Retornar credencial actualizada
            return updatedCredential;
        } catch (error) {
            // Rollback en caso de error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Liberar recursos
            await queryRunner.release();
        }
    }

    /**
     * Elimina una credencial y todos sus registros de visibilidad
     * Requisitos: 7.1, 7.2, 7.3, 7.4
     */
    async deleteCredential(employeeId: string, credentialId: string): Promise<void> {
        // Buscar la credencial
        const credential = await this.credentialRepository.findOne({
            where: { id: credentialId },
        });

        // Validar que la credencial existe
        if (!credential) {
            throw new NotFoundException('Credencial no encontrada');
        }

        // Validar que el empleado sea el propietario
        if (credential.ownerId !== employeeId) {
            throw new ForbiddenException('No tienes permisos para eliminar esta credencial');
        }

        // Usar transacción para garantizar atomicidad
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Eliminar todos los registros de visibilidad asociados
            await queryRunner.manager.delete(CredentialVisibilityCompany, {
                credentialId: credential.id,
            });
            await queryRunner.manager.delete(CredentialVisibilityArea, {
                credentialId: credential.id,
            });
            await queryRunner.manager.delete(CredentialVisibilityPosition, {
                credentialId: credential.id,
            });
            await queryRunner.manager.delete(CredentialVisibilityEmployee, {
                credentialId: credential.id,
            });

            // Eliminar la credencial
            await queryRunner.manager.remove(credential);

            // Commit de la transacción
            await queryRunner.commitTransaction();
        } catch (error) {
            // Rollback en caso de error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Liberar recursos
            await queryRunner.release();
        }
    }

    /**
     * Obtiene el historial de accesos a credenciales del empleado propietario
     * Requisitos: 10.4, 10.5, 10.6
     */
    async findAccessLogs(
        employeeId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: CredentialAccessLog[]; total: number; page: number; limit: number }> {
        // Configurar paginación
        const skip = (page - 1) * limit;

        // Construir query para logs de acceso
        // Filtrar por credenciales del empleado propietario
        // Incluir información del empleado que accedió
        // Ordenar por accessedAt descendente
        const queryBuilder = this.credentialAccessLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.employee', 'employee')
            .leftJoinAndSelect('log.credential', 'credential')
            .where('credential.ownerId = :employeeId', { employeeId })
            .orderBy('log.accessedAt', 'DESC');

        // Obtener total de registros antes de aplicar paginación
        const total = await queryBuilder.getCount();

        // Aplicar paginación
        queryBuilder.skip(skip).take(limit);

        // Ejecutar query y obtener resultados
        const data = await queryBuilder.getMany();

        // Retornar resultados paginados
        return {
            data,
            total,
            page,
            limit,
        };
    }
}
