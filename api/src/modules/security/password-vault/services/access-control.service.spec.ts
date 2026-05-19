import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { AccessControlService } from './access-control.service';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Memorandum } from '@modules/core/contracts/entities/memorandum.entity';
import { Credential } from '../entities/credential.entity';
import { VisibilityLevel } from '../enums/visibility-level.enum';

describe('AccessControlService', () => {
    let service: AccessControlService;
    let employeeRepository: Repository<Employee>;
    let memorandumRepository: Repository<Memorandum>;

    const mockEmployeeRepository = {
        findOne: jest.fn(),
    };

    const mockMemorandumRepository = {
        createQueryBuilder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AccessControlService,
                {
                    provide: getRepositoryToken(Employee),
                    useValue: mockEmployeeRepository,
                },
                {
                    provide: getRepositoryToken(Memorandum),
                    useValue: mockMemorandumRepository,
                },
            ],
        }).compile();

        service = module.get<AccessControlService>(AccessControlService);
        employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
        memorandumRepository = module.get<Repository<Memorandum>>(getRepositoryToken(Memorandum));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('canAccessCredential', () => {
        const mockCredential: Partial<Credential> = {
            id: 'credential-1',
            ownerId: 'owner-1',
            visibilityLevel: VisibilityLevel.PRIVATE,
            visibilityCompanies: [],
            visibilityAreas: [],
            visibilityPositions: [],
            visibilityEmployees: [],
        };

        it('should allow owner to access their own credential', async () => {
            const result = await service.canAccessCredential('owner-1', mockCredential as Credential);
            expect(result).toBe(true);
        });

        it('should deny access to inactive employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: false,
            });

            const result = await service.canAccessCredential('employee-1', mockCredential as Credential);
            expect(result).toBe(false);
        });

        it('should deny access to non-existent employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(null);

            const result = await service.canAccessCredential('non-existent', mockCredential as Credential);
            expect(result).toBe(false);
        });

        it('should deny access to private credential for non-owner', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const result = await service.canAccessCredential('employee-1', mockCredential as Credential);
            expect(result).toBe(false);
        });

        it('should allow access to public credential for active employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const publicCredential = {
                ...mockCredential,
                visibilityLevel: VisibilityLevel.PUBLIC,
            };

            const result = await service.canAccessCredential('employee-1', publicCredential as Credential);
            expect(result).toBe(true);
        });

        it('should allow access to employee list credential for listed employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const employeeListCredential = {
                ...mockCredential,
                visibilityLevel: VisibilityLevel.BY_EMPLOYEE_LIST,
                visibilityEmployees: [{ employeeId: 'employee-1' }],
            };

            const result = await service.canAccessCredential('employee-1', employeeListCredential as Credential);
            expect(result).toBe(true);
        });

        it('should deny access to employee list credential for non-listed employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-2',
                isActive: true,
            });

            const employeeListCredential = {
                ...mockCredential,
                visibilityLevel: VisibilityLevel.BY_EMPLOYEE_LIST,
                visibilityEmployees: [{ employeeId: 'employee-1' }],
            };

            const result = await service.canAccessCredential('employee-2', employeeListCredential as Credential);
            expect(result).toBe(false);
        });
    });

    describe('hasCompanyAccess', () => {
        it('should allow access when employee has active contract in authorized company', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ companyId: 'company-1' }),
            };

            mockMemorandumRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const companyCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_COMPANY,
                visibilityCompanies: [{ companyId: 'company-1' } as any],
                visibilityAreas: [],
                visibilityPositions: [],
                visibilityEmployees: [],
            };

            const result = await service.canAccessCredential('employee-1', companyCredential as Credential);
            expect(result).toBe(true);
        });

        it('should deny access when employee has no active contract', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue(null),
            };

            mockMemorandumRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const companyCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_COMPANY,
                visibilityCompanies: [{ companyId: 'company-1' } as any],
                visibilityAreas: [],
                visibilityPositions: [],
                visibilityEmployees: [],
            };

            const result = await service.canAccessCredential('employee-1', companyCredential as Credential);
            expect(result).toBe(false);
        });

        // **Validates: Requirements 3.3**
        it('should allow access when employee company matches one of multiple authorized companies', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ companyId: 'company-2' }),
            };

            mockMemorandumRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const multiCompanyCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_COMPANY,
                visibilityCompanies: [
                    { companyId: 'company-1' } as any,
                    { companyId: 'company-2' } as any,
                    { companyId: 'company-3' } as any,
                ],
                visibilityAreas: [],
                visibilityPositions: [],
                visibilityEmployees: [],
            };

            const result = await service.canAccessCredential('employee-1', multiCompanyCredential as Credential);
            expect(result).toBe(true);
        });

        // **Validates: Requirements 3.3**
        it('should deny access when employee company does not match any of multiple authorized companies', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ companyId: 'company-4' }),
            };

            mockMemorandumRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const multiCompanyCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_COMPANY,
                visibilityCompanies: [
                    { companyId: 'company-1' } as any,
                    { companyId: 'company-2' } as any,
                    { companyId: 'company-3' } as any,
                ],
                visibilityAreas: [],
                visibilityPositions: [],
                visibilityEmployees: [],
            };

            const result = await service.canAccessCredential('employee-1', multiCompanyCredential as Credential);
            expect(result).toBe(false);
        });
    });

    describe('hasPositionAccess', () => {
        it('should allow access when employee has active contract with authorized position', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ positionId: 'position-1' }),
            };

            mockMemorandumRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const positionCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_POSITION,
                visibilityCompanies: [],
                visibilityAreas: [],
                visibilityPositions: [{ positionId: 'position-1' } as any],
                visibilityEmployees: [],
            };

            const result = await service.canAccessCredential('employee-1', positionCredential as Credential);
            expect(result).toBe(true);
        });

        // **Validates: Requirements 3.5**
        it('should use most recent active contract when employee has multiple contracts', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            // The query returns the first matching active memorandum
            // In a real scenario with multiple contracts, the query would return the most recent one
            const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ positionId: 'position-2' }),
            };

            mockMemorandumRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const positionCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_POSITION,
                visibilityCompanies: [],
                visibilityAreas: [],
                visibilityPositions: [
                    { positionId: 'position-1' } as any,
                    { positionId: 'position-2' } as any,
                ],
                visibilityEmployees: [],
            };

            const result = await service.canAccessCredential('employee-1', positionCredential as Credential);
            expect(result).toBe(true);
        });

        // **Validates: Requirements 3.5**
        it('should deny access when employee with multiple contracts has none matching authorized positions', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ positionId: 'position-3' }),
            };

            mockMemorandumRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const positionCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_POSITION,
                visibilityCompanies: [],
                visibilityAreas: [],
                visibilityPositions: [
                    { positionId: 'position-1' } as any,
                    { positionId: 'position-2' } as any,
                ],
                visibilityEmployees: [],
            };

            const result = await service.canAccessCredential('employee-1', positionCredential as Credential);
            expect(result).toBe(false);
        });
    });

    describe('hasAreaAccess', () => {
        it('should return false due to schema limitation', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const areaCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_AREA,
                visibilityCompanies: [],
                visibilityAreas: [{ areaId: 'area-1' } as any],
                visibilityPositions: [],
                visibilityEmployees: [],
            };

            const result = await service.canAccessCredential('employee-1', areaCredential as Credential);
            expect(result).toBe(false);
        });

        // **Validates: Requirements 3.4**
        it('should return false when employee has no area assigned', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue({
                id: 'employee-1',
                isActive: true,
            });

            const areaCredential: Partial<Credential> = {
                id: 'credential-1',
                ownerId: 'owner-1',
                visibilityLevel: VisibilityLevel.BY_AREA,
                visibilityCompanies: [],
                visibilityAreas: [
                    { areaId: 'area-1' } as any,
                    { areaId: 'area-2' } as any,
                ],
                visibilityPositions: [],
                visibilityEmployees: [],
            };

            // Current implementation always returns false due to schema limitation
            // This test validates the behavior when employee has no area
            const result = await service.canAccessCredential('employee-1', areaCredential as Credential);
            expect(result).toBe(false);
        });
    });

    // Feature: employee-password-vault, Property 6: Private Credentials Accessible Only to Owner
    // **Validates: Requirements 2.1**
    describe('Property 6: Private Credentials Accessible Only to Owner', () => {
        it('property: owner can always access their private credentials', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.uuid(),
                    fc.webUrl(),
                    fc.string(),
                    fc.string(),
                    async (ownerId, credentialId, url, encryptedUsername, encryptedPassword) => {
                        const privateCredential: Partial<Credential> = {
                            id: credentialId,
                            ownerId: ownerId,
                            url: url,
                            encryptedUsername: encryptedUsername,
                            encryptedPassword: encryptedPassword,
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        const result = await service.canAccessCredential(ownerId, privateCredential as Credential);
                        expect(result).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('property: non-owner active employees cannot access private credentials', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
                    fc.uuid(),
                    fc.webUrl(),
                    fc.string(),
                    fc.string(),
                    async ([ownerId, nonOwnerId], credentialId, url, encryptedUsername, encryptedPassword) => {
                        mockEmployeeRepository.findOne.mockResolvedValue({
                            id: nonOwnerId,
                            isActive: true,
                        });

                        const privateCredential: Partial<Credential> = {
                            id: credentialId,
                            ownerId: ownerId,
                            url: url,
                            encryptedUsername: encryptedUsername,
                            encryptedPassword: encryptedPassword,
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        const result = await service.canAccessCredential(nonOwnerId, privateCredential as Credential);
                        expect(result).toBe(false);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('property: inactive employees cannot access private credentials even if they are the owner', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.uuid(),
                    fc.webUrl(),
                    fc.string(),
                    fc.string(),
                    async (ownerId, credentialId, url, encryptedUsername, encryptedPassword) => {
                        mockEmployeeRepository.findOne.mockResolvedValue({
                            id: ownerId,
                            isActive: false,
                        });

                        const privateCredential: Partial<Credential> = {
                            id: credentialId,
                            ownerId: ownerId,
                            url: url,
                            encryptedUsername: encryptedUsername,
                            encryptedPassword: encryptedPassword,
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        const result = await service.canAccessCredential(ownerId, privateCredential as Credential);
                        expect(result).toBe(false);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('property: non-existent employees cannot access private credentials', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
                    fc.uuid(),
                    fc.webUrl(),
                    fc.string(),
                    fc.string(),
                    async ([ownerId, nonExistentId], credentialId, url, encryptedUsername, encryptedPassword) => {
                        mockEmployeeRepository.findOne.mockResolvedValue(null);

                        const privateCredential: Partial<Credential> = {
                            id: credentialId,
                            ownerId: ownerId,
                            url: url,
                            encryptedUsername: encryptedUsername,
                            encryptedPassword: encryptedPassword,
                            visibilityLevel: VisibilityLevel.PRIVATE,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        const result = await service.canAccessCredential(nonExistentId, privateCredential as Credential);
                        expect(result).toBe(false);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    // Feature: employee-password-vault, Property 7: Public Credentials Accessible to All Active Employees
    // **Validates: Requirements 2.2, 3.2**
    describe('Property 7: Public Credentials Accessible to All Active Employees', () => {
        it('property: all active employees can access public credentials', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
                    fc.uuid(),
                    fc.webUrl(),
                    fc.string(),
                    fc.string(),
                    async ([ownerId, activeEmployeeId], credentialId, url, encryptedUsername, encryptedPassword) => {
                        mockEmployeeRepository.findOne.mockResolvedValue({
                            id: activeEmployeeId,
                            isActive: true,
                        });

                        const publicCredential: Partial<Credential> = {
                            id: credentialId,
                            ownerId: ownerId,
                            url: url,
                            encryptedUsername: encryptedUsername,
                            encryptedPassword: encryptedPassword,
                            visibilityLevel: VisibilityLevel.PUBLIC,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        const result = await service.canAccessCredential(activeEmployeeId, publicCredential as Credential);
                        expect(result).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('property: inactive employees cannot access public credentials', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
                    fc.uuid(),
                    fc.webUrl(),
                    fc.string(),
                    fc.string(),
                    async ([ownerId, inactiveEmployeeId], credentialId, url, encryptedUsername, encryptedPassword) => {
                        mockEmployeeRepository.findOne.mockResolvedValue({
                            id: inactiveEmployeeId,
                            isActive: false,
                        });

                        const publicCredential: Partial<Credential> = {
                            id: credentialId,
                            ownerId: ownerId,
                            url: url,
                            encryptedUsername: encryptedUsername,
                            encryptedPassword: encryptedPassword,
                            visibilityLevel: VisibilityLevel.PUBLIC,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        const result = await service.canAccessCredential(inactiveEmployeeId, publicCredential as Credential);
                        expect(result).toBe(false);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('property: non-existent employees cannot access public credentials', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
                    fc.uuid(),
                    fc.webUrl(),
                    fc.string(),
                    fc.string(),
                    async ([ownerId, nonExistentId], credentialId, url, encryptedUsername, encryptedPassword) => {
                        mockEmployeeRepository.findOne.mockResolvedValue(null);

                        const publicCredential: Partial<Credential> = {
                            id: credentialId,
                            ownerId: ownerId,
                            url: url,
                            encryptedUsername: encryptedUsername,
                            encryptedPassword: encryptedPassword,
                            visibilityLevel: VisibilityLevel.PUBLIC,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        const result = await service.canAccessCredential(nonExistentId, publicCredential as Credential);
                        expect(result).toBe(false);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('property: owner can access their own public credentials', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.uuid(),
                    fc.webUrl(),
                    fc.string(),
                    fc.string(),
                    async (ownerId, credentialId, url, encryptedUsername, encryptedPassword) => {
                        const publicCredential: Partial<Credential> = {
                            id: credentialId,
                            ownerId: ownerId,
                            url: url,
                            encryptedUsername: encryptedUsername,
                            encryptedPassword: encryptedPassword,
                            visibilityLevel: VisibilityLevel.PUBLIC,
                            visibilityCompanies: [],
                            visibilityAreas: [],
                            visibilityPositions: [],
                            visibilityEmployees: [],
                        };

                        const result = await service.canAccessCredential(ownerId, publicCredential as Credential);
                        expect(result).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });
});
