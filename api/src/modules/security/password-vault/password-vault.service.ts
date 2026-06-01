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
import { VaultVisibilityCompany } from './entities/vault-visibility-company.entity';
import { VaultVisibilityArea } from './entities/vault-visibility-area.entity';
import { VaultVisibilityPosition } from './entities/vault-visibility-position.entity';
import { VaultVisibilityEmployee } from './entities/vault-visibility-employee.entity';
import { CredentialAccessLog } from './entities/credential-access-log.entity';
import { CreateVaultDto } from './dto/create-vault.dto';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';
import { EncryptionService } from './services/encryption.service';
import { AccessControlService } from './services/access-control.service';
import { VisibilityLevel } from './enums/visibility-level.enum';
import { CredentialLogAction } from './enums/credential-log-action.enum';

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
        @InjectRepository(VaultVisibilityCompany)
        private readonly vaultVisibilityCompanyRepository: Repository<VaultVisibilityCompany>,
        @InjectRepository(VaultVisibilityArea)
        private readonly vaultVisibilityAreaRepository: Repository<VaultVisibilityArea>,
        @InjectRepository(VaultVisibilityPosition)
        private readonly vaultVisibilityPositionRepository: Repository<VaultVisibilityPosition>,
        @InjectRepository(VaultVisibilityEmployee)
        private readonly vaultVisibilityEmployeeRepository: Repository<VaultVisibilityEmployee>,
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

        // Validar que el vault padre existe y el empleado tiene acceso (si se especifica)
        if (createVaultDto.parentId) {
            const parentVault = await this.vaultRepository.findOne({
                where: { id: createVaultDto.parentId },
            });

            if (!parentVault) {
                throw new NotFoundException('Vault padre no encontrado');
            }

            const hasAccess = await this.accessControlService.canAccessVault(employeeId, createVaultDto.parentId);
            if (!hasAccess) {
                throw new ForbiddenException('No tienes permisos para crear dentro de este directorio');
            }
        }

        // Validar entidades de visibilidad si se especifican
        if (createVaultDto.visibilityLevel) {
            await this.validateVaultVisibilityEntities(createVaultDto);
        }

        // Usar transacción para crear vault + registros de visibilidad
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Crear vault con ownerId del empleado autenticado
            const vault = this.vaultRepository.create({
                name: createVaultDto.name,
                description: createVaultDto.description,
                ownerId: employeeId,
                parentId: createVaultDto.parentId || null,
                visibilityLevel: createVaultDto.visibilityLevel || VisibilityLevel.INHERIT,
            });

            const savedVault = await queryRunner.manager.save(vault);

            // Crear registros de visibilidad del vault
            await this.createVaultVisibilityRecords(queryRunner, savedVault.id, createVaultDto);

            await queryRunner.commitTransaction();
            return savedVault;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
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

        // Validar que el vault existe y el empleado tiene acceso
        const vault = await this.vaultRepository.findOne({
            where: { id: createCredentialDto.vaultId },
        });

        if (!vault) {
            throw new NotFoundException('Vault no encontrado');
        }

        const hasVaultAccess = await this.accessControlService.canAccessVault(employeeId, createCredentialDto.vaultId);
        if (!hasVaultAccess) {
            throw new ForbiddenException('No tienes permisos para crear credenciales en este directorio');
        }

        // Validar existencia de entidades según visibilityLevel
        await this.validateVisibilityEntities(createCredentialDto);

        // Cifrar username y password solo si se proporcionan
        const encryptedUsername = createCredentialDto.username
            ? this.encryptionService.encrypt(createCredentialDto.username)
            : null;
        const encryptedPassword = createCredentialDto.password
            ? this.encryptionService.encrypt(createCredentialDto.password)
            : null;

        // Usar transacción para garantizar atomicidad
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Crear credencial con ownerId del empleado autenticado
            const credentialData: Partial<Credential> = {
                title: createCredentialDto.title,
                url: createCredentialDto.url ?? undefined,
                encryptedUsername: encryptedUsername ?? undefined,
                encryptedPassword: encryptedPassword ?? undefined,
                directLoginUrl: createCredentialDto.directLoginUrl,
                notes: createCredentialDto.notes,
                logoId: createCredentialDto.logoId,
                visibilityLevel: createCredentialDto.visibilityLevel || VisibilityLevel.INHERIT,
                ownerId: employeeId,
                vaultId: createCredentialDto.vaultId,
            };
            const credential = this.credentialRepository.create(credentialData as Credential);

            // Guardar credencial (timestamps se establecen automáticamente)
            const savedCredential: Credential = await queryRunner.manager.save(Credential, credential);

            // Crear registros de visibilidad según visibilityLevel
            await this.createVisibilityRecords(
                queryRunner,
                savedCredential.id,
                createCredentialDto,
            );

            // Commit de la transacción
            await queryRunner.commitTransaction();

            // Registrar log de creación
            await this.logCredentialAction(savedCredential.id, employeeId, CredentialLogAction.CREATED);

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
     * Valida que las entidades de visibilidad del vault existan
     */
    private async validateVaultVisibilityEntities(dto: CreateVaultDto): Promise<void> {
        const { visibilityLevel, companyIds, areaIds, positionIds, employeeIds } = dto;

        if (visibilityLevel === VisibilityLevel.BY_COMPANY && companyIds && companyIds.length > 0) {
            const companies = await this.companyRepository.findByIds(companyIds);
            if (companies.length !== companyIds.length) {
                throw new BadRequestException('Una o más empresas especificadas no existen');
            }
        }

        if (visibilityLevel === VisibilityLevel.BY_AREA && areaIds && areaIds.length > 0) {
            const areas = await this.areaRepository.findByIds(areaIds);
            if (areas.length !== areaIds.length) {
                throw new BadRequestException('Una o más áreas especificadas no existen');
            }
        }

        if (visibilityLevel === VisibilityLevel.BY_POSITION && positionIds && positionIds.length > 0) {
            const positions = await this.positionRepository.findByIds(positionIds);
            if (positions.length !== positionIds.length) {
                throw new BadRequestException('Uno o más puestos especificados no existen');
            }
        }

        if (visibilityLevel === VisibilityLevel.BY_EMPLOYEE_LIST && employeeIds && employeeIds.length > 0) {
            const employees = await this.employeeRepository.findByIds(employeeIds);
            if (employees.length !== employeeIds.length) {
                throw new BadRequestException('Uno o más empleados especificados no existen');
            }
        }
    }

    /**
     * Crea registros de visibilidad para un vault
     */
    private async createVaultVisibilityRecords(
        queryRunner: any,
        vaultId: string,
        dto: CreateVaultDto,
    ): Promise<void> {
        const { visibilityLevel, companyIds, areaIds, positionIds, employeeIds } = dto;

        if (visibilityLevel === VisibilityLevel.BY_COMPANY && companyIds && companyIds.length > 0) {
            const records = companyIds.map((companyId) =>
                this.vaultVisibilityCompanyRepository.create({ vaultId, companyId }),
            );
            await queryRunner.manager.save(records);
        }

        if (visibilityLevel === VisibilityLevel.BY_AREA && areaIds && areaIds.length > 0) {
            const records = areaIds.map((areaId) =>
                this.vaultVisibilityAreaRepository.create({ vaultId, areaId }),
            );
            await queryRunner.manager.save(records);
        }

        if (visibilityLevel === VisibilityLevel.BY_POSITION && positionIds && positionIds.length > 0) {
            const records = positionIds.map((positionId) =>
                this.vaultVisibilityPositionRepository.create({ vaultId, positionId }),
            );
            await queryRunner.manager.save(records);
        }

        if (visibilityLevel === VisibilityLevel.BY_EMPLOYEE_LIST && employeeIds && employeeIds.length > 0) {
            const records = employeeIds.map((employeeId) =>
                this.vaultVisibilityEmployeeRepository.create({ vaultId, employeeId }),
            );
            await queryRunner.manager.save(records);
        }
    }

    /**
     * Lista todos los vaults del empleado autenticado con conteo de credenciales,
     * incluyendo vaults ajenos compartidos con él (por visibilidad de vault o credencial).
     * Retorna estructura plana con parentId para que el frontend construya el árbol.
     * Requisitos: 14.1, 14.2, 14.3, 14.4
     */
    async findAllVaults(employeeId: string, search?: string): Promise<Vault[]> {        // 1. Vaults propios del empleado (include visibility relations for editing)
        const ownQueryBuilder = this.vaultRepository
            .createQueryBuilder('vault')
            .leftJoinAndSelect('vault.visibilityCompanies', 'visibilityCompanies')
            .leftJoinAndSelect('visibilityCompanies.company', 'company')
            .leftJoinAndSelect('vault.visibilityAreas', 'visibilityAreas')
            .leftJoinAndSelect('visibilityAreas.area', 'area')
            .leftJoinAndSelect('vault.visibilityPositions', 'visibilityPositions')
            .leftJoinAndSelect('visibilityPositions.position', 'position')
            .leftJoinAndSelect('vault.visibilityEmployees', 'visibilityEmployees')
            .leftJoinAndSelect('visibilityEmployees.employee', 'employee')
            .where('vault.ownerId = :employeeId', { employeeId })
            .loadRelationCountAndMap('vault.credentialCount', 'vault.credentials');

        if (search && search.trim()) {
            ownQueryBuilder.andWhere('LOWER(vault.name) LIKE LOWER(:search)', {
                search: `%${search}%`,
            });
        }

        ownQueryBuilder.orderBy('vault.name', 'ASC');
        const ownVaults = await ownQueryBuilder.getMany();

        // 2. Vaults ajenos accesibles por visibilidad directa o heredada del padre.
        const sharedIds = await this.resolveAccessibleVaultIds(employeeId);

        let sharedVaults: Vault[] = [];
        if (sharedIds.length > 0) {
            sharedVaults = await this.vaultRepository
                .createQueryBuilder('vault')
                .where('vault.id IN (:...sharedIds)', { sharedIds })
                .loadRelationCountAndMap('vault.credentialCount', 'vault.credentials')
                .orderBy('vault.name', 'ASC')
                .getMany();
        }

        // 3. Vaults ajenos que contienen credenciales compartidas directamente con este empleado
        const sharedVaultIdsByCredential = await this.credentialRepository
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

        const sharedCredVaultIds = sharedVaultIdsByCredential.map((r) => r.vaultId).filter(Boolean);

        let sharedVaultsByCredential: Vault[] = [];
        if (sharedCredVaultIds.length > 0) {
            sharedVaultsByCredential = await this.vaultRepository
                .createQueryBuilder('vault')
                .where('vault.id IN (:...sharedIds)', { sharedIds: sharedCredVaultIds })
                .loadRelationCountAndMap('vault.credentialCount', 'vault.credentials')
                .orderBy('vault.name', 'ASC')
                .getMany();
        }

        // Merge deduplicando por id
        const allVaults = [...ownVaults, ...sharedVaults, ...sharedVaultsByCredential];
        const seen = new Set<string>();
        const merged: Vault[] = [];
        for (const vault of allVaults) {
            if (!seen.has(vault.id)) {
                seen.add(vault.id);
                merged.push(vault);
            }
        }

        return merged;
    }

    /**
     * Obtiene un vault con todas sus relaciones de visibilidad.
     */
    async findOneVault(employeeId: string, vaultId: string): Promise<Vault> {
        const vault = await this.vaultRepository.findOne({
            where: { id: vaultId },
            relations: [
                'visibilityCompanies',
                'visibilityCompanies.company',
                'visibilityAreas',
                'visibilityAreas.area',
                'visibilityPositions',
                'visibilityPositions.position',
                'visibilityEmployees',
                'visibilityEmployees.employee',
            ],
        });

        if (!vault) {
            throw new NotFoundException('Vault no encontrado');
        }

        // Verificar acceso
        const hasAccess = await this.accessControlService.canAccessVault(employeeId, vaultId);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes permisos para acceder a este vault');
        }

        return vault;
    }

    /**
     * Resuelve los IDs de todos los vaults ajenos accesibles para un empleado,
     * incluyendo herencia de visibilidad por la jerarquía de directorios.
     * Usado tanto por findAllVaults como por findAllCredentials.
     */
    private async resolveAccessibleVaultIds(employeeId: string): Promise<string[]> {
        const now = new Date();

        // Cargar todos los vaults ajenos con sus relaciones de visibilidad
        const foreignVaults = await this.vaultRepository
            .createQueryBuilder('vault')
            .leftJoinAndSelect('vault.visibilityEmployees', 'vve')
            .leftJoinAndSelect('vault.visibilityCompanies', 'vvc')
            .leftJoinAndSelect('vault.visibilityPositions', 'vvp')
            .where('vault.ownerId != :employeeId', { employeeId })
            .getMany();

        if (foreignVaults.length === 0) return [];

        // Obtener empresa y puesto activo del empleado
        const activeMemorandum = await this.dataSource.query(
            `SELECT m.position_id, d.company_id
             FROM memorandums m
             INNER JOIN contracts c ON m.contract_id = c.id
             INNER JOIN positions p ON m.position_id = p.id
             INNER JOIN departments d ON p.department_id = d.id
             WHERE c.employee_id = ?
               AND c.status = 'active'
               AND m.start_date <= ?
               AND (m.end_date IS NULL OR m.end_date >= ?)
             LIMIT 1`,
            [employeeId, now, now],
        );
        const employeePositionId: string | null = activeMemorandum[0]?.position_id ?? null;
        const employeeCompanyId: string | null = activeMemorandum[0]?.company_id ?? null;

        // Mapa id -> vault para recorrer jerarquía
        const vaultMap = new Map<string, typeof foreignVaults[0]>();
        foreignVaults.forEach(v => vaultMap.set(v.id, v));

        const hasDirectAccess = (vault: typeof foreignVaults[0]): boolean => {
            switch (vault.visibilityLevel) {
                case VisibilityLevel.PUBLIC:
                    return true;
                case VisibilityLevel.BY_EMPLOYEE_LIST:
                    return vault.visibilityEmployees?.some(e => e.employeeId === employeeId) ?? false;
                case VisibilityLevel.BY_COMPANY:
                    return employeeCompanyId !== null &&
                        (vault.visibilityCompanies?.some(c => c.companyId === employeeCompanyId) ?? false);
                case VisibilityLevel.BY_POSITION:
                    return employeePositionId !== null &&
                        (vault.visibilityPositions?.some(p => p.positionId === employeePositionId) ?? false);
                default:
                    return false;
            }
        };

        const isAccessible = (vaultId: string, visited = new Set<string>()): boolean => {
            if (visited.has(vaultId)) return false;
            visited.add(vaultId);
            const vault = vaultMap.get(vaultId);
            if (!vault) return false;
            if (vault.visibilityLevel === VisibilityLevel.PRIVATE) return false;
            if (vault.visibilityLevel !== VisibilityLevel.INHERIT) return hasDirectAccess(vault);
            if (vault.parentId) return isAccessible(vault.parentId, visited);
            return false;
        };

        return foreignVaults
            .filter(v => isAccessible(v.id))
            .map(v => v.id);
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
        // Buscar el vault
        const vault = await this.vaultRepository.findOne({
            where: { id: vaultId },
        });

        // Validar que el vault existe
        if (!vault) {
            throw new NotFoundException('Vault no encontrado');
        }

        // Validar que el empleado tenga acceso al vault
        const hasAccess = await this.accessControlService.canAccessVault(employeeId, vaultId);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes permisos para actualizar este vault');
        }

        // Validar entidades de visibilidad si se cambia el nivel
        if (updateVaultDto.visibilityLevel !== undefined) {
            await this.validateVaultVisibilityEntities(updateVaultDto as CreateVaultDto);
        }

        // Usar transacción para actualizar vault + registros de visibilidad
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Actualizar campos proporcionados
            if (updateVaultDto.name !== undefined) {
                vault.name = updateVaultDto.name;
            }

            if (updateVaultDto.description !== undefined) {
                vault.description = updateVaultDto.description;
            }

            // Si cambia visibilityLevel, actualizar registros de visibilidad
            if (updateVaultDto.visibilityLevel !== undefined) {
                vault.visibilityLevel = updateVaultDto.visibilityLevel;

                // Eliminar registros antiguos de visibilidad del vault
                await queryRunner.manager.delete(VaultVisibilityCompany, { vaultId: vault.id });
                await queryRunner.manager.delete(VaultVisibilityArea, { vaultId: vault.id });
                await queryRunner.manager.delete(VaultVisibilityPosition, { vaultId: vault.id });
                await queryRunner.manager.delete(VaultVisibilityEmployee, { vaultId: vault.id });

                // Crear nuevos registros de visibilidad
                await this.createVaultVisibilityRecords(queryRunner, vault.id, updateVaultDto as CreateVaultDto);
            }

            const updatedVault = await queryRunner.manager.save(vault);
            await queryRunner.commitTransaction();
            return updatedVault;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Elimina un vault vacío (sin credenciales ni sub-carpetas)
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

        // Validar que el empleado tenga acceso al vault
        const hasAccess = await this.accessControlService.canAccessVault(employeeId, vaultId);
        if (!hasAccess) {
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

        // Verificar que el vault no contenga sub-carpetas
        const childCount = await this.vaultRepository.count({
            where: { parentId: vaultId },
        });

        if (childCount > 0) {
            throw new BadRequestException(
                'No se puede eliminar un vault que contiene sub-carpetas',
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

        // Resolver los IDs de vaults accesibles para el empleado (herencia incluida)
        // Reutilizamos la misma lógica en memoria que findAllVaults
        const accessibleVaultIds = await this.resolveAccessibleVaultIds(employeeId);

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

        const now = new Date();

        // Condición base: credenciales propias O con visibilidad explícita
        queryBuilder.where(
            '(' +
            // 1. Credenciales propias del empleado
            'credential.ownerId = :employeeId OR ' +
            // 2. Credenciales públicas (visibilidad propia)
            'credential.visibilityLevel = :publicLevel OR ' +
            // 3. Credenciales por empresa (visibilidad propia)
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
            // 4. Credenciales por puesto (visibilidad propia)
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
            // 5. Credenciales por lista de empleados (visibilidad propia)
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
                now,
            },
        );

        // 6. Credenciales INHERIT en vaults accesibles (herencia resuelta en memoria)
        if (accessibleVaultIds.length > 0) {
            queryBuilder.orWhere(
                '(credential.visibilityLevel = :inheritLevel AND credential.vaultId IN (:...accessibleVaultIds))',
                { inheritLevel: VisibilityLevel.INHERIT, accessibleVaultIds },
            );
        }

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
    ): Promise<Credential & { username: string | null; password: string | null }> {
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
        const username = credential.encryptedUsername
            ? this.encryptionService.decrypt(credential.encryptedUsername)
            : null;
        const password = credential.encryptedPassword
            ? this.encryptionService.decrypt(credential.encryptedPassword)
            : null;

        // Registrar acceso en CredentialAccessLog
        await this.logCredentialAction(credential.id, employeeId, CredentialLogAction.ACCESSED);

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
            relations: [
                'visibilityCompanies',
                'visibilityAreas',
                'visibilityPositions',
                'visibilityEmployees',
            ],
        });

        // Validar que la credencial existe
        if (!credential) {
            throw new NotFoundException('Credencial no encontrada');
        }

        // Validar que el empleado tenga acceso a la credencial
        const hasAccess = await this.accessControlService.canAccessCredential(employeeId, credential);
        if (!hasAccess) {
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

            // Registrar log de actualización
            await this.logCredentialAction(updatedCredential.id, employeeId, CredentialLogAction.UPDATED);

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
            relations: [
                'visibilityCompanies',
                'visibilityAreas',
                'visibilityPositions',
                'visibilityEmployees',
            ],
        });

        // Validar que la credencial existe
        if (!credential) {
            throw new NotFoundException('Credencial no encontrada');
        }

        // Validar que el empleado tenga acceso a la credencial
        const hasAccess = await this.accessControlService.canAccessCredential(employeeId, credential);
        if (!hasAccess) {
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

    /**
     * Registra una acción sobre una credencial en el log de auditoría.
     */
    private async logCredentialAction(
        credentialId: string,
        employeeId: string,
        action: CredentialLogAction,
    ): Promise<void> {
        const log = this.credentialAccessLogRepository.create({
            credentialId,
            employeeId,
            action,
        });
        await this.credentialAccessLogRepository.save(log);
    }

    /**
     * Obtiene el historial de accesos de una credencial específica.
     * Solo el propietario de la credencial puede ver sus logs.
     */
    async findCredentialAccessLogs(
        employeeId: string,
        credentialId: string,
        page: number = 1,
        limit: number = 50,
    ): Promise<CredentialAccessLog[]> {
        // Verificar que la credencial existe y pertenece al empleado
        const credential = await this.credentialRepository.findOne({
            where: { id: credentialId },
        });

        if (!credential) {
            throw new NotFoundException('Credencial no encontrada');
        }

        if (credential.ownerId !== employeeId) {
            throw new ForbiddenException('No tienes permisos para ver los logs de esta credencial');
        }

        const skip = (page - 1) * limit;

        return this.credentialAccessLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.employee', 'employee')
            .where('log.credentialId = :credentialId', { credentialId })
            .orderBy('log.accessedAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getMany();
    }
}
