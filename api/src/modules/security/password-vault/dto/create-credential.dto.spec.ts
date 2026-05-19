import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as fc from 'fast-check';
import { CreateCredentialDto } from './create-credential.dto';
import { VisibilityLevel } from '../enums/visibility-level.enum';

/**
 * Feature: employee-password-vault
 * Property 28: Invalid URL is Rejected
 * 
 * Para cualquier creación o actualización de credencial con un formato de URL inválido,
 * el sistema debe rechazar la solicitud con un error de validación.
 * 
 * Valida: Requisitos 11.1, 11.5
 */
describe('CreateCredentialDto - Property 28: Invalid URL is Rejected', () => {
    // Arbitrary for generating invalid URLs that class-validator will reject
    // Note: class-validator's @IsUrl() is quite permissive and accepts some edge cases
    // We focus on clearly invalid URLs that should always be rejected
    const invalidUrlArbitrary = () =>
        fc.oneof(
            // Empty string
            fc.constant(''),
            // Just spaces
            fc.constant('   '),
            // Just text without protocol (when require_protocol: true)
            fc.constant('example.com'),
            fc.constant('www.example.com'),
            fc.constant('just-text'),
            fc.constant('not a url at all'),
            // Missing domain after protocol
            fc.constant('http://'),
            fc.constant('https://'),
            fc.constant('ftp://'),
            // Invalid characters in URL
            fc.constant('http://exam ple.com'),
            fc.constant('http://example .com'),
            fc.constant('http://example<>.com'),
            // Malformed protocol
            fc.constant('ht tp://example.com'),
            fc.constant('http//example.com'),
            // Just protocol without slashes
            fc.constant('http:'),
            fc.constant('https:'),
        );

    // Arbitrary for valid UUID
    const validUuidArbitrary = () =>
        fc.constant('123e4567-e89b-12d3-a456-426614174000');

    it('property: invalid URL in url field should be rejected', async () => {
        await fc.assert(
            fc.asyncProperty(
                invalidUrlArbitrary(),
                validUuidArbitrary(),
                async (invalidUrl, vaultId) => {
                    const dto = plainToInstance(CreateCredentialDto, {
                        url: invalidUrl,
                        username: 'testuser',
                        password: 'testpass',
                        visibilityLevel: VisibilityLevel.PRIVATE,
                        vaultId: vaultId,
                    });

                    const errors = await validate(dto);

                    // Should have validation errors
                    expect(errors.length).toBeGreaterThan(0);

                    // Should have error on url field
                    const urlError = errors.find(e => e.property === 'url');
                    expect(urlError).toBeDefined();
                    expect(urlError?.constraints).toBeDefined();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('property: invalid URL in directLoginUrl field should be rejected', async () => {
        await fc.assert(
            fc.asyncProperty(
                invalidUrlArbitrary(),
                validUuidArbitrary(),
                async (invalidUrl, vaultId) => {
                    const dto = plainToInstance(CreateCredentialDto, {
                        url: 'https://example.com',
                        username: 'testuser',
                        password: 'testpass',
                        visibilityLevel: VisibilityLevel.PRIVATE,
                        vaultId: vaultId,
                        directLoginUrl: invalidUrl,
                    });

                    const errors = await validate(dto);

                    // Should have validation errors
                    expect(errors.length).toBeGreaterThan(0);

                    // Should have error on directLoginUrl field
                    const directLoginUrlError = errors.find(e => e.property === 'directLoginUrl');
                    expect(directLoginUrlError).toBeDefined();
                    expect(directLoginUrlError?.constraints).toBeDefined();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('property: valid URLs should pass validation', async () => {
        const validUrlArbitrary = () =>
            fc.oneof(
                fc.constant('https://example.com'),
                fc.constant('http://example.com'),
                fc.constant('https://www.example.com'),
                fc.constant('https://example.com/path'),
                fc.constant('https://example.com/path?query=value'),
                fc.constant('https://subdomain.example.com'),
                fc.constant('https://example.com:8080'),
                fc.constant('https://example.com/path/to/resource'),
            );

        await fc.assert(
            fc.asyncProperty(
                validUrlArbitrary(),
                validUuidArbitrary(),
                async (validUrl, vaultId) => {
                    const dto = plainToInstance(CreateCredentialDto, {
                        url: validUrl,
                        username: 'testuser',
                        password: 'testpass',
                        visibilityLevel: VisibilityLevel.PRIVATE,
                        vaultId: vaultId,
                    });

                    const errors = await validate(dto);

                    // Should have no validation errors on url field
                    const urlError = errors.find(e => e.property === 'url');
                    expect(urlError).toBeUndefined();
                },
            ),
            { numRuns: 100 },
        );
    });
});

/**
 * Feature: employee-password-vault
 * Property 30: Empty Password is Rejected
 * 
 * Para cualquier creación o actualización de credencial con una contraseña vacía
 * o que contenga solo espacios en blanco, el sistema debe rechazar la solicitud con un
 * error de validación.
 * 
 * Valida: Requisitos 11.3
 */
describe('CreateCredentialDto - Property 30: Empty Password is Rejected', () => {
    // Arbitrary for generating empty or whitespace-only strings
    const emptyOrWhitespaceArbitrary = () =>
        fc.oneof(
            // Empty string
            fc.constant(''),
            // Just spaces
            fc.constant(' '),
            fc.constant('  '),
            fc.constant('   '),
            fc.constant('    '),
            // Just tabs
            fc.constant('\t'),
            fc.constant('\t\t'),
            // Mixed whitespace
            fc.constant(' \t '),
            fc.constant('\t \t'),
            fc.constant('  \t  '),
            // Newlines and whitespace
            fc.constant('\n'),
            fc.constant('\r\n'),
            fc.constant(' \n '),
            fc.constant('\t\n\t'),
        );

    // Arbitrary for valid UUID
    const validUuidArbitrary = () =>
        fc.constant('123e4567-e89b-12d3-a456-426614174000');

    it('property: empty or whitespace-only password should be rejected', async () => {
        await fc.assert(
            fc.asyncProperty(
                emptyOrWhitespaceArbitrary(),
                validUuidArbitrary(),
                async (emptyPassword, vaultId) => {
                    const dto = plainToInstance(CreateCredentialDto, {
                        url: 'https://example.com',
                        username: 'testuser',
                        password: emptyPassword,
                        visibilityLevel: VisibilityLevel.PRIVATE,
                        vaultId: vaultId,
                    });

                    const errors = await validate(dto);

                    // Should have validation errors
                    expect(errors.length).toBeGreaterThan(0);

                    // Should have error on password field
                    const passwordError = errors.find(e => e.property === 'password');
                    expect(passwordError).toBeDefined();
                    expect(passwordError?.constraints).toBeDefined();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('property: non-empty password should pass validation', async () => {
        const nonEmptyPasswordArbitrary = () =>
            fc.oneof(
                fc.constant('pass'),
                fc.constant('password123'),
                fc.constant('P@ssw0rd!'),
                fc.constant('a'), // Single character
                fc.constant('pass word'), // With space in middle
                fc.constant('pass_word'),
                fc.constant('pass-word'),
                fc.constant('pass.word'),
                fc.constant('12345'),
            );

        await fc.assert(
            fc.asyncProperty(
                nonEmptyPasswordArbitrary(),
                validUuidArbitrary(),
                async (validPassword, vaultId) => {
                    const dto = plainToInstance(CreateCredentialDto, {
                        url: 'https://example.com',
                        username: 'testuser',
                        password: validPassword,
                        visibilityLevel: VisibilityLevel.PRIVATE,
                        vaultId: vaultId,
                    });

                    const errors = await validate(dto);

                    // Should have no validation errors on password field
                    const passwordError = errors.find(e => e.property === 'password');
                    expect(passwordError).toBeUndefined();
                },
            ),
            { numRuns: 100 },
        );
    });
});

/**
 * Feature: employee-password-vault
 * Property 29: Empty Username is Rejected
 * 
 * Para cualquier creación o actualización de credencial con un nombre de usuario vacío
 * o que contenga solo espacios en blanco, el sistema debe rechazar la solicitud con un
 * error de validación.
 * 
 * Valida: Requisitos 11.2
 */
describe('CreateCredentialDto - Property 29: Empty Username is Rejected', () => {
    // Arbitrary for generating empty or whitespace-only strings
    const emptyOrWhitespaceArbitrary = () =>
        fc.oneof(
            // Empty string
            fc.constant(''),
            // Just spaces
            fc.constant(' '),
            fc.constant('  '),
            fc.constant('   '),
            fc.constant('    '),
            // Just tabs
            fc.constant('\t'),
            fc.constant('\t\t'),
            // Mixed whitespace
            fc.constant(' \t '),
            fc.constant('\t \t'),
            fc.constant('  \t  '),
            // Newlines and whitespace
            fc.constant('\n'),
            fc.constant('\r\n'),
            fc.constant(' \n '),
            fc.constant('\t\n\t'),
        );

    // Arbitrary for valid UUID
    const validUuidArbitrary = () =>
        fc.constant('123e4567-e89b-12d3-a456-426614174000');

    it('property: empty or whitespace-only username should be rejected', async () => {
        await fc.assert(
            fc.asyncProperty(
                emptyOrWhitespaceArbitrary(),
                validUuidArbitrary(),
                async (emptyUsername, vaultId) => {
                    const dto = plainToInstance(CreateCredentialDto, {
                        url: 'https://example.com',
                        username: emptyUsername,
                        password: 'testpass',
                        visibilityLevel: VisibilityLevel.PRIVATE,
                        vaultId: vaultId,
                    });

                    const errors = await validate(dto);

                    // Should have validation errors
                    expect(errors.length).toBeGreaterThan(0);

                    // Should have error on username field
                    const usernameError = errors.find(e => e.property === 'username');
                    expect(usernameError).toBeDefined();
                    expect(usernameError?.constraints).toBeDefined();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('property: non-empty username should pass validation', async () => {
        const nonEmptyUsernameArbitrary = () =>
            fc.oneof(
                fc.constant('user'),
                fc.constant('testuser'),
                fc.constant('user@example.com'),
                fc.constant('user123'),
                fc.constant('a'), // Single character
                fc.constant('user name'), // With space in middle
                fc.constant('user_name'),
                fc.constant('user-name'),
                fc.constant('user.name'),
            );

        await fc.assert(
            fc.asyncProperty(
                nonEmptyUsernameArbitrary(),
                validUuidArbitrary(),
                async (validUsername, vaultId) => {
                    const dto = plainToInstance(CreateCredentialDto, {
                        url: 'https://example.com',
                        username: validUsername,
                        password: 'testpass',
                        visibilityLevel: VisibilityLevel.PRIVATE,
                        vaultId: vaultId,
                    });

                    const errors = await validate(dto);

                    // Should have no validation errors on username field
                    const usernameError = errors.find(e => e.property === 'username');
                    expect(usernameError).toBeUndefined();
                },
            ),
            { numRuns: 100 },
        );
    });
});
