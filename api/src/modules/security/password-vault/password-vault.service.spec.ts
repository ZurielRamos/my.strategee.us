import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PasswordVaultService } from './password-vault.service';
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
import { EncryptionService } from './services/encryption.service';
import { AccessControlService } from './services/access-control.service';
import { VisibilityLevel } from './enums/visibility-level.enum';
import * as fc from 'fast-check';

describe('PasswordVaultService', () => {
    let service: PasswordVaultService;
    let vaultRepository: Repository<Vault>;
    let credentialRepository: Repository<Credential>;
    let employeeRepository: Repository<Employee>;
    let credentialAccessLogRepository: Repository<CredentialAccessLog>;
    let encryptionService: EncryptionService;
    let accessControlService: AccessControlService;

    const mockVaultRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(),
        remove: jest.fn(),
    };

    const mockCredentialRepository = {
        count: jest.fn(),
        createQueryBuilder: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockEmployeeRepository = {
        findOne: jest.fn(),
    };

    const mockCompanyRepository = {
        findByIds: jest.fn(),
    };

    const mockAreaRepository = {
        findByIds: jest.fn(),
    };

    const mockPositionRepository = {
        findByIds: jest.fn(),
    };

    const mockCredentialVisibilityCompanyRepository = {
        create: jest.fn(),
    };

    const mockCredentialVisibilityAreaRepository = {
        create: jest.fn(),
    };

    const mockCredentialVisibilityPositionRepository = {
        create: jest.fn(),
    };

    const mockCredentialVisibilityEmployeeRepository = {
        create: jest.fn(),
    };

    const mockCredentialAccessLogRepository = {
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockEncryptionService = {
        encrypt: jest.fn(),
        decrypt: jest.fn(),
    };

    const mockAccessControlService = {
        canAccessCredential: jest.fn(),
    };

    const mockDataSource = {
        createQueryRunner: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PasswordVaultService,
                {
                    provide: getRepositoryToken(Vault),
                    useValue: mockVaultRepository,
                },
                {
                    provide: getRepositoryToken(Credential),
                    useValue: mockCredentialRepository,
                },
                {
                    provide: getRepositoryToken(Employee),
                    useValue: mockEmployeeRepository,
                },
                {
                    provide: getRepositoryToken(Company),
                    useValue: mockCompanyRepository,
                },
                {
                    provide: getRepositoryToken(Area),
                    useValue: mockAreaRepository,
                },
                {
                    provide: getRepositoryToken(Position),
                    useValue: mockPositionRepository,
                },
                {
                    provide: getRepositoryToken(CredentialVisibilityCompany),
                    useValue: mockCredentialVisibilityCompanyRepository,
                },
                {
                    provide: getRepositoryToken(CredentialVisibilityArea),
                    useValue: mockCredentialVisibilityAreaRepository,
                },
                {
                    provide: getRepositoryToken(CredentialVisibilityPosition),
                    useValue: mockCredentialVisibilityPositionRepository,
                },
                {
                    provide: getRepositoryToken(CredentialVisibilityEmployee),
                    useValue: mockCredentialVisibilityEmployeeRepository,
                },
                {
                    provide: getRepositoryToken(CredentialAccessLog),
                    useValue: mockCredentialAccessLogRepository,
                },
                {
                    provide: EncryptionService,
                    useValue: mockEncryptionService,
                },
                {
                    provide: AccessControlService,
                    useValue: mockAccessControlService,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<PasswordVaultService>(PasswordVaultService);
        vaultRepository = module.get<Repository<Vault>>(getRepositoryToken(Vault));
        credentialRepository = module.get<Repository<Credential>>(getRepositoryToken(Credential));
        employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
        credentialAccessLogRepository = module.get<Repository<CredentialAccessLog>>(
            getRepositoryToken(CredentialAccessLog),
        );
        encryptionService = module.get<EncryptionService>(EncryptionService);
        accessControlService = module.get<AccessControlService>(AccessControlService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createVault', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const createVaultDto: CreateVaultDto = {
            name: 'Proyecto Alpha',
            description: 'Credenciales para el proyecto Alpha',
        };

        const mockEmployee: Partial<Employee> = {
            id: employeeId,
            isActive: true,
            firstName: 'John',
            lastName: 'Doe',
        };

        const mockVault: Partial<Vault> = {
            id: '456e7890-e89b-12d3-a456-426614174001',
            name: createVaultDto.name,
            description: createVaultDto.description,
            ownerId: employeeId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should create a vault successfully for an active employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockVaultRepository.create.mockReturnValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(mockVault);

            const result = await service.createVault(employeeId, createVaultDto);

            expect(employeeRepository.findOne).toHaveBeenCalledWith({
                where: { id: employeeId },
            });
            expect(vaultRepository.create).toHaveBeenCalledWith({
                name: createVaultDto.name,
                description: createVaultDto.description,
                ownerId: employeeId,
            });
            expect(vaultRepository.save).toHaveBeenCalledWith(mockVault);
            expect(result).toEqual(mockVault);
        });

        it('should create a vault without description', async () => {
            const dtoWithoutDescription: CreateVaultDto = {
                name: 'Proyecto Beta',
            };

            const vaultWithoutDescription = {
                ...mockVault,
                name: dtoWithoutDescription.name,
                description: undefined,
            };

            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockVaultRepository.create.mockReturnValue(vaultWithoutDescription);
            mockVaultRepository.save.mockResolvedValue(vaultWithoutDescription);

            const result = await service.createVault(employeeId, dtoWithoutDescription);

            expect(vaultRepository.create).toHaveBeenCalledWith({
                name: dtoWithoutDescription.name,
                description: undefined,
                ownerId: employeeId,
            });
            expect(result).toEqual(vaultWithoutDescription);
        });

        it('should throw NotFoundException when employee does not exist', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(null);

            await expect(service.createVault(employeeId, createVaultDto)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.createVault(employeeId, createVaultDto)).rejects.toThrow(
                'Empleado no encontrado',
            );

            expect(employeeRepository.findOne).toHaveBeenCalledWith({
                where: { id: employeeId },
            });
            expect(vaultRepository.create).not.toHaveBeenCalled();
            expect(vaultRepository.save).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when employee is inactive', async () => {
            const inactiveEmployee = {
                ...mockEmployee,
                isActive: false,
            };

            mockEmployeeRepository.findOne.mockResolvedValue(inactiveEmployee);

            await expect(service.createVault(employeeId, createVaultDto)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.createVault(employeeId, createVaultDto)).rejects.toThrow(
                'El empleado no está activo',
            );

            expect(employeeRepository.findOne).toHaveBeenCalledWith({
                where: { id: employeeId },
            });
            expect(vaultRepository.create).not.toHaveBeenCalled();
            expect(vaultRepository.save).not.toHaveBeenCalled();
        });

        it('should set ownerId to the authenticated employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockVaultRepository.create.mockReturnValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(mockVault);

            const result = await service.createVault(employeeId, createVaultDto);

            expect(result.ownerId).toBe(employeeId);
        });

        it('should set timestamps automatically', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockVaultRepository.create.mockReturnValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(mockVault);

            const result = await service.createVault(employeeId, createVaultDto);

            expect(result.createdAt).toBeDefined();
            expect(result.updatedAt).toBeDefined();
        });

        // Feature: employee-password-vault, Property 38: Vault Creation Stores Name and Owner
        // **Validates: Requirements 13.1, 13.3**
        it('property: vault creation stores name and owner correctly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    fc.option(fc.string()),
                    async (vaultName, vaultDescription) => {
                        const testEmployeeId = '123e4567-e89b-12d3-a456-426614174000';
                        const testEmployee: Partial<Employee> = {
                            id: testEmployeeId,
                            isActive: true,
                            firstName: 'Test',
                            lastName: 'User',
                        };

                        const createDto: CreateVaultDto = {
                            name: vaultName,
                            description: vaultDescription ?? undefined,
                        };

                        // Reset mocks for each iteration
                        jest.clearAllMocks();
                        
                        mockEmployeeRepository.findOne.mockResolvedValue(testEmployee);
                        
                        // Mock create to return a vault object with the input values
                        mockVaultRepository.create.mockImplementation((vaultData: any) => ({
                            id: 'generated-uuid',
                            ...vaultData,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }));
                        
                        // Mock save to return the vault as-is
                        mockVaultRepository.save.mockImplementation((vault: any) => Promise.resolve(vault));

                        const result = await service.createVault(testEmployeeId, createDto);

                        // Verify name is stored correctly
                        expect(result.name).toBe(vaultName);
                        // Verify owner is set to the creating employee
                        expect(result.ownerId).toBe(testEmployeeId);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('findAllVaults', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';

        const mockVaults: Partial<Vault>[] = [
            {
                id: '456e7890-e89b-12d3-a456-426614174001',
                name: 'Alpha Project',
                description: 'Credentials for Alpha',
                ownerId: employeeId,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            },
            {
                id: '456e7890-e89b-12d3-a456-426614174002',
                name: 'Beta Project',
                description: 'Credentials for Beta',
                ownerId: employeeId,
                createdAt: new Date('2024-01-02'),
                updatedAt: new Date('2024-01-02'),
            },
            {
                id: '456e7890-e89b-12d3-a456-426614174003',
                name: 'Zeta Project',
                description: 'Credentials for Zeta',
                ownerId: employeeId,
                createdAt: new Date('2024-01-03'),
                updatedAt: new Date('2024-01-03'),
            },
        ];

        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                loadRelationCountAndMap: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            };

            mockVaultRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        });

        it('should return all vaults for the employee ordered by name ascending', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockVaults);

            const result = await service.findAllVaults(employeeId);

            expect(vaultRepository.createQueryBuilder).toHaveBeenCalledWith('vault');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('vault.ownerId = :employeeId', {
                employeeId,
            });
            expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
                'vault.credentialCount',
                'vault.credentials',
            );
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('vault.name', 'ASC');
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
            expect(result).toEqual(mockVaults);
        });

        it('should filter vaults by ownerId', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockVaults);

            await service.findAllVaults(employeeId);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('vault.ownerId = :employeeId', {
                employeeId,
            });
        });

        it('should include credential count for each vault', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockVaults);

            await service.findAllVaults(employeeId);

            expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
                'vault.credentialCount',
                'vault.credentials',
            );
        });

        it('should order vaults by name ascending', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockVaults);

            await service.findAllVaults(employeeId);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('vault.name', 'ASC');
        });

        it('should apply search filter when search term is provided', async () => {
            const searchTerm = 'Alpha';
            const filteredVaults = [mockVaults[0]];
            mockQueryBuilder.getMany.mockResolvedValue(filteredVaults);

            const result = await service.findAllVaults(employeeId, searchTerm);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'LOWER(vault.name) LIKE LOWER(:search)',
                {
                    search: `%${searchTerm}%`,
                },
            );
            expect(result).toEqual(filteredVaults);
        });

        it('should not apply search filter when search term is empty string', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockVaults);

            await service.findAllVaults(employeeId, '');

            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
        });

        it('should not apply search filter when search term is whitespace only', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockVaults);

            await service.findAllVaults(employeeId, '   ');

            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
        });

        it('should not apply search filter when search term is undefined', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockVaults);

            await service.findAllVaults(employeeId);

            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
        });

        it('should return empty array when no vaults match', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.findAllVaults(employeeId);

            expect(result).toEqual([]);
        });

        it('should perform case-insensitive search', async () => {
            const searchTerm = 'ALPHA';
            mockQueryBuilder.getMany.mockResolvedValue([mockVaults[0]]);

            await service.findAllVaults(employeeId, searchTerm);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'LOWER(vault.name) LIKE LOWER(:search)',
                {
                    search: `%${searchTerm}%`,
                },
            );
        });
    });

    describe('updateVault', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const vaultId = '456e7890-e89b-12d3-a456-426614174001';
        const otherEmployeeId = '789e0123-e89b-12d3-a456-426614174002';

        const mockVault: Partial<Vault> = {
            id: vaultId,
            name: 'Original Name',
            description: 'Original Description',
            ownerId: employeeId,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };

        it('should update vault name successfully', async () => {
            const updateVaultDto: UpdateVaultDto = {
                name: 'Updated Name',
            };

            const updatedVault = {
                ...mockVault,
                name: updateVaultDto.name,
                updatedAt: new Date('2024-01-02'),
            };

            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(updatedVault);

            const result = await service.updateVault(employeeId, vaultId, updateVaultDto);

            expect(vaultRepository.findOne).toHaveBeenCalledWith({
                where: { id: vaultId },
            });
            expect(vaultRepository.save).toHaveBeenCalled();
            expect(result.name).toBe(updateVaultDto.name);
        });

        it('should update vault description successfully', async () => {
            const updateVaultDto: UpdateVaultDto = {
                description: 'Updated Description',
            };

            const updatedVault = {
                ...mockVault,
                description: updateVaultDto.description,
                updatedAt: new Date('2024-01-02'),
            };

            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(updatedVault);

            const result = await service.updateVault(employeeId, vaultId, updateVaultDto);

            expect(result.description).toBe(updateVaultDto.description);
        });

        it('should update both name and description', async () => {
            const updateVaultDto: UpdateVaultDto = {
                name: 'Updated Name',
                description: 'Updated Description',
            };

            const updatedVault = {
                ...mockVault,
                name: updateVaultDto.name,
                description: updateVaultDto.description,
                updatedAt: new Date('2024-01-02'),
            };

            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(updatedVault);

            const result = await service.updateVault(employeeId, vaultId, updateVaultDto);

            expect(result.name).toBe(updateVaultDto.name);
            expect(result.description).toBe(updateVaultDto.description);
        });

        it('should throw NotFoundException when vault does not exist', async () => {
            const updateVaultDto: UpdateVaultDto = {
                name: 'Updated Name',
            };

            mockVaultRepository.findOne.mockResolvedValue(null);

            await expect(
                service.updateVault(employeeId, vaultId, updateVaultDto),
            ).rejects.toThrow(NotFoundException);
            await expect(
                service.updateVault(employeeId, vaultId, updateVaultDto),
            ).rejects.toThrow('Vault no encontrado');

            expect(vaultRepository.findOne).toHaveBeenCalledWith({
                where: { id: vaultId },
            });
            expect(vaultRepository.save).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when employee is not the owner', async () => {
            const updateVaultDto: UpdateVaultDto = {
                name: 'Updated Name',
            };

            mockVaultRepository.findOne.mockResolvedValue(mockVault);

            await expect(
                service.updateVault(otherEmployeeId, vaultId, updateVaultDto),
            ).rejects.toThrow(ForbiddenException);
            await expect(
                service.updateVault(otherEmployeeId, vaultId, updateVaultDto),
            ).rejects.toThrow('No tienes permisos para actualizar este vault');

            expect(vaultRepository.findOne).toHaveBeenCalledWith({
                where: { id: vaultId },
            });
            expect(vaultRepository.save).not.toHaveBeenCalled();
        });

        it('should validate ownership before updating', async () => {
            const updateVaultDto: UpdateVaultDto = {
                name: 'Updated Name',
            };

            mockVaultRepository.findOne.mockResolvedValue(mockVault);

            await expect(
                service.updateVault(otherEmployeeId, vaultId, updateVaultDto),
            ).rejects.toThrow(ForbiddenException);

            expect(vaultRepository.save).not.toHaveBeenCalled();
        });

        it('should set updated timestamp', async () => {
            const updateVaultDto: UpdateVaultDto = {
                name: 'Updated Name',
            };

            const updatedVault = {
                ...mockVault,
                name: updateVaultDto.name,
                updatedAt: new Date('2024-01-02'),
            };

            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(updatedVault);

            const result = await service.updateVault(employeeId, vaultId, updateVaultDto);

            expect(result.updatedAt).toBeDefined();
            if (mockVault.updatedAt && result.updatedAt) {
                expect(result.updatedAt.getTime()).toBeGreaterThan(mockVault.updatedAt.getTime());
            }
        });

        it('should only update provided fields', async () => {
            const updateVaultDto: UpdateVaultDto = {
                name: 'Updated Name',
            };

            const updatedVault = {
                ...mockVault,
                name: updateVaultDto.name,
                updatedAt: new Date('2024-01-02'),
            };

            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(updatedVault);

            const result = await service.updateVault(employeeId, vaultId, updateVaultDto);

            expect(result.name).toBe(updateVaultDto.name);
            expect(result.description).toBe(mockVault.description);
        });

        it('should handle empty update dto', async () => {
            const updateVaultDto: UpdateVaultDto = {};

            const updatedVault = {
                ...mockVault,
                updatedAt: new Date('2024-01-02'),
            };

            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockVaultRepository.save.mockResolvedValue(updatedVault);

            const result = await service.updateVault(employeeId, vaultId, updateVaultDto);

            expect(result.name).toBe(mockVault.name);
            expect(result.description).toBe(mockVault.description);
        });
    });

    describe('deleteVault', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const vaultId = '456e7890-e89b-12d3-a456-426614174001';
        const otherEmployeeId = '789e0123-e89b-12d3-a456-426614174002';

        const mockVault: Partial<Vault> = {
            id: vaultId,
            name: 'Test Vault',
            description: 'Test Description',
            ownerId: employeeId,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };

        it('should delete an empty vault successfully', async () => {
            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockCredentialRepository.count.mockResolvedValue(0);
            mockVaultRepository.remove.mockResolvedValue(mockVault);

            await service.deleteVault(employeeId, vaultId);

            expect(vaultRepository.findOne).toHaveBeenCalledWith({
                where: { id: vaultId },
            });
            expect(mockCredentialRepository.count).toHaveBeenCalledWith({
                where: { vaultId },
            });
            expect(mockVaultRepository.remove).toHaveBeenCalledWith(mockVault);
        });

        it('should throw NotFoundException when vault does not exist', async () => {
            mockVaultRepository.findOne.mockResolvedValue(null);

            await expect(service.deleteVault(employeeId, vaultId)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.deleteVault(employeeId, vaultId)).rejects.toThrow(
                'Vault no encontrado',
            );

            expect(vaultRepository.findOne).toHaveBeenCalledWith({
                where: { id: vaultId },
            });
            expect(mockCredentialRepository.count).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when employee is not the owner', async () => {
            mockVaultRepository.findOne.mockResolvedValue(mockVault);

            await expect(service.deleteVault(otherEmployeeId, vaultId)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.deleteVault(otherEmployeeId, vaultId)).rejects.toThrow(
                'No tienes permisos para eliminar este vault',
            );

            expect(vaultRepository.findOne).toHaveBeenCalledWith({
                where: { id: vaultId },
            });
            expect(mockCredentialRepository.count).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when vault contains credentials', async () => {
            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockCredentialRepository.count.mockResolvedValue(3);

            await expect(service.deleteVault(employeeId, vaultId)).rejects.toThrow(
                'No se puede eliminar un vault que contiene credenciales',
            );

            expect(vaultRepository.findOne).toHaveBeenCalledWith({
                where: { id: vaultId },
            });
            expect(mockCredentialRepository.count).toHaveBeenCalledWith({
                where: { vaultId },
            });
            expect(mockVaultRepository.remove).not.toHaveBeenCalled();
        });

        it('should validate ownership before checking credentials', async () => {
            mockVaultRepository.findOne.mockResolvedValue(mockVault);

            await expect(service.deleteVault(otherEmployeeId, vaultId)).rejects.toThrow(
                ForbiddenException,
            );

            expect(mockCredentialRepository.count).not.toHaveBeenCalled();
        });

        it('should check credential count before deletion', async () => {
            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockCredentialRepository.count.mockResolvedValue(0);
            mockVaultRepository.remove = jest.fn().mockResolvedValue(mockVault);

            await service.deleteVault(employeeId, vaultId);

            expect(mockCredentialRepository.count).toHaveBeenCalledWith({
                where: { vaultId },
            });
        });

        it('should not delete vault with exactly 1 credential', async () => {
            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockCredentialRepository.count.mockResolvedValue(1);

            await expect(service.deleteVault(employeeId, vaultId)).rejects.toThrow(
                'No se puede eliminar un vault que contiene credenciales',
            );

            expect(mockVaultRepository.remove).not.toHaveBeenCalled();
        });

        it('should not delete vault with multiple credentials', async () => {
            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockCredentialRepository.count.mockResolvedValue(5);

            await expect(service.deleteVault(employeeId, vaultId)).rejects.toThrow(
                'No se puede eliminar un vault que contiene credenciales',
            );

            expect(mockVaultRepository.remove).not.toHaveBeenCalled();
        });

        // Feature: employee-password-vault, Property 51: Non-Empty Vault Cannot Be Deleted
        // **Validates: Requirements 16.2**
        it('property: non-empty vault cannot be deleted', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 100 }),
                    async (credentialCount) => {
                        const testEmployeeId = '123e4567-e89b-12d3-a456-426614174000';
                        const testVaultId = '456e7890-e89b-12d3-a456-426614174001';
                        
                        const testVault: Partial<Vault> = {
                            id: testVaultId,
                            name: 'Test Vault',
                            description: 'Test Description',
                            ownerId: testEmployeeId,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                        };

                        // Reset mocks for each iteration
                        jest.clearAllMocks();
                        
                        mockVaultRepository.findOne.mockResolvedValue(testVault);
                        mockCredentialRepository.count.mockResolvedValue(credentialCount);

                        // Attempt to delete vault with credentials
                        await expect(
                            service.deleteVault(testEmployeeId, testVaultId)
                        ).rejects.toThrow(BadRequestException);

                        await expect(
                            service.deleteVault(testEmployeeId, testVaultId)
                        ).rejects.toThrow('No se puede eliminar un vault que contiene credenciales');

                        // Verify vault was not removed
                        expect(mockVaultRepository.remove).not.toHaveBeenCalled();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('createCredential', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const vaultId = '456e7890-e89b-12d3-a456-426614174001';

        const mockEmployee: Partial<Employee> = {
            id: employeeId,
            isActive: true,
            firstName: 'John',
            lastName: 'Doe',
        };

        const mockVault: Partial<Vault> = {
            id: vaultId,
            name: 'Test Vault',
            ownerId: employeeId,
        };

        let mockQueryRunner: any;

        beforeEach(() => {
            mockQueryRunner = {
                connect: jest.fn().mockResolvedValue(undefined),
                startTransaction: jest.fn().mockResolvedValue(undefined),
                commitTransaction: jest.fn().mockResolvedValue(undefined),
                rollbackTransaction: jest.fn().mockResolvedValue(undefined),
                release: jest.fn().mockResolvedValue(undefined),
                manager: {
                    save: jest.fn(),
                },
            };
            mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
        });

        // Feature: employee-password-vault, Property 4: Credential Creation Sets Owner and Vault
        // **Validates: Requirements 1.8, 1.9**
        it('property: credential creation sets owner and vault', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate employee ID
                    fc.uuid(),
                    // Generate vault ID
                    fc.uuid(),
                    // Generate URL
                    fc.webUrl(),
                    // Generate username
                    fc.string({ minLength: 1, maxLength: 50 }),
                    // Generate password
                    fc.string({ minLength: 1, maxLength: 50 }),
                    async (testEmployeeId, testVaultId, url, username, password) => {
                        // Reset mocks for each iteration
                        jest.clearAllMocks();

                        const testEmployee: Partial<Employee> = {
                            id: testEmployeeId,
                            isActive: true,
                            firstName: 'Test',
                            lastName: 'User',
                        };

                        const testVault: Partial<Vault> = {
                            id: testVaultId,
                            name: 'Test Vault',
                            ownerId: testEmployeeId,
                        };

                        // Setup mocks
                        mockEmployeeRepository.findOne.mockResolvedValue(testEmployee);
                        mockVaultRepository.findOne.mockResolvedValue(testVault);
                        mockEncryptionService.encrypt
                            .mockReturnValueOnce(`encrypted-${username}`)
                            .mockReturnValueOnce(`encrypted-${password}`);

                        // Mock the credential creation
                        const mockCredential = {
                            id: 'generated-uuid',
                            url,
                            encryptedUsername: `encrypted-${username}`,
                            encryptedPassword: `encrypted-${password}`,
                            title: 'Test Credential',
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            ownerId: testEmployeeId,
                            vaultId: testVaultId,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        mockCredentialRepository.create.mockReturnValue(mockCredential);
                        mockQueryRunner.manager.save.mockResolvedValue(mockCredential);

                        // Create the credential
                        const createDto = {
                            url,
                            username,
                            password,
                            title: 'Test Credential',
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            vaultId: testVaultId,
                        };

                        const result = await service.createCredential(testEmployeeId, createDto);

                        // Verify owner is set to the creating employee (Requirement 1.9)
                        expect(result.ownerId).toBe(testEmployeeId);

                        // Verify vault is associated correctly (Requirement 1.8)
                        expect(result.vaultId).toBe(testVaultId);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should create credential with minimum required fields only', async () => {
            const createDto = {
                url: 'https://example.com',
                username: 'testuser',
                password: 'testpass123',
                visibilityLevel: VisibilityLevel.PRIVATE,
                vaultId,
            };

            const mockCredential = {
                id: 'generated-uuid',
                url: createDto.url,
                encryptedUsername: 'encrypted-testuser',
                encryptedPassword: 'encrypted-testpass123',
                title: undefined,
                directLoginUrl: undefined,
                notes: undefined,
                logoId: undefined,
                visibilityLevel: VisibilityLevel.PRIVATE,
                ownerId: employeeId,
                vaultId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockVaultRepository.findOne.mockResolvedValue(mockVault);
            mockEncryptionService.encrypt
                .mockReturnValueOnce('encrypted-testuser')
                .mockReturnValueOnce('encrypted-testpass123');
            mockCredentialRepository.create.mockReturnValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(mockCredential);

            const result = await service.createCredential(employeeId, createDto);

            expect(result.url).toBe('https://example.com');
            expect(result.encryptedUsername).toBe('encrypted-testuser');
            expect(result.encryptedPassword).toBe('encrypted-testpass123');
            expect(result.visibilityLevel).toBe(VisibilityLevel.PRIVATE);
            expect(result.vaultId).toBe(vaultId);
            expect(result.ownerId).toBe(employeeId);
            expect(result.title).toBeUndefined();
            expect(result.directLoginUrl).toBeUndefined();
            expect(result.notes).toBeUndefined();
            expect(result.logoId).toBeUndefined();
        });

        // Feature: employee-password-vault, Property 3: Credential Creation Stores All Provided Fields
        // **Validates: Requirements 1.1, 1.4, 1.5, 1.6, 1.7**
        it('property: credential creation stores all provided fields', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate URL
                    fc.webUrl(),
                    // Generate username
                    fc.string({ minLength: 1, maxLength: 50 }),
                    // Generate password
                    fc.string({ minLength: 1, maxLength: 50 }),
                    // Generate optional title
                    fc.option(fc.string({ minLength: 1, maxLength: 200 })),
                    // Generate optional directLoginUrl
                    fc.option(fc.webUrl()),
                    // Generate optional notes
                    fc.option(fc.string({ minLength: 0, maxLength: 500 })),
                    // Generate optional logoId
                    fc.option(fc.uuid()),
                    async (url, username, password, title, directLoginUrl, notes, logoId) => {
                        // Reset mocks for each iteration
                        jest.clearAllMocks();

                        // Setup mocks
                        mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
                        mockVaultRepository.findOne.mockResolvedValue(mockVault);
                        mockEncryptionService.encrypt
                            .mockReturnValueOnce(`encrypted-${username}`)
                            .mockReturnValueOnce(`encrypted-${password}`);

                        // Mock the credential creation
                        const mockCredential = {
                            id: 'generated-uuid',
                            url,
                            encryptedUsername: `encrypted-${username}`,
                            encryptedPassword: `encrypted-${password}`,
                            title: title ?? undefined,
                            directLoginUrl: directLoginUrl ?? undefined,
                            notes: notes ?? undefined,
                            logoId: logoId ?? undefined,
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            ownerId: employeeId,
                            vaultId,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        mockCredentialRepository.create.mockReturnValue(mockCredential);
                        mockQueryRunner.manager.save.mockResolvedValue(mockCredential);

                        // Create the credential
                        const createDto: any = {
                            url,
                            username,
                            password,
                            title: title ?? undefined,
                            directLoginUrl: directLoginUrl ?? undefined,
                            notes: notes ?? undefined,
                            logoId: logoId ?? undefined,
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            vaultId,
                        };

                        const result = await service.createCredential(employeeId, createDto);

                        // Verify URL is stored (Requirement 1.1)
                        expect(result.url).toBe(url);

                        // Verify title is stored if provided (Requirement 1.5)
                        if (title !== null) {
                            expect(result.title).toBe(title);
                        }

                        // Verify logoId is stored if provided (Requirement 1.4)
                        if (logoId !== null) {
                            expect(result.logoId).toBe(logoId);
                        }

                        // Verify notes are stored if provided (Requirement 1.6)
                        if (notes !== null) {
                            expect(result.notes).toBe(notes);
                        }

                        // Verify directLoginUrl is stored if provided (Requirement 1.7)
                        if (directLoginUrl !== null) {
                            expect(result.directLoginUrl).toBe(directLoginUrl);
                        }

                        // Verify username and password are encrypted
                        expect(result.encryptedUsername).toBe(`encrypted-${username}`);
                        expect(result.encryptedPassword).toBe(`encrypted-${password}`);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('findAllCredentials', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const vaultId = '456e7890-e89b-12d3-a456-426614174001';

        const mockEmployee: Partial<Employee> = {
            id: employeeId,
            isActive: true,
            firstName: 'John',
            lastName: 'Doe',
        };

        const mockCredentials: Partial<Credential>[] = [
            {
                id: 'cred-1',
                title: 'Google Account',
                url: 'https://google.com',
                encryptedUsername: 'encrypted-user1',
                encryptedPassword: 'encrypted-pass1',
                ownerId: employeeId,
                vaultId: vaultId,
                createdAt: new Date('2024-01-03'),
            },
            {
                id: 'cred-2',
                title: 'GitHub Account',
                url: 'https://github.com',
                encryptedUsername: 'encrypted-user2',
                encryptedPassword: 'encrypted-pass2',
                ownerId: 'other-employee',
                vaultId: vaultId,
                createdAt: new Date('2024-01-02'),
            },
            {
                id: 'cred-3',
                title: 'AWS Console',
                url: 'https://aws.amazon.com',
                encryptedUsername: 'encrypted-user3',
                encryptedPassword: 'encrypted-pass3',
                ownerId: employeeId,
                vaultId: 'other-vault',
                createdAt: new Date('2024-01-01'),
            },
        ];

        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getCount: jest.fn(),
                getMany: jest.fn(),
            };

            mockCredentialRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        });

        it('should return paginated credentials for an active employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockCredentials);

            const result = await service.findAllCredentials(employeeId, {
                page: 1,
                limit: 10,
            });

            expect(employeeRepository.findOne).toHaveBeenCalledWith({
                where: { id: employeeId },
            });
            expect(result).toEqual({
                data: mockCredentials,
                total: 3,
                page: 1,
                limit: 10,
            });
        });

        it('should throw NotFoundException when employee does not exist', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(null);

            await expect(service.findAllCredentials(employeeId)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.findAllCredentials(employeeId)).rejects.toThrow(
                'Empleado no encontrado',
            );

            expect(employeeRepository.findOne).toHaveBeenCalledWith({
                where: { id: employeeId },
            });
        });

        it('should throw ForbiddenException when employee is inactive', async () => {
            const inactiveEmployee = {
                ...mockEmployee,
                isActive: false,
            };

            mockEmployeeRepository.findOne.mockResolvedValue(inactiveEmployee);

            await expect(service.findAllCredentials(employeeId)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.findAllCredentials(employeeId)).rejects.toThrow(
                'El empleado no está activo',
            );
        });

        it('should use default pagination values when not provided', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockCredentials);

            const result = await service.findAllCredentials(employeeId);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should calculate skip correctly for pagination', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(25);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.findAllCredentials(employeeId, {
                page: 3,
                limit: 10,
            });

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });

        it('should load all necessary relations', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.findAllCredentials(employeeId);

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'credential.vault',
                'vault',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'credential.owner',
                'owner',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'credential.logo',
                'logo',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'credential.visibilityCompanies',
                'visibilityCompanies',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'credential.visibilityAreas',
                'visibilityAreas',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'credential.visibilityPositions',
                'visibilityPositions',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'credential.visibilityEmployees',
                'visibilityEmployees',
            );
        });

        it('should order credentials by createdAt descending', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.findAllCredentials(employeeId);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('credential.createdAt', 'DESC');
        });

        it('should apply search filter when provided', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getMany.mockResolvedValue([mockCredentials[0]]);

            await service.findAllCredentials(employeeId, {
                search: 'google',
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('LOWER(credential.title) LIKE LOWER(:search)'),
                { search: '%google%' },
            );
        });

        it('should not apply search filter when search is empty', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockCredentials);

            await service.findAllCredentials(employeeId, {
                search: '',
            });

            // andWhere should not be called for search (only for vaultId if provided)
            const andWhereCalls = mockQueryBuilder.andWhere.mock.calls;
            const searchCalls = andWhereCalls.filter((call: any) =>
                call[0].includes('LOWER(credential.title)'),
            );
            expect(searchCalls.length).toBe(0);
        });

        it('should apply vaultId filter when provided', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(2);
            mockQueryBuilder.getMany.mockResolvedValue([mockCredentials[0], mockCredentials[1]]);

            await service.findAllCredentials(employeeId, {
                vaultId: vaultId,
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'credential.vaultId = :vaultId',
                { vaultId },
            );
        });

        it('should apply both search and vaultId filters when provided', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getMany.mockResolvedValue([mockCredentials[0]]);

            await service.findAllCredentials(employeeId, {
                search: 'google',
                vaultId: vaultId,
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('LOWER(credential.title) LIKE LOWER(:search)'),
                { search: '%google%' },
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'credential.vaultId = :vaultId',
                { vaultId },
            );
        });

        it('should return empty data array when no credentials match', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.findAllCredentials(employeeId);

            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
        });

        it('should include visibility conditions in where clause', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.findAllCredentials(employeeId);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                expect.stringContaining('credential.ownerId = :employeeId'),
                expect.objectContaining({
                    employeeId,
                    publicLevel: 'public',
                    activeStatus: 'active',
                }),
            );
        });

        it('should not decrypt passwords in list view', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getMany.mockResolvedValue([mockCredentials[0]]);

            const result = await service.findAllCredentials(employeeId);

            // Passwords should remain encrypted
            expect(result.data[0].encryptedPassword).toBe('encrypted-pass1');
            expect(result.data[0].encryptedUsername).toBe('encrypted-user1');
        });

        it('should handle custom page size', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(50);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.findAllCredentials(employeeId, {
                page: 2,
                limit: 25,
            });

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(25);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(25);
        });

        it('should perform case-insensitive search', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getMany.mockResolvedValue([mockCredentials[0]]);

            await service.findAllCredentials(employeeId, {
                search: 'GOOGLE',
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('LOWER(credential.title) LIKE LOWER(:search)'),
                { search: '%GOOGLE%' },
            );
        });

        it('should search in title, url, and vault name', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getMany.mockResolvedValue([mockCredentials[0]]);

            await service.findAllCredentials(employeeId, {
                search: 'test',
            });

            const whereClause = mockQueryBuilder.andWhere.mock.calls[0][0];
            expect(whereClause).toContain('LOWER(credential.title) LIKE LOWER(:search)');
            expect(whereClause).toContain('LOWER(credential.url) LIKE LOWER(:search)');
            expect(whereClause).toContain('LOWER(vault.name) LIKE LOWER(:search)');
        });

        // Feature: employee-password-vault, Property 13: Credential List Includes All Accessible Credentials
        // **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
        it('property: credential list includes all accessible credentials', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate number of owned credentials (Requirement 5.1)
                    fc.integer({ min: 0, max: 5 }),
                    // Generate number of public credentials (Requirement 5.2)
                    fc.integer({ min: 0, max: 5 }),
                    // Generate number of company-shared credentials (Requirement 5.3)
                    fc.integer({ min: 0, max: 5 }),
                    // Generate number of position-shared credentials (Requirement 5.5)
                    fc.integer({ min: 0, max: 5 }),
                    // Generate number of employee-list credentials (Requirement 5.6)
                    fc.integer({ min: 0, max: 5 }),
                    async (
                        ownedCount,
                        publicCount,
                        companyCount,
                        positionCount,
                        employeeListCount,
                    ) => {
                        // Reset mocks for each iteration
                        jest.clearAllMocks();

                        const testEmployeeId = '123e4567-e89b-12d3-a456-426614174000';
                        const testEmployee: Partial<Employee> = {
                            id: testEmployeeId,
                            isActive: true,
                            firstName: 'Test',
                            lastName: 'User',
                        };

                        // Calculate total expected credentials
                        const totalExpected =
                            ownedCount +
                            publicCount +
                            companyCount +
                            positionCount +
                            employeeListCount;

                        // Generate mock credentials for each category
                        const mockCredentialsList: Partial<Credential>[] = [];

                        // Add owned credentials (Requirement 5.1)
                        for (let i = 0; i < ownedCount; i++) {
                            mockCredentialsList.push({
                                id: `owned-${i}`,
                                title: `Owned Credential ${i}`,
                                url: `https://owned-${i}.com`,
                                encryptedUsername: `encrypted-user-${i}`,
                                encryptedPassword: `encrypted-pass-${i}`,
                                ownerId: testEmployeeId,
                                vaultId: 'vault-1',
                                visibilityLevel: VisibilityLevel.PRIVATE,
                                createdAt: new Date(),
                            });
                        }

                        // Add public credentials (Requirement 5.2)
                        for (let i = 0; i < publicCount; i++) {
                            mockCredentialsList.push({
                                id: `public-${i}`,
                                title: `Public Credential ${i}`,
                                url: `https://public-${i}.com`,
                                encryptedUsername: `encrypted-user-${i}`,
                                encryptedPassword: `encrypted-pass-${i}`,
                                ownerId: 'other-employee',
                                vaultId: 'vault-2',
                                visibilityLevel: VisibilityLevel.PUBLIC,
                                createdAt: new Date(),
                            });
                        }

                        // Add company-shared credentials (Requirement 5.3)
                        for (let i = 0; i < companyCount; i++) {
                            mockCredentialsList.push({
                                id: `company-${i}`,
                                title: `Company Credential ${i}`,
                                url: `https://company-${i}.com`,
                                encryptedUsername: `encrypted-user-${i}`,
                                encryptedPassword: `encrypted-pass-${i}`,
                                ownerId: 'other-employee',
                                vaultId: 'vault-3',
                                visibilityLevel: VisibilityLevel.BY_COMPANY,
                                createdAt: new Date(),
                            });
                        }

                        // Add position-shared credentials (Requirement 5.5)
                        for (let i = 0; i < positionCount; i++) {
                            mockCredentialsList.push({
                                id: `position-${i}`,
                                title: `Position Credential ${i}`,
                                url: `https://position-${i}.com`,
                                encryptedUsername: `encrypted-user-${i}`,
                                encryptedPassword: `encrypted-pass-${i}`,
                                ownerId: 'other-employee',
                                vaultId: 'vault-4',
                                visibilityLevel: VisibilityLevel.BY_POSITION,
                                createdAt: new Date(),
                            });
                        }

                        // Add employee-list credentials (Requirement 5.6)
                        for (let i = 0; i < employeeListCount; i++) {
                            mockCredentialsList.push({
                                id: `employee-list-${i}`,
                                title: `Employee List Credential ${i}`,
                                url: `https://employee-list-${i}.com`,
                                encryptedUsername: `encrypted-user-${i}`,
                                encryptedPassword: `encrypted-pass-${i}`,
                                ownerId: 'other-employee',
                                vaultId: 'vault-5',
                                visibilityLevel: VisibilityLevel.BY_EMPLOYEE_LIST,
                                createdAt: new Date(),
                            });
                        }

                        // Setup mocks
                        mockEmployeeRepository.findOne.mockResolvedValue(testEmployee);
                        mockQueryBuilder.getCount.mockResolvedValue(totalExpected);
                        mockQueryBuilder.getMany.mockResolvedValue(mockCredentialsList);

                        // Execute the method
                        const result = await service.findAllCredentials(testEmployeeId);

                        // Verify the query builder was called with visibility conditions
                        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                            expect.stringContaining('credential.ownerId = :employeeId'),
                            expect.objectContaining({
                                employeeId: testEmployeeId,
                                publicLevel: VisibilityLevel.PUBLIC,
                            }),
                        );

                        // Verify all expected credentials are included
                        expect(result.data.length).toBe(totalExpected);
                        expect(result.total).toBe(totalExpected);

                        // Verify owned credentials are included (Requirement 5.1)
                        const ownedCredentials = result.data.filter(
                            (c) => c.ownerId === testEmployeeId,
                        );
                        expect(ownedCredentials.length).toBe(ownedCount);

                        // Verify public credentials are included (Requirement 5.2)
                        const publicCredentials = result.data.filter(
                            (c) => c.visibilityLevel === VisibilityLevel.PUBLIC,
                        );
                        expect(publicCredentials.length).toBe(publicCount);

                        // Verify company-shared credentials are included (Requirement 5.3)
                        const companyCredentials = result.data.filter(
                            (c) => c.visibilityLevel === VisibilityLevel.BY_COMPANY,
                        );
                        expect(companyCredentials.length).toBe(companyCount);

                        // Verify position-shared credentials are included (Requirement 5.5)
                        const positionCredentials = result.data.filter(
                            (c) => c.visibilityLevel === VisibilityLevel.BY_POSITION,
                        );
                        expect(positionCredentials.length).toBe(positionCount);

                        // Verify employee-list credentials are included (Requirement 5.6)
                        const employeeListCredentials = result.data.filter(
                            (c) => c.visibilityLevel === VisibilityLevel.BY_EMPLOYEE_LIST,
                        );
                        expect(employeeListCredentials.length).toBe(employeeListCount);
                    },
                ),
                { numRuns: 100 },
            );
        });

        // Feature: employee-password-vault, Property 14: Credential List Ordered by Creation Date Descending
        // **Validates: Requirements 5.7**
        it('property: credential list ordered by creation date descending', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate a list of credentials with random creation dates
                    fc.array(
                        fc.record({
                            id: fc.uuid(),
                            title: fc.string({ minLength: 1, maxLength: 50 }),
                            url: fc.webUrl(),
                            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
                        }),
                        { minLength: 2, maxLength: 10 }
                    ).filter(arr => arr.every(item => !isNaN(item.createdAt.getTime()))), // Filter out invalid dates
                    async (credentialData) => {
                        // Reset mocks for each iteration
                        jest.clearAllMocks();

                        const testEmployeeId = '123e4567-e89b-12d3-a456-426614174000';
                        const testEmployee: Partial<Employee> = {
                            id: testEmployeeId,
                            isActive: true,
                            firstName: 'Test',
                            lastName: 'User',
                        };

                        // Sort the credentials by createdAt descending (newest first) - this is what we expect
                        const sortedCredentials = [...credentialData].sort(
                            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                        );

                        // Create mock credentials with the sorted order
                        const mockCredentialsList: Partial<Credential>[] = sortedCredentials.map((data) => ({
                            id: data.id,
                            title: data.title,
                            url: data.url,
                            encryptedUsername: `encrypted-user-${data.id}`,
                            encryptedPassword: `encrypted-pass-${data.id}`,
                            ownerId: testEmployeeId,
                            vaultId: 'vault-1',
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            createdAt: data.createdAt,
                            updatedAt: data.createdAt,
                        }));

                        // Setup mocks
                        mockEmployeeRepository.findOne.mockResolvedValue(testEmployee);
                        mockQueryBuilder.getCount.mockResolvedValue(mockCredentialsList.length);
                        mockQueryBuilder.getMany.mockResolvedValue(mockCredentialsList);

                        // Execute the method
                        const result = await service.findAllCredentials(testEmployeeId);

                        // Verify orderBy was called with createdAt DESC
                        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('credential.createdAt', 'DESC');

                        // Verify the returned list is ordered by createdAt descending (newest first)
                        for (let i = 0; i < result.data.length - 1; i++) {
                            const current = result.data[i].createdAt;
                            const next = result.data[i + 1].createdAt;
                            
                            // Current credential should have a createdAt >= next credential (descending order)
                            expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
                        }

                        // Additional verification: first credential should be the newest
                        if (result.data.length > 0) {
                            const firstCredential = result.data[0];
                            const allDates = result.data.map(c => c.createdAt.getTime());
                            const maxDate = Math.max(...allDates);
                            expect(firstCredential.createdAt.getTime()).toBe(maxDate);
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('findOneCredential', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const credentialId = 'cred-123e4567-e89b-12d3-a456-426614174000';
        const vaultId = 'vault-123e4567-e89b-12d3-a456-426614174000';

        const mockCredential: Partial<Credential> = {
            id: credentialId,
            title: 'Google Account',
            url: 'https://google.com',
            encryptedUsername: 'encrypted-username-data',
            encryptedPassword: 'encrypted-password-data',
            directLoginUrl: 'https://accounts.google.com',
            notes: 'Test notes',
            logoId: 'logo-id',
            visibilityLevel: VisibilityLevel.PRIVATE,
            ownerId: employeeId,
            vaultId: vaultId,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            vault: {
                id: vaultId,
                name: 'Test Vault',
            } as any,
            owner: {
                id: employeeId,
                firstName: 'John',
                lastName: 'Doe',
            } as any,
            logo: undefined,
            visibilityCompanies: [],
            visibilityAreas: [],
            visibilityPositions: [],
            visibilityEmployees: [],
        };

        const mockAccessLog: Partial<CredentialAccessLog> = {
            id: 'log-123',
            credentialId: credentialId,
            employeeId: employeeId,
            accessedAt: new Date(),
        };

        it('should return credential with decrypted username and password when employee has access', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('decrypted-username')
                .mockReturnValueOnce('decrypted-password');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            const result = await service.findOneCredential(employeeId, credentialId);

            expect(credentialRepository.findOne).toHaveBeenCalledWith({
                where: { id: credentialId },
                relations: [
                    'vault',
                    'owner',
                    'logo',
                    'visibilityCompanies',
                    'visibilityAreas',
                    'visibilityPositions',
                    'visibilityEmployees',
                ],
            });
            expect(accessControlService.canAccessCredential).toHaveBeenCalledWith(
                employeeId,
                mockCredential,
            );
            expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted-username-data');
            expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted-password-data');
            expect(result.username).toBe('decrypted-username');
            expect(result.password).toBe('decrypted-password');
            expect(result.id).toBe(credentialId);
            expect(result.title).toBe('Google Account');
        });

        it('should throw NotFoundException when credential does not exist', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(null);

            await expect(service.findOneCredential(employeeId, credentialId)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.findOneCredential(employeeId, credentialId)).rejects.toThrow(
                'Credencial no encontrada',
            );

            expect(credentialRepository.findOne).toHaveBeenCalledWith({
                where: { id: credentialId },
                relations: [
                    'vault',
                    'owner',
                    'logo',
                    'visibilityCompanies',
                    'visibilityAreas',
                    'visibilityPositions',
                    'visibilityEmployees',
                ],
            });
            expect(accessControlService.canAccessCredential).not.toHaveBeenCalled();
            expect(encryptionService.decrypt).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when employee does not have access', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(false);

            await expect(service.findOneCredential(employeeId, credentialId)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.findOneCredential(employeeId, credentialId)).rejects.toThrow(
                'No tienes permisos para acceder a esta credencial',
            );

            expect(credentialRepository.findOne).toHaveBeenCalled();
            expect(accessControlService.canAccessCredential).toHaveBeenCalledWith(
                employeeId,
                mockCredential,
            );
            expect(encryptionService.decrypt).not.toHaveBeenCalled();
            expect(credentialAccessLogRepository.save).not.toHaveBeenCalled();
        });

        it('should load credential with all visibility relations', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('decrypted-username')
                .mockReturnValueOnce('decrypted-password');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            await service.findOneCredential(employeeId, credentialId);

            expect(credentialRepository.findOne).toHaveBeenCalledWith({
                where: { id: credentialId },
                relations: expect.arrayContaining([
                    'vault',
                    'owner',
                    'logo',
                    'visibilityCompanies',
                    'visibilityAreas',
                    'visibilityPositions',
                    'visibilityEmployees',
                ]),
            });
        });

        it('should create access log entry when credential is accessed', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('decrypted-username')
                .mockReturnValueOnce('decrypted-password');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            await service.findOneCredential(employeeId, credentialId);

            expect(credentialAccessLogRepository.create).toHaveBeenCalledWith({
                credentialId: credentialId,
                employeeId: employeeId,
            });
            expect(credentialAccessLogRepository.save).toHaveBeenCalledWith(mockAccessLog);
        });

        it('should decrypt both username and password', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('user@example.com')
                .mockReturnValueOnce('mySecretPassword123');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            const result = await service.findOneCredential(employeeId, credentialId);

            expect(encryptionService.decrypt).toHaveBeenCalledTimes(2);
            expect(encryptionService.decrypt).toHaveBeenNthCalledWith(
                1,
                'encrypted-username-data',
            );
            expect(encryptionService.decrypt).toHaveBeenNthCalledWith(
                2,
                'encrypted-password-data',
            );
            expect(result.username).toBe('user@example.com');
            expect(result.password).toBe('mySecretPassword123');
        });

        it('should return all credential fields including decrypted data', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('decrypted-username')
                .mockReturnValueOnce('decrypted-password');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            const result = await service.findOneCredential(employeeId, credentialId);

            expect(result.id).toBe(credentialId);
            expect(result.title).toBe('Google Account');
            expect(result.url).toBe('https://google.com');
            expect(result.directLoginUrl).toBe('https://accounts.google.com');
            expect(result.notes).toBe('Test notes');
            expect(result.logoId).toBe('logo-id');
            expect(result.visibilityLevel).toBe(VisibilityLevel.PRIVATE);
            expect(result.ownerId).toBe(employeeId);
            expect(result.vaultId).toBe(vaultId);
            expect(result.username).toBe('decrypted-username');
            expect(result.password).toBe('decrypted-password');
            expect(result.vault).toBeDefined();
            expect(result.owner).toBeDefined();
        });

        it('should validate access before decrypting', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(false);

            await expect(service.findOneCredential(employeeId, credentialId)).rejects.toThrow(
                ForbiddenException,
            );

            expect(accessControlService.canAccessCredential).toHaveBeenCalled();
            expect(encryptionService.decrypt).not.toHaveBeenCalled();
        });

        it('should not create access log when access is denied', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(false);

            await expect(service.findOneCredential(employeeId, credentialId)).rejects.toThrow(
                ForbiddenException,
            );

            expect(credentialAccessLogRepository.create).not.toHaveBeenCalled();
            expect(credentialAccessLogRepository.save).not.toHaveBeenCalled();
        });

        it('should handle public credentials', async () => {
            const publicCredential = {
                ...mockCredential,
                visibilityLevel: VisibilityLevel.PUBLIC,
                ownerId: 'other-employee-id',
            };

            mockCredentialRepository.findOne.mockResolvedValue(publicCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('public-username')
                .mockReturnValueOnce('public-password');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            const result = await service.findOneCredential(employeeId, credentialId);

            expect(result.username).toBe('public-username');
            expect(result.password).toBe('public-password');
            expect(credentialAccessLogRepository.save).toHaveBeenCalled();
        });

        it('should handle credentials with visibility by company', async () => {
            const companyCredential = {
                ...mockCredential,
                visibilityLevel: VisibilityLevel.BY_COMPANY,
                visibilityCompanies: [{ id: 'vc-1', companyId: 'company-1' }],
            };

            mockCredentialRepository.findOne.mockResolvedValue(companyCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('company-username')
                .mockReturnValueOnce('company-password');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            const result = await service.findOneCredential(employeeId, credentialId);

            expect(result.username).toBe('company-username');
            expect(result.password).toBe('company-password');
        });

        it('should handle credentials with visibility by position', async () => {
            const positionCredential = {
                ...mockCredential,
                visibilityLevel: VisibilityLevel.BY_POSITION,
                visibilityPositions: [{ id: 'vp-1', positionId: 'position-1' }],
            };

            mockCredentialRepository.findOne.mockResolvedValue(positionCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('position-username')
                .mockReturnValueOnce('position-password');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            const result = await service.findOneCredential(employeeId, credentialId);

            expect(result.username).toBe('position-username');
            expect(result.password).toBe('position-password');
        });

        it('should handle credentials with visibility by employee list', async () => {
            const employeeListCredential = {
                ...mockCredential,
                visibilityLevel: VisibilityLevel.BY_EMPLOYEE_LIST,
                visibilityEmployees: [{ id: 've-1', employeeId: employeeId }],
            };

            mockCredentialRepository.findOne.mockResolvedValue(employeeListCredential);
            mockAccessControlService.canAccessCredential.mockResolvedValue(true);
            mockEncryptionService.decrypt
                .mockReturnValueOnce('list-username')
                .mockReturnValueOnce('list-password');
            mockCredentialAccessLogRepository.create.mockReturnValue(mockAccessLog);
            mockCredentialAccessLogRepository.save.mockResolvedValue(mockAccessLog);

            const result = await service.findOneCredential(employeeId, credentialId);

            expect(result.username).toBe('list-username');
            expect(result.password).toBe('list-password');
        });

        // Feature: employee-password-vault, Property 26: Credential Access Creates Audit Log
        // **Validates: Requirements 10.1, 10.2, 10.3**
        it('property: credential access creates audit log', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate employee ID
                    fc.uuid(),
                    // Generate credential ID
                    fc.uuid(),
                    async (testEmployeeId, testCredentialId) => {
                        // Reset mocks for each iteration
                        jest.clearAllMocks();

                        const testCredential: Partial<Credential> = {
                            id: testCredentialId,
                            title: 'Test Credential',
                            url: 'https://test.com',
                            encryptedUsername: 'encrypted-user',
                            encryptedPassword: 'encrypted-pass',
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            ownerId: testEmployeeId,
                            vaultId: 'vault-id',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            vault: { id: 'vault-id', name: 'Test Vault' } as any,
                            owner: { id: testEmployeeId, firstName: 'Test', lastName: 'User' } as any,
                            logo: undefined,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        // Setup mocks
                        mockCredentialRepository.findOne.mockResolvedValue(testCredential);
                        mockAccessControlService.canAccessCredential.mockResolvedValue(true);
                        mockEncryptionService.decrypt
                            .mockReturnValueOnce('decrypted-user')
                            .mockReturnValueOnce('decrypted-pass');

                        // Track the access log creation
                        let capturedAccessLog: any = null;
                        mockCredentialAccessLogRepository.create.mockImplementation((logData: any) => {
                            capturedAccessLog = {
                                id: 'log-id',
                                ...logData,
                                accessedAt: new Date(),
                            };
                            return capturedAccessLog;
                        });
                        mockCredentialAccessLogRepository.save.mockImplementation((log: any) => Promise.resolve(log));

                        // Access the credential
                        await service.findOneCredential(testEmployeeId, testCredentialId);

                        // Verify access log was created with correct data
                        expect(mockCredentialAccessLogRepository.create).toHaveBeenCalledWith({
                            credentialId: testCredentialId, // Requirement 10.3
                            employeeId: testEmployeeId,     // Requirement 10.1
                        });

                        // Verify access log was saved
                        expect(mockCredentialAccessLogRepository.save).toHaveBeenCalledWith(capturedAccessLog);

                        // Verify the saved log has a timestamp (Requirement 10.2)
                        expect(capturedAccessLog).toBeDefined();
                        expect(capturedAccessLog.accessedAt).toBeInstanceOf(Date);
                        expect(capturedAccessLog.credentialId).toBe(testCredentialId);
                        expect(capturedAccessLog.employeeId).toBe(testEmployeeId);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('updateCredential', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const credentialId = 'cred-123';
        const otherEmployeeId = '789e0123-e89b-12d3-a456-426614174002';

        const mockCredential: Partial<Credential> = {
            id: credentialId,
            title: 'Original Title',
            url: 'https://original.com',
            encryptedUsername: 'encrypted-original-user',
            encryptedPassword: 'encrypted-original-pass',
            directLoginUrl: 'https://original.com/login',
            notes: 'Original notes',
            logoId: 'logo-1',
            visibilityLevel: VisibilityLevel.PRIVATE,
            ownerId: employeeId,
            vaultId: 'vault-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };

        let mockQueryRunner: any;

        beforeEach(() => {
            mockQueryRunner = {
                connect: jest.fn().mockResolvedValue(undefined),
                startTransaction: jest.fn().mockResolvedValue(undefined),
                commitTransaction: jest.fn().mockResolvedValue(undefined),
                rollbackTransaction: jest.fn().mockResolvedValue(undefined),
                release: jest.fn().mockResolvedValue(undefined),
                manager: {
                    save: jest.fn(),
                    delete: jest.fn().mockResolvedValue(undefined),
                },
            };
            mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
        });

        it('should update credential title successfully', async () => {
            const updateDto = { title: 'Updated Title' };
            const updatedCredential = { ...mockCredential, ...updateDto };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);

            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(credentialRepository.findOne).toHaveBeenCalledWith({
                where: { id: credentialId },
            });
            expect(result.title).toBe('Updated Title');
        });

        it('should update credential url successfully', async () => {
            const updateDto = { url: 'https://updated.com' };
            const updatedCredential = { ...mockCredential, ...updateDto };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(result.url).toBe('https://updated.com');
        });

        it('should encrypt and update username when provided', async () => {
            const updateDto = { username: 'new-username' };
            const updatedCredential = {
                ...mockCredential,
                encryptedUsername: 'encrypted-new-username',
            };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockEncryptionService.encrypt.mockReturnValue('encrypted-new-username');
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(encryptionService.encrypt).toHaveBeenCalledWith('new-username');
            expect(result.encryptedUsername).toBe('encrypted-new-username');
        });

        it('should encrypt and update password when provided', async () => {
            const updateDto = { password: 'new-password' };
            const updatedCredential = {
                ...mockCredential,
                encryptedPassword: 'encrypted-new-password',
            };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockEncryptionService.encrypt.mockReturnValue('encrypted-new-password');
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(encryptionService.encrypt).toHaveBeenCalledWith('new-password');
            expect(result.encryptedPassword).toBe('encrypted-new-password');
        });

        it('should update multiple fields at once', async () => {
            const updateDto = {
                title: 'Updated Title',
                url: 'https://updated.com',
                notes: 'Updated notes',
            };
            const updatedCredential = { ...mockCredential, ...updateDto };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(result.title).toBe('Updated Title');
            expect(result.url).toBe('https://updated.com');
            expect(result.notes).toBe('Updated notes');
        });

        it('should throw NotFoundException when credential does not exist', async () => {
            const updateDto = { title: 'Updated Title' };

            mockCredentialRepository.findOne.mockResolvedValue(null);

            await expect(
                service.updateCredential(employeeId, credentialId, updateDto),
            ).rejects.toThrow(NotFoundException);
            await expect(
                service.updateCredential(employeeId, credentialId, updateDto),
            ).rejects.toThrow('Credencial no encontrada');
        });

        it('should throw ForbiddenException when employee is not the owner', async () => {
            const updateDto = { title: 'Updated Title' };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);

            await expect(
                service.updateCredential(otherEmployeeId, credentialId, updateDto),
            ).rejects.toThrow(ForbiddenException);
            await expect(
                service.updateCredential(otherEmployeeId, credentialId, updateDto),
            ).rejects.toThrow('No tienes permisos para actualizar esta credencial');
        });

        it('should update visibility level and recreate visibility records', async () => {
            const updateDto = {
                visibilityLevel: VisibilityLevel.PUBLIC,
            };
            const updatedCredential = { ...mockCredential, ...updateDto };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(mockQueryRunner.manager.delete).toHaveBeenCalledTimes(4);
            expect(result.visibilityLevel).toBe(VisibilityLevel.PUBLIC);
        });

        it('should delete old visibility records when changing visibility level', async () => {
            const updateDto = {
                visibilityLevel: VisibilityLevel.BY_COMPANY,
                companyIds: ['company-1'],
            };
            const updatedCredential = { ...mockCredential, ...updateDto };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockCompanyRepository.findByIds.mockResolvedValue([{ id: 'company-1' }]);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);

            await service.updateCredential(employeeId, credentialId, updateDto);

            expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
                expect.anything(),
                { credentialId: credentialId },
            );
        });

        it('should use transaction for atomicity', async () => {
            const updateDto = { title: 'Updated Title' };
            const updatedCredential = { ...mockCredential, ...updateDto };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            await service.updateCredential(employeeId, credentialId, updateDto);

            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            const updateDto = { title: 'Updated Title' };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));            await expect(
                service.updateCredential(employeeId, credentialId, updateDto),
            ).rejects.toThrow('Database error');

            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should only update provided fields (partial update)', async () => {
            const updateDto = { title: 'Updated Title' };
            const updatedCredential = {
                ...mockCredential,
                title: 'Updated Title',
            };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(result.title).toBe('Updated Title');
            expect(result.url).toBe(mockCredential.url);
            expect(result.notes).toBe(mockCredential.notes);
        });

        it('should handle empty update dto', async () => {
            const updateDto = {};
            const updatedCredential = { ...mockCredential };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(result).toEqual(mockCredential);
        });

        it('should update vaultId when provided', async () => {
            const updateDto = { vaultId: 'new-vault-id' };
            const updatedCredential = { ...mockCredential, vaultId: 'new-vault-id' };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(result.vaultId).toBe('new-vault-id');
        });

        it('should update logoId when provided', async () => {
            const updateDto = { logoId: 'new-logo-id' };
            const updatedCredential = { ...mockCredential, logoId: 'new-logo-id' };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(result.logoId).toBe('new-logo-id');
        });

        it('should update directLoginUrl when provided', async () => {
            const updateDto = { directLoginUrl: 'https://new-login.com' };
            const updatedCredential = {
                ...mockCredential,
                directLoginUrl: 'https://new-login.com',
            };

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.save.mockResolvedValue(updatedCredential);            const result = await service.updateCredential(employeeId, credentialId, updateDto);

            expect(result.directLoginUrl).toBe('https://new-login.com');
        });

        // Feature: employee-password-vault, Property 16: Only Owner Can Update Credential
        // **Validates: Requirements 6.1, 6.11**
        it('property: only owner can update credential', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate owner employee ID
                    fc.uuid(),
                    // Generate non-owner employee ID (different from owner)
                    fc.uuid(),
                    // Generate credential ID
                    fc.uuid(),
                    // Generate update data
                    fc.record({
                        title: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
                        url: fc.option(fc.webUrl()),
                        username: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
                        password: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
                        notes: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
                    }),
                    async (ownerId, nonOwnerId, credId, updateData) => {
                        // Ensure owner and non-owner are different
                        fc.pre(ownerId !== nonOwnerId);

                        // Reset mocks for each iteration
                        jest.clearAllMocks();

                        const testCredential: Partial<Credential> = {
                            id: credId,
                            title: 'Original Title',
                            url: 'https://original.com',
                            encryptedUsername: 'encrypted-original-user',
                            encryptedPassword: 'encrypted-original-pass',
                            ownerId: ownerId,
                            vaultId: 'vault-1',
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                        };

                        // Setup mocks
                        mockCredentialRepository.findOne.mockResolvedValue(testCredential);

                        // Convert null to undefined for DTO compatibility
                        const updateDto: any = {
                            title: updateData.title ?? undefined,
                            url: updateData.url ?? undefined,
                            username: updateData.username ?? undefined,
                            password: updateData.password ?? undefined,
                            notes: updateData.notes ?? undefined,
                        };

                        // Attempt to update as non-owner (Requirement 6.11)
                        await expect(
                            service.updateCredential(nonOwnerId, credId, updateDto)
                        ).rejects.toThrow(ForbiddenException);

                        await expect(
                            service.updateCredential(nonOwnerId, credId, updateDto)
                        ).rejects.toThrow('No tienes permisos para actualizar esta credencial');

                        // Verify that the credential was checked for ownership (Requirement 6.1)
                        expect(mockCredentialRepository.findOne).toHaveBeenCalledWith({
                            where: { id: credId },
                        });

                        // Verify that no transaction was started (update was denied)
                        expect(mockQueryRunner.connect).not.toHaveBeenCalled();
                        expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('deleteCredential', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const credentialId = 'cred-123';
        const otherEmployeeId = '789e0123-e89b-12d3-a456-426614174002';

        const mockCredential: Partial<Credential> = {
            id: credentialId,
            title: 'Test Credential',
            url: 'https://test.com',
            ownerId: employeeId,
            vaultId: 'vault-123',
            visibilityLevel: VisibilityLevel.PRIVATE,
            encryptedUsername: 'encrypted-username',
            encryptedPassword: 'encrypted-password',
        };

        let mockQueryRunner: any;

        beforeEach(() => {
            mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                manager: {
                    delete: jest.fn(),
                    remove: jest.fn(),
                },
            };

            mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
        });

        it('should delete credential successfully when employee is owner', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.remove.mockResolvedValue(mockCredential);

            await service.deleteCredential(employeeId, credentialId);

            expect(mockCredentialRepository.findOne).toHaveBeenCalledWith({
                where: { id: credentialId },
            });
            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(mockCredential);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should throw NotFoundException when credential does not exist', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(null);

            await expect(service.deleteCredential(employeeId, credentialId)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.deleteCredential(employeeId, credentialId)).rejects.toThrow(
                'Credencial no encontrada',
            );

            expect(mockCredentialRepository.findOne).toHaveBeenCalledWith({
                where: { id: credentialId },
            });
            expect(mockQueryRunner.connect).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when employee is not the owner', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);

            await expect(
                service.deleteCredential(otherEmployeeId, credentialId),
            ).rejects.toThrow(ForbiddenException);
            await expect(
                service.deleteCredential(otherEmployeeId, credentialId),
            ).rejects.toThrow('No tienes permisos para eliminar esta credencial');

            expect(mockCredentialRepository.findOne).toHaveBeenCalledWith({
                where: { id: credentialId },
            });
            expect(mockQueryRunner.connect).not.toHaveBeenCalled();
        });

        it('should delete all visibility records for companies', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.remove.mockResolvedValue(mockCredential);

            await service.deleteCredential(employeeId, credentialId);

            expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
                CredentialVisibilityCompany,
                { credentialId: credentialId },
            );
        });

        it('should delete all visibility records for areas', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.remove.mockResolvedValue(mockCredential);

            await service.deleteCredential(employeeId, credentialId);

            expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
                CredentialVisibilityArea,
                { credentialId: credentialId },
            );
        });

        it('should delete all visibility records for positions', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.remove.mockResolvedValue(mockCredential);

            await service.deleteCredential(employeeId, credentialId);

            expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
                CredentialVisibilityPosition,
                { credentialId: credentialId },
            );
        });

        it('should delete all visibility records for employees', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.remove.mockResolvedValue(mockCredential);

            await service.deleteCredential(employeeId, credentialId);

            expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
                CredentialVisibilityEmployee,
                { credentialId: credentialId },
            );
        });

        it('should delete visibility records before deleting credential', async () => {
            const deletionOrder: string[] = [];

            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.delete.mockImplementation(() => {
                deletionOrder.push('visibility');
                return Promise.resolve();
            });
            mockQueryRunner.manager.remove.mockImplementation(() => {
                deletionOrder.push('credential');
                return Promise.resolve(mockCredential);
            });

            await service.deleteCredential(employeeId, credentialId);

            expect(deletionOrder[0]).toBe('visibility');
            expect(deletionOrder[deletionOrder.length - 1]).toBe('credential');
        });

        it('should use transaction for atomicity', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.remove.mockResolvedValue(mockCredential);

            await service.deleteCredential(employeeId, credentialId);

            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);
            mockQueryRunner.manager.delete.mockRejectedValue(new Error('Database error'));

            await expect(service.deleteCredential(employeeId, credentialId)).rejects.toThrow(
                'Database error',
            );

            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should validate ownership before starting transaction', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(mockCredential);

            await expect(
                service.deleteCredential(otherEmployeeId, credentialId),
            ).rejects.toThrow(ForbiddenException);

            expect(mockQueryRunner.connect).not.toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
        });

        it('should validate existence before starting transaction', async () => {
            mockCredentialRepository.findOne.mockResolvedValue(null);

            await expect(service.deleteCredential(employeeId, credentialId)).rejects.toThrow(
                NotFoundException,
            );

            expect(mockQueryRunner.connect).not.toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
        });

        // Feature: employee-password-vault, Property 20: Credential Deletion Removes Credential and Visibility Associations
        // **Validates: Requirements 7.2, 7.3**
        it('property: credential deletion removes credential and visibility associations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(
                        VisibilityLevel.BY_COMPANY,
                        VisibilityLevel.BY_AREA,
                        VisibilityLevel.BY_POSITION,
                        VisibilityLevel.BY_EMPLOYEE_LIST,
                    ),
                    fc.integer({ min: 1, max: 5 }),
                    async (visibilityLevel, associationCount) => {
                        const testEmployeeId = '123e4567-e89b-12d3-a456-426614174000';
                        const testCredentialId = 'test-cred-' + Math.random().toString(36).substring(7);

                        const testCredential: Partial<Credential> = {
                            id: testCredentialId,
                            title: 'Test Credential',
                            url: 'https://test.com',
                            ownerId: testEmployeeId,
                            vaultId: 'vault-123',
                            visibilityLevel: visibilityLevel,
                            encryptedUsername: 'encrypted-username',
                            encryptedPassword: 'encrypted-password',
                        };

                        // Reset mocks for each iteration
                        jest.clearAllMocks();

                        // Track deletion calls
                        const deletedVisibilityTypes: string[] = [];
                        let credentialDeleted = false;

                        // Setup query runner mock
                        const testQueryRunner = {
                            connect: jest.fn(),
                            startTransaction: jest.fn(),
                            commitTransaction: jest.fn(),
                            rollbackTransaction: jest.fn(),
                            release: jest.fn(),
                            manager: {
                                delete: jest.fn().mockImplementation((entity: any) => {
                                    if (entity === CredentialVisibilityCompany) {
                                        deletedVisibilityTypes.push('company');
                                    } else if (entity === CredentialVisibilityArea) {
                                        deletedVisibilityTypes.push('area');
                                    } else if (entity === CredentialVisibilityPosition) {
                                        deletedVisibilityTypes.push('position');
                                    } else if (entity === CredentialVisibilityEmployee) {
                                        deletedVisibilityTypes.push('employee');
                                    }
                                    return Promise.resolve();
                                }),
                                remove: jest.fn().mockImplementation(() => {
                                    credentialDeleted = true;
                                    return Promise.resolve(testCredential);
                                }),
                            },
                        };

                        mockDataSource.createQueryRunner.mockReturnValue(testQueryRunner);
                        mockCredentialRepository.findOne.mockResolvedValue(testCredential);

                        // Execute deletion
                        await service.deleteCredential(testEmployeeId, testCredentialId);

                        // Verify all visibility association types were deleted
                        expect(testQueryRunner.manager.delete).toHaveBeenCalledWith(
                            CredentialVisibilityCompany,
                            { credentialId: testCredentialId },
                        );
                        expect(testQueryRunner.manager.delete).toHaveBeenCalledWith(
                            CredentialVisibilityArea,
                            { credentialId: testCredentialId },
                        );
                        expect(testQueryRunner.manager.delete).toHaveBeenCalledWith(
                            CredentialVisibilityPosition,
                            { credentialId: testCredentialId },
                        );
                        expect(testQueryRunner.manager.delete).toHaveBeenCalledWith(
                            CredentialVisibilityEmployee,
                            { credentialId: testCredentialId },
                        );

                        // Verify credential was deleted
                        expect(credentialDeleted).toBe(true);
                        expect(testQueryRunner.manager.remove).toHaveBeenCalledWith(testCredential);

                        // Verify all visibility types were deleted (4 types)
                        expect(deletedVisibilityTypes.length).toBe(4);
                        expect(deletedVisibilityTypes).toContain('company');
                        expect(deletedVisibilityTypes).toContain('area');
                        expect(deletedVisibilityTypes).toContain('position');
                        expect(deletedVisibilityTypes).toContain('employee');

                        // Verify transaction was used
                        expect(testQueryRunner.connect).toHaveBeenCalled();
                        expect(testQueryRunner.startTransaction).toHaveBeenCalled();
                        expect(testQueryRunner.commitTransaction).toHaveBeenCalled();
                        expect(testQueryRunner.release).toHaveBeenCalled();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('findAccessLogs', () => {
        const employeeId = '123e4567-e89b-12d3-a456-426614174000';
        const credentialId1 = 'cred-1';
        const credentialId2 = 'cred-2';
        const accessorId1 = 'accessor-1';
        const accessorId2 = 'accessor-2';

        const mockAccessLogs: Partial<CredentialAccessLog>[] = [
            {
                id: 'log-1',
                credentialId: credentialId1,
                employeeId: accessorId1,
                accessedAt: new Date('2024-01-03T10:00:00Z'),
                employee: {
                    id: accessorId1,
                    firstName: 'John',
                    lastName: 'Doe',
                } as Employee,
                credential: {
                    id: credentialId1,
                    ownerId: employeeId,
                } as Credential,
            },
            {
                id: 'log-2',
                credentialId: credentialId2,
                employeeId: accessorId2,
                accessedAt: new Date('2024-01-02T10:00:00Z'),
                employee: {
                    id: accessorId2,
                    firstName: 'Jane',
                    lastName: 'Smith',
                } as Employee,
                credential: {
                    id: credentialId2,
                    ownerId: employeeId,
                } as Credential,
            },
            {
                id: 'log-3',
                credentialId: credentialId1,
                employeeId: accessorId1,
                accessedAt: new Date('2024-01-01T10:00:00Z'),
                employee: {
                    id: accessorId1,
                    firstName: 'John',
                    lastName: 'Doe',
                } as Employee,
                credential: {
                    id: credentialId1,
                    ownerId: employeeId,
                } as Credential,
            },
        ];

        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getCount: jest.fn(),
                getMany: jest.fn(),
            };

            mockCredentialAccessLogRepository.createQueryBuilder =
                jest.fn().mockReturnValue(mockQueryBuilder);
        });

        it('should return access logs for owner credentials with default pagination', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs);

            const result = await service.findAccessLogs(employeeId);

            expect(mockCredentialAccessLogRepository.createQueryBuilder).toHaveBeenCalledWith(
                'log',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('log.employee', 'employee');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'log.credential',
                'credential',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('credential.ownerId = :employeeId', {
                employeeId,
            });
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('log.accessedAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result).toEqual({
                data: mockAccessLogs,
                total: 3,
                page: 1,
                limit: 10,
            });
        });

        it('should filter logs by owner credentials', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs);

            await service.findAccessLogs(employeeId);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('credential.ownerId = :employeeId', {
                employeeId,
            });
        });

        it('should include employee information who accessed', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs);

            const result = await service.findAccessLogs(employeeId);

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('log.employee', 'employee');
            expect(result.data[0].employee).toBeDefined();
            expect(result.data[0].employee?.firstName).toBe('John');
        });

        it('should order by accessedAt descending', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs);

            await service.findAccessLogs(employeeId);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('log.accessedAt', 'DESC');
        });

        it('should support custom pagination - page 2', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(25);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs.slice(0, 2));

            const result = await service.findAccessLogs(employeeId, 2, 10);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(10);
        });

        it('should support custom limit', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs.slice(0, 2));

            const result = await service.findAccessLogs(employeeId, 1, 2);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(2);
            expect(result.limit).toBe(2);
        });

        it('should calculate skip correctly for page 3 with limit 5', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(20);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.findAccessLogs(employeeId, 3, 5);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
        });

        it('should return empty array when no logs exist', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.findAccessLogs(employeeId);

            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
        });

        it('should return total count of all logs', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(25);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs);

            const result = await service.findAccessLogs(employeeId, 1, 10);

            expect(result.total).toBe(25);
        });

        it('should include credential information in logs', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs);

            const result = await service.findAccessLogs(employeeId);

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'log.credential',
                'credential',
            );
            expect(result.data[0].credential).toBeDefined();
            expect(result.data[0].credential?.ownerId).toBe(employeeId);
        });

        it('should handle page 1 with default limit', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(3);
            mockQueryBuilder.getMany.mockResolvedValue(mockAccessLogs);

            const result = await service.findAccessLogs(employeeId, 1);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should only return logs for credentials owned by the employee', async () => {
            const ownerLogs = mockAccessLogs.filter(
                (log) => log.credential?.ownerId === employeeId,
            );
            mockQueryBuilder.getCount.mockResolvedValue(ownerLogs.length);
            mockQueryBuilder.getMany.mockResolvedValue(ownerLogs);

            const result = await service.findAccessLogs(employeeId);

            expect(result.data.every((log) => log.credential?.ownerId === employeeId)).toBe(true);
        });
    });
});
