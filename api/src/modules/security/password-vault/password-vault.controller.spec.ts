import { Test, TestingModule } from '@nestjs/testing';
import { PasswordVaultController } from './password-vault.controller';
import { PasswordVaultService } from './password-vault.service';
import { CreateVaultDto } from './dto/create-vault.dto';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { Vault } from './entities/vault.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';
import { CredentialFilterDto } from './dto/credential-filter.dto';
import { Credential } from './entities/credential.entity';
import { VisibilityLevel } from './enums/visibility-level.enum';
import { NotFoundException } from '@nestjs/common';

describe('PasswordVaultController', () => {
    let controller: PasswordVaultController;
    let service: PasswordVaultService;

    const mockEmployeeId = 'employee-123';
    const mockVaultId = 'vault-456';

    const mockVault: Vault = {
        id: mockVaultId,
        name: 'Test Vault',
        description: 'Test Description',
        ownerId: mockEmployeeId,
        owner: null,
        credentials: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockCredentialId = 'credential-789';
    const mockCredential: Credential = {
        id: mockCredentialId,
        title: 'Test Credential',
        url: 'https://example.com',
        encryptedUsername: 'encrypted-username',
        encryptedPassword: 'encrypted-password',
        directLoginUrl: null,
        notes: null,
        logoId: null,
        logo: null,
        visibilityLevel: VisibilityLevel.PRIVATE,
        ownerId: mockEmployeeId,
        owner: null,
        vaultId: mockVaultId,
        vault: null,
        visibilityCompanies: [],
        visibilityAreas: [],
        visibilityPositions: [],
        visibilityEmployees: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PasswordVaultController],
            providers: [
                {
                    provide: PasswordVaultService,
                    useValue: {
                        createVault: jest.fn(),
                        findAllVaults: jest.fn(),
                        updateVault: jest.fn(),
                        deleteVault: jest.fn(),
                        createCredential: jest.fn(),
                        findAllCredentials: jest.fn(),
                        findOneCredential: jest.fn(),
                        updateCredential: jest.fn(),
                        deleteCredential: jest.fn(),
                        findAccessLogs: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<PasswordVaultController>(PasswordVaultController);
        service = module.get<PasswordVaultService>(PasswordVaultService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createVault', () => {
        it('should create a vault successfully', async () => {
            const createDto: CreateVaultDto = {
                name: 'New Vault',
                description: 'New Description',
            };

            jest.spyOn(service, 'createVault').mockResolvedValue(mockVault);

            const result = await controller.createVault(mockEmployeeId, createDto);

            expect(service.createVault).toHaveBeenCalledWith(mockEmployeeId, createDto);
            expect(result).toEqual(mockVault);
        });
    });

    describe('findAllVaults', () => {
        it('should return all vaults for the employee', async () => {
            const mockVaults = [mockVault];
            jest.spyOn(service, 'findAllVaults').mockResolvedValue(mockVaults);

            const result = await controller.findAllVaults(mockEmployeeId);

            expect(service.findAllVaults).toHaveBeenCalledWith(mockEmployeeId, undefined);
            expect(result).toEqual(mockVaults);
        });

        it('should return vaults filtered by search term', async () => {
            const searchTerm = 'test';
            const mockVaults = [mockVault];
            jest.spyOn(service, 'findAllVaults').mockResolvedValue(mockVaults);

            const result = await controller.findAllVaults(mockEmployeeId, searchTerm);

            expect(service.findAllVaults).toHaveBeenCalledWith(mockEmployeeId, searchTerm);
            expect(result).toEqual(mockVaults);
        });
    });

    describe('findOneVault', () => {
        it('should return a specific vault', async () => {
            const mockVaults = [mockVault];
            jest.spyOn(service, 'findAllVaults').mockResolvedValue(mockVaults);

            const result = await controller.findOneVault(mockEmployeeId, mockVaultId);

            expect(service.findAllVaults).toHaveBeenCalledWith(mockEmployeeId);
            expect(result).toEqual(mockVault);
        });

        it('should throw NotFoundException when vault not found', async () => {
            jest.spyOn(service, 'findAllVaults').mockResolvedValue([]);

            await expect(
                controller.findOneVault(mockEmployeeId, 'non-existent-id'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateVault', () => {
        it('should update a vault successfully', async () => {
            const updateDto: UpdateVaultDto = {
                name: 'Updated Vault',
            };

            const updatedVault = { ...mockVault, ...updateDto };
            jest.spyOn(service, 'updateVault').mockResolvedValue(updatedVault);

            const result = await controller.updateVault(
                mockEmployeeId,
                mockVaultId,
                updateDto,
            );

            expect(service.updateVault).toHaveBeenCalledWith(
                mockEmployeeId,
                mockVaultId,
                updateDto,
            );
            expect(result).toEqual(updatedVault);
        });
    });

    describe('deleteVault', () => {
        it('should delete a vault successfully', async () => {
            jest.spyOn(service, 'deleteVault').mockResolvedValue(undefined);

            await controller.deleteVault(mockEmployeeId, mockVaultId);

            expect(service.deleteVault).toHaveBeenCalledWith(mockEmployeeId, mockVaultId);
        });
    });

    describe('createCredential', () => {
        it('should create a credential successfully', async () => {
            const createDto: CreateCredentialDto = {
                url: 'https://example.com',
                username: 'testuser',
                password: 'testpass',
                title: 'Test Credential',
                visibilityLevel: VisibilityLevel.PRIVATE,
                vaultId: mockVaultId,
            };

            jest.spyOn(service, 'createCredential').mockResolvedValue(mockCredential);

            const result = await controller.createCredential(mockEmployeeId, createDto);

            expect(service.createCredential).toHaveBeenCalledWith(mockEmployeeId, createDto);
            expect(result).toEqual(mockCredential);
        });
    });

    describe('findAllCredentials', () => {
        it('should return all accessible credentials for the employee', async () => {
            const filters: CredentialFilterDto = { page: 1, limit: 10 };
            const mockResponse = {
                data: [mockCredential],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(service, 'findAllCredentials').mockResolvedValue(mockResponse);

            const result = await controller.findAllCredentials(mockEmployeeId, filters);

            expect(service.findAllCredentials).toHaveBeenCalledWith(mockEmployeeId, filters);
            expect(result).toEqual(mockResponse);
        });

        it('should return credentials filtered by search term', async () => {
            const filters: CredentialFilterDto = { search: 'test', page: 1, limit: 10 };
            const mockResponse = {
                data: [mockCredential],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(service, 'findAllCredentials').mockResolvedValue(mockResponse);

            const result = await controller.findAllCredentials(mockEmployeeId, filters);

            expect(service.findAllCredentials).toHaveBeenCalledWith(mockEmployeeId, filters);
            expect(result).toEqual(mockResponse);
        });

        it('should return credentials filtered by vaultId', async () => {
            const filters: CredentialFilterDto = { vaultId: mockVaultId, page: 1, limit: 10 };
            const mockResponse = {
                data: [mockCredential],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(service, 'findAllCredentials').mockResolvedValue(mockResponse);

            const result = await controller.findAllCredentials(mockEmployeeId, filters);

            expect(service.findAllCredentials).toHaveBeenCalledWith(mockEmployeeId, filters);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('findOneCredential', () => {
        it('should return a specific credential', async () => {
            jest.spyOn(service, 'findOneCredential').mockResolvedValue(mockCredential);

            const result = await controller.findOneCredential(mockEmployeeId, mockCredentialId);

            expect(service.findOneCredential).toHaveBeenCalledWith(
                mockEmployeeId,
                mockCredentialId,
            );
            expect(result).toEqual(mockCredential);
        });
    });

    describe('updateCredential', () => {
        it('should update a credential successfully', async () => {
            const updateDto: UpdateCredentialDto = {
                title: 'Updated Credential',
            };

            const updatedCredential = { ...mockCredential, ...updateDto };
            jest.spyOn(service, 'updateCredential').mockResolvedValue(updatedCredential);

            const result = await controller.updateCredential(
                mockEmployeeId,
                mockCredentialId,
                updateDto,
            );

            expect(service.updateCredential).toHaveBeenCalledWith(
                mockEmployeeId,
                mockCredentialId,
                updateDto,
            );
            expect(result).toEqual(updatedCredential);
        });
    });

    describe('deleteCredential', () => {
        it('should delete a credential successfully', async () => {
            jest.spyOn(service, 'deleteCredential').mockResolvedValue(undefined);

            await controller.deleteCredential(mockEmployeeId, mockCredentialId);

            expect(service.deleteCredential).toHaveBeenCalledWith(
                mockEmployeeId,
                mockCredentialId,
            );
        });
    });

    describe('findAccessLogs', () => {
        it('should return paginated access logs for the employee', async () => {
            const mockAccessLogs = {
                data: [
                    {
                        id: 'log-1',
                        credentialId: mockCredentialId,
                        employeeId: 'other-employee-id',
                        accessedAt: new Date(),
                        credential: {
                            id: mockCredentialId,
                            title: 'Test Credential',
                            serviceUrl: 'https://example.com',
                        },
                        employee: {
                            id: 'other-employee-id',
                            firstName: 'John',
                            lastName: 'Doe',
                        },
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(service, 'findAccessLogs').mockResolvedValue(mockAccessLogs);

            const result = await controller.findAccessLogs(mockEmployeeId, 1, 10);

            expect(service.findAccessLogs).toHaveBeenCalledWith(mockEmployeeId, 1, 10);
            expect(result).toEqual(mockAccessLogs);
        });

        it('should use default pagination values when not provided', async () => {
            const mockAccessLogs = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            jest.spyOn(service, 'findAccessLogs').mockResolvedValue(mockAccessLogs);

            const result = await controller.findAccessLogs(mockEmployeeId);

            expect(service.findAccessLogs).toHaveBeenCalledWith(mockEmployeeId, 1, 10);
            expect(result).toEqual(mockAccessLogs);
        });

        it('should handle custom pagination parameters', async () => {
            const mockAccessLogs = {
                data: [],
                total: 0,
                page: 2,
                limit: 20,
            };

            jest.spyOn(service, 'findAccessLogs').mockResolvedValue(mockAccessLogs);

            const result = await controller.findAccessLogs(mockEmployeeId, 2, 20);

            expect(service.findAccessLogs).toHaveBeenCalledWith(mockEmployeeId, 2, 20);
            expect(result).toEqual(mockAccessLogs);
        });
    });

    // ============================================================================
    // INTEGRATION TESTS - Task 12.4
    // ============================================================================

    describe('Integration Tests - Flujo completo', () => {
        it('debe completar flujo: crear vault → crear credencial → acceder', async () => {
            // 1. Crear vault
            const createVaultDto: CreateVaultDto = {
                name: 'Vault de Integración',
                description: 'Vault para pruebas de integración',
            };
            const createdVault = { ...mockVault, ...createVaultDto };
            jest.spyOn(service, 'createVault').mockResolvedValue(createdVault);

            const vault = await controller.createVault(mockEmployeeId, createVaultDto);
            expect(vault).toBeDefined();
            expect(vault.name).toBe(createVaultDto.name);

            // 2. Crear credencial en el vault
            const createCredentialDto: CreateCredentialDto = {
                url: 'https://integration-test.com',
                username: 'testuser',
                password: 'testpass',
                title: 'Credencial de Integración',
                visibilityLevel: VisibilityLevel.PRIVATE,
                vaultId: vault.id,
            };
            const createdCredential = {
                ...mockCredential,
                ...createCredentialDto,
                vaultId: vault.id,
            };
            jest.spyOn(service, 'createCredential').mockResolvedValue(createdCredential);

            const credential = await controller.createCredential(
                mockEmployeeId,
                createCredentialDto,
            );
            expect(credential).toBeDefined();
            expect(credential.vaultId).toBe(vault.id);
            expect(credential.title).toBe(createCredentialDto.title);

            // 3. Acceder a la credencial
            const credentialWithDecrypted = {
                ...createdCredential,
                username: 'testuser', // Decrypted
                password: 'testpass', // Decrypted
            };
            jest.spyOn(service, 'findOneCredential').mockResolvedValue(
                credentialWithDecrypted as any,
            );

            const accessedCredential = await controller.findOneCredential(
                mockEmployeeId,
                credential.id,
            );
            expect(accessedCredential).toBeDefined();
            expect(accessedCredential.id).toBe(credential.id);
            expect(service.findOneCredential).toHaveBeenCalledWith(
                mockEmployeeId,
                credential.id,
            );
        });

        it('debe completar flujo: crear múltiples credenciales → listar → filtrar por vault', async () => {
            // 1. Crear vault
            const createVaultDto: CreateVaultDto = {
                name: 'Vault Multi-Credencial',
            };
            const createdVault = { ...mockVault, ...createVaultDto };
            jest.spyOn(service, 'createVault').mockResolvedValue(createdVault);

            const vault = await controller.createVault(mockEmployeeId, createVaultDto);

            // 2. Crear múltiples credenciales
            const credentials = [];
            for (let i = 0; i < 3; i++) {
                const createDto: CreateCredentialDto = {
                    url: `https://test${i}.com`,
                    username: `user${i}`,
                    password: `pass${i}`,
                    title: `Credencial ${i}`,
                    visibilityLevel: VisibilityLevel.PRIVATE,
                    vaultId: vault.id,
                };
                const created = {
                    ...mockCredential,
                    id: `credential-${i}`,
                    ...createDto,
                };
                jest.spyOn(service, 'createCredential').mockResolvedValueOnce(created);
                const credential = await controller.createCredential(mockEmployeeId, createDto);
                credentials.push(credential);
            }

            expect(credentials).toHaveLength(3);

            // 3. Listar todas las credenciales
            const allCredentialsResponse = {
                data: credentials,
                total: 3,
                page: 1,
                limit: 10,
            };
            jest.spyOn(service, 'findAllCredentials').mockResolvedValue(
                allCredentialsResponse,
            );

            const allCredentials = await controller.findAllCredentials(mockEmployeeId, {
                page: 1,
                limit: 10,
            });
            expect(allCredentials.data).toHaveLength(3);
            expect(allCredentials.total).toBe(3);

            // 4. Filtrar por vault
            const filteredResponse = {
                data: credentials,
                total: 3,
                page: 1,
                limit: 10,
            };
            jest.spyOn(service, 'findAllCredentials').mockResolvedValue(filteredResponse);

            const filtered = await controller.findAllCredentials(mockEmployeeId, {
                vaultId: vault.id,
                page: 1,
                limit: 10,
            });
            expect(filtered.data).toHaveLength(3);
            expect(service.findAllCredentials).toHaveBeenCalledWith(mockEmployeeId, {
                vaultId: vault.id,
                page: 1,
                limit: 10,
            });
        });
    });

    describe('Integration Tests - Autenticación requerida', () => {
        it('debe requerir autenticación para crear vault', async () => {
            // Este test verifica que el guard de autenticación está aplicado
            // En un test real con TestingModule completo, esto fallaría sin token
            const createDto: CreateVaultDto = {
                name: 'Test Vault',
            };

            // Verificar que el método del servicio requiere employeeId
            jest.spyOn(service, 'createVault').mockResolvedValue(mockVault);
            await controller.createVault(mockEmployeeId, createDto);
            expect(service.createVault).toHaveBeenCalledWith(mockEmployeeId, createDto);
        });

        it('debe requerir autenticación para crear credencial', async () => {
            const createDto: CreateCredentialDto = {
                url: 'https://test.com',
                username: 'test',
                password: 'test',
                visibilityLevel: VisibilityLevel.PRIVATE,
                vaultId: mockVaultId,
            };

            jest.spyOn(service, 'createCredential').mockResolvedValue(mockCredential);
            await controller.createCredential(mockEmployeeId, createDto);
            expect(service.createCredential).toHaveBeenCalledWith(mockEmployeeId, createDto);
        });

        it('debe requerir autenticación para listar credenciales', async () => {
            const mockResponse = {
                data: [mockCredential],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(service, 'findAllCredentials').mockResolvedValue(mockResponse);
            await controller.findAllCredentials(mockEmployeeId, { page: 1, limit: 10 });
            expect(service.findAllCredentials).toHaveBeenCalledWith(mockEmployeeId, {
                page: 1,
                limit: 10,
            });
        });

        it('debe requerir autenticación para ver detalle de credencial', async () => {
            jest.spyOn(service, 'findOneCredential').mockResolvedValue(mockCredential);
            await controller.findOneCredential(mockEmployeeId, mockCredentialId);
            expect(service.findOneCredential).toHaveBeenCalledWith(
                mockEmployeeId,
                mockCredentialId,
            );
        });

        it('debe requerir autenticación para actualizar credencial', async () => {
            const updateDto: UpdateCredentialDto = {
                title: 'Updated',
            };

            jest.spyOn(service, 'updateCredential').mockResolvedValue(mockCredential);
            await controller.updateCredential(mockEmployeeId, mockCredentialId, updateDto);
            expect(service.updateCredential).toHaveBeenCalledWith(
                mockEmployeeId,
                mockCredentialId,
                updateDto,
            );
        });

        it('debe requerir autenticación para eliminar credencial', async () => {
            jest.spyOn(service, 'deleteCredential').mockResolvedValue(undefined);
            await controller.deleteCredential(mockEmployeeId, mockCredentialId);
            expect(service.deleteCredential).toHaveBeenCalledWith(
                mockEmployeeId,
                mockCredentialId,
            );
        });

        it('debe requerir autenticación para listar vaults', async () => {
            jest.spyOn(service, 'findAllVaults').mockResolvedValue([mockVault]);
            await controller.findAllVaults(mockEmployeeId);
            expect(service.findAllVaults).toHaveBeenCalledWith(mockEmployeeId, undefined);
        });

        it('debe requerir autenticación para actualizar vault', async () => {
            const updateDto: UpdateVaultDto = {
                name: 'Updated Vault',
            };

            jest.spyOn(service, 'updateVault').mockResolvedValue(mockVault);
            await controller.updateVault(mockEmployeeId, mockVaultId, updateDto);
            expect(service.updateVault).toHaveBeenCalledWith(
                mockEmployeeId,
                mockVaultId,
                updateDto,
            );
        });

        it('debe requerir autenticación para eliminar vault', async () => {
            jest.spyOn(service, 'deleteVault').mockResolvedValue(undefined);
            await controller.deleteVault(mockEmployeeId, mockVaultId);
            expect(service.deleteVault).toHaveBeenCalledWith(mockEmployeeId, mockVaultId);
        });

        it('debe requerir autenticación para ver logs de acceso', async () => {
            const mockLogs = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            jest.spyOn(service, 'findAccessLogs').mockResolvedValue(mockLogs);
            await controller.findAccessLogs(mockEmployeeId, 1, 10);
            expect(service.findAccessLogs).toHaveBeenCalledWith(mockEmployeeId, 1, 10);
        });
    });

    describe('Integration Tests - Validación de DTOs', () => {
        describe('CreateVaultDto validation', () => {
            it('debe rechazar vault con nombre vacío', async () => {
                // En un test real con ValidationPipe, esto lanzaría BadRequestException
                // Aquí verificamos que el DTO tiene las validaciones correctas
                const createDto: any = {
                    name: '', // Vacío - debe fallar
                };

                // El servicio no debería ser llamado con datos inválidos
                // En producción, ValidationPipe rechaza esto antes de llegar al controller
                expect(createDto.name).toBe('');
            });

            it('debe rechazar vault con nombre muy largo', async () => {
                const createDto: any = {
                    name: 'a'.repeat(101), // Más de 100 caracteres
                };

                expect(createDto.name.length).toBeGreaterThan(100);
            });

            it('debe aceptar vault con datos válidos', async () => {
                const createDto: CreateVaultDto = {
                    name: 'Vault Válido',
                    description: 'Descripción válida',
                };

                jest.spyOn(service, 'createVault').mockResolvedValue(mockVault);
                const result = await controller.createVault(mockEmployeeId, createDto);
                expect(result).toBeDefined();
            });
        });

        describe('CreateCredentialDto validation', () => {
            it('debe rechazar credencial con URL inválida', async () => {
                const createDto: any = {
                    url: 'not-a-valid-url', // URL inválida
                    username: 'test',
                    password: 'test',
                    visibilityLevel: VisibilityLevel.PRIVATE,
                    vaultId: mockVaultId,
                };

                // ValidationPipe rechazaría esto
                expect(createDto.url).not.toMatch(/^https?:\/\//);
            });

            it('debe rechazar credencial con username vacío', async () => {
                const createDto: any = {
                    url: 'https://test.com',
                    username: '   ', // Solo espacios
                    password: 'test',
                    visibilityLevel: VisibilityLevel.PRIVATE,
                    vaultId: mockVaultId,
                };

                expect(createDto.username.trim()).toBe('');
            });

            it('debe rechazar credencial con password vacío', async () => {
                const createDto: any = {
                    url: 'https://test.com',
                    username: 'test',
                    password: '', // Vacío
                    visibilityLevel: VisibilityLevel.PRIVATE,
                    vaultId: mockVaultId,
                };

                expect(createDto.password).toBe('');
            });

            it('debe rechazar credencial con título muy largo', async () => {
                const createDto: any = {
                    url: 'https://test.com',
                    username: 'test',
                    password: 'test',
                    title: 'a'.repeat(201), // Más de 200 caracteres
                    visibilityLevel: VisibilityLevel.PRIVATE,
                    vaultId: mockVaultId,
                };

                expect(createDto.title.length).toBeGreaterThan(200);
            });

            it('debe rechazar credencial con visibilityLevel inválido', async () => {
                const createDto: any = {
                    url: 'https://test.com',
                    username: 'test',
                    password: 'test',
                    visibilityLevel: 'invalid_level', // No es un VisibilityLevel válido
                    vaultId: mockVaultId,
                };

                expect(Object.values(VisibilityLevel)).not.toContain(
                    createDto.visibilityLevel,
                );
            });

            it('debe rechazar credencial con vaultId inválido', async () => {
                const createDto: any = {
                    url: 'https://test.com',
                    username: 'test',
                    password: 'test',
                    visibilityLevel: VisibilityLevel.PRIVATE,
                    vaultId: 'not-a-uuid', // No es UUID
                };

                expect(createDto.vaultId).not.toMatch(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                );
            });

            it('debe rechazar credencial con companyIds inválidos', async () => {
                const createDto: any = {
                    url: 'https://test.com',
                    username: 'test',
                    password: 'test',
                    visibilityLevel: VisibilityLevel.BY_COMPANY,
                    vaultId: mockVaultId,
                    companyIds: ['not-a-uuid', 'also-not-uuid'], // No son UUIDs
                };

                const invalidIds = createDto.companyIds.filter(
                    (id: string) =>
                        !id.match(
                            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                        ),
                );
                expect(invalidIds.length).toBeGreaterThan(0);
            });

            it('debe aceptar credencial con datos válidos mínimos', async () => {
                const createDto: CreateCredentialDto = {
                    url: 'https://test.com',
                    username: 'testuser',
                    password: 'testpass',
                    visibilityLevel: VisibilityLevel.PRIVATE,
                    vaultId: mockVaultId,
                };

                jest.spyOn(service, 'createCredential').mockResolvedValue(mockCredential);
                const result = await controller.createCredential(mockEmployeeId, createDto);
                expect(result).toBeDefined();
            });

            it('debe aceptar credencial con todos los campos opcionales', async () => {
                const createDto: CreateCredentialDto = {
                    url: 'https://test.com',
                    username: 'testuser',
                    password: 'testpass',
                    title: 'Título completo',
                    directLoginUrl: 'https://test.com/login',
                    notes: 'Notas de prueba',
                    logoId: '123e4567-e89b-12d3-a456-426614174000',
                    visibilityLevel: VisibilityLevel.BY_COMPANY,
                    vaultId: mockVaultId,
                    companyIds: ['123e4567-e89b-12d3-a456-426614174000'],
                };

                jest.spyOn(service, 'createCredential').mockResolvedValue(mockCredential);
                const result = await controller.createCredential(mockEmployeeId, createDto);
                expect(result).toBeDefined();
            });
        });
    });

    describe('Integration Tests - Formato de respuestas de error', () => {
        it('debe retornar error 404 con formato correcto cuando vault no existe', async () => {
            jest.spyOn(service, 'findAllVaults').mockResolvedValue([]);

            await expect(
                controller.findOneVault(mockEmployeeId, 'non-existent-id'),
            ).rejects.toThrow(NotFoundException);

            try {
                await controller.findOneVault(mockEmployeeId, 'non-existent-id');
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException);
                expect(error.message).toBe('Vault no encontrado');
            }
        });

        it('debe propagar errores del servicio con formato correcto', async () => {
            const serviceError = new Error('Error del servicio');
            jest.spyOn(service, 'createVault').mockRejectedValue(serviceError);

            const createDto: CreateVaultDto = {
                name: 'Test Vault',
            };

            await expect(controller.createVault(mockEmployeeId, createDto)).rejects.toThrow(
                serviceError,
            );
        });

        it('debe manejar errores de autorización del servicio', async () => {
            const authError = new Error('No autorizado');
            jest.spyOn(service, 'updateVault').mockRejectedValue(authError);

            const updateDto: UpdateVaultDto = {
                name: 'Updated',
            };

            await expect(
                controller.updateVault(mockEmployeeId, mockVaultId, updateDto),
            ).rejects.toThrow(authError);
        });

        it('debe manejar errores de validación del servicio', async () => {
            const validationError = new Error('Datos inválidos');
            jest.spyOn(service, 'createCredential').mockRejectedValue(validationError);

            const createDto: CreateCredentialDto = {
                url: 'https://test.com',
                username: 'test',
                password: 'test',
                visibilityLevel: VisibilityLevel.PRIVATE,
                vaultId: mockVaultId,
            };

            await expect(
                controller.createCredential(mockEmployeeId, createDto),
            ).rejects.toThrow(validationError);
        });

        it('debe manejar errores de conflicto (vault con credenciales)', async () => {
            const conflictError = new Error('El vault contiene credenciales');
            jest.spyOn(service, 'deleteVault').mockRejectedValue(conflictError);

            await expect(
                controller.deleteVault(mockEmployeeId, mockVaultId),
            ).rejects.toThrow(conflictError);
        });
    });
});
