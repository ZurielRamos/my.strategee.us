import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import * as fc from 'fast-check';

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EncryptionService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'ENCRYPTION_SECRET') {
                                return 'test_secret_key_with_minimum_32_characters_required';
                            }
                            if (key === 'ENCRYPTION_SALT') {
                                return 'test_salt_16chars';
                            }
                            return null;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
        service.onModuleInit();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('encrypt', () => {
        it('should encrypt a string', () => {
            const plainText = 'myPassword123';
            const encrypted = service.encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');
            expect(encrypted).not.toBe(plainText);
            expect(encrypted.split(':')).toHaveLength(3);
        });

        it('should produce different ciphertext for same input (due to random IV)', () => {
            const plainText = 'myPassword123';
            const encrypted1 = service.encrypt(plainText);
            const encrypted2 = service.encrypt(plainText);

            expect(encrypted1).not.toBe(encrypted2);
        });

        it('should encrypt empty string', () => {
            const plainText = '';
            const encrypted = service.encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(encrypted.split(':')).toHaveLength(3);
        });

        it('should encrypt special characters', () => {
            const plainText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const encrypted = service.encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(encrypted.split(':')).toHaveLength(3);
        });

        it('should encrypt unicode characters', () => {
            const plainText = 'contraseña123 ñáéíóú';
            const encrypted = service.encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(encrypted.split(':')).toHaveLength(3);
        });
    });

    describe('decrypt', () => {
        it('should decrypt an encrypted string', () => {
            const plainText = 'myPassword123';
            const encrypted = service.encrypt(plainText);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should decrypt empty string', () => {
            const plainText = '';
            const encrypted = service.encrypt(plainText);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should decrypt special characters', () => {
            const plainText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const encrypted = service.encrypt(plainText);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should decrypt unicode characters', () => {
            const plainText = 'contraseña123 ñáéíóú';
            const encrypted = service.encrypt(plainText);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should throw error for invalid format', () => {
            const invalidEncrypted = 'invalid:format';

            expect(() => service.decrypt(invalidEncrypted)).toThrow();
        });

        it('should throw error for tampered ciphertext', () => {
            const plainText = 'myPassword123';
            const encrypted = service.encrypt(plainText);
            const parts = encrypted.split(':');
            // Tamper with the encrypted data
            const tampered = `${parts[0]}:${parts[1]}:${parts[2]}ff`;

            expect(() => service.decrypt(tampered)).toThrow();
        });

        it('should throw error for tampered auth tag', () => {
            const plainText = 'myPassword123';
            const encrypted = service.encrypt(plainText);
            const parts = encrypted.split(':');
            // Tamper with the auth tag
            const tampered = `${parts[0]}:${parts[1]}ff:${parts[2]}`;

            expect(() => service.decrypt(tampered)).toThrow();
        });

        it('should throw error for tampered IV', () => {
            const plainText = 'myPassword123';
            const encrypted = service.encrypt(plainText);
            const parts = encrypted.split(':');
            // Tamper with the IV
            const tampered = `${parts[0]}ff:${parts[1]}:${parts[2]}`;

            expect(() => service.decrypt(tampered)).toThrow();
        });

        it('should throw error for empty encrypted text', () => {
            expect(() => service.decrypt('')).toThrow();
        });

        it('should throw error for encrypted text with only one part', () => {
            expect(() => service.decrypt('singlepart')).toThrow();
        });

        it('should throw error for encrypted text with only two parts', () => {
            expect(() => service.decrypt('part1:part2')).toThrow();
        });

        it('should throw error for encrypted text with invalid hex encoding', () => {
            expect(() => service.decrypt('invalid:hex:data')).toThrow();
        });

        it('should throw error for encrypted text with non-hex characters', () => {
            const plainText = 'test';
            const encrypted = service.encrypt(plainText);
            const parts = encrypted.split(':');
            // Replace hex with non-hex characters
            const corrupted = `${parts[0]}:${parts[1]}:ZZZZ`;

            expect(() => service.decrypt(corrupted)).toThrow();
        });
    });

    describe('round-trip encryption', () => {
        it('should maintain data integrity for various strings', () => {
            const testCases = [
                'simple',
                'with spaces',
                'with-dashes-and_underscores',
                'números123',
                'UPPERCASE',
                'MixedCase123',
                'email@example.com',
                'https://example.com/path?query=value',
                'multi\nline\ntext',
                'tab\tseparated\tvalues',
            ];

            testCases.forEach((testCase) => {
                const encrypted = service.encrypt(testCase);
                const decrypted = service.decrypt(encrypted);
                expect(decrypted).toBe(testCase);
            });
        });

        it('should handle long strings', () => {
            const longText = 'a'.repeat(10000);
            const encrypted = service.encrypt(longText);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(longText);
        });

        // Feature: employee-password-vault, Property 1: Encryption Round-Trip for Username
        // **Validates: Requirements 1.2, 4.7**
        it('property: any username can be encrypted and decrypted to produce original value', () => {
            fc.assert(
                fc.property(fc.string(), (username) => {
                    const encrypted = service.encrypt(username);
                    const decrypted = service.decrypt(encrypted);
                    expect(decrypted).toBe(username);
                }),
                { numRuns: 100 }
            );
        });

        // Feature: employee-password-vault, Property 2: Encryption Round-Trip for Password
        // **Validates: Requirements 1.3, 4.8**
        it('property: any password can be encrypted and decrypted to produce original value', () => {
            fc.assert(
                fc.property(fc.string(), (password) => {
                    const encrypted = service.encrypt(password);
                    const decrypted = service.decrypt(encrypted);
                    expect(decrypted).toBe(password);
                }),
                { numRuns: 100 }
            );
        });
    });
});
