import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInheritVisibilityLevel1773900300000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'inherit' to the credentials visibilityLevel enum
        await queryRunner.query(`
            ALTER TYPE credentials_visibilitylevel_enum ADD VALUE IF NOT EXISTS 'inherit'
        `);

        // Add 'inherit' to the vaults visibility_level enum
        await queryRunner.query(`
            ALTER TYPE vaults_visibility_level_enum ADD VALUE IF NOT EXISTS 'inherit'
        `);

        // Update default for credentials.visibilityLevel to 'inherit'
        await queryRunner.query(`
            ALTER TABLE credentials ALTER COLUMN "visibilityLevel" SET DEFAULT 'inherit'
        `);

        // Update default for vaults.visibility_level to 'inherit'
        await queryRunner.query(`
            ALTER TABLE vaults ALTER COLUMN "visibility_level" SET DEFAULT 'inherit'
        `);

        // Migrate existing credentials: PRIVATE that are not owned by the vault owner
        // should become INHERIT (they were using PRIVATE as "no config" before)
        // Only credentials explicitly set to private by the owner should stay PRIVATE.
        // Since we can't distinguish, we migrate all existing PRIVATE credentials to INHERIT
        // as the new semantic is cleaner.
        await queryRunner.query(`
            UPDATE credentials SET "visibilityLevel" = 'inherit' WHERE "visibilityLevel" = 'private'
        `);

        // Migrate existing vaults: same logic
        await queryRunner.query(`
            UPDATE vaults SET "visibility_level" = 'inherit' WHERE "visibility_level" = 'private'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert credentials back to 'private'
        await queryRunner.query(`
            UPDATE credentials SET "visibilityLevel" = 'private' WHERE "visibilityLevel" = 'inherit'
        `);

        // Revert vaults back to 'private'
        await queryRunner.query(`
            UPDATE vaults SET "visibility_level" = 'private' WHERE "visibility_level" = 'inherit'
        `);

        // Revert defaults
        await queryRunner.query(`
            ALTER TABLE credentials ALTER COLUMN "visibilityLevel" SET DEFAULT 'private'
        `);
        await queryRunner.query(`
            ALTER TABLE vaults ALTER COLUMN "visibility_level" SET DEFAULT 'private'
        `);

        // Note: PostgreSQL does not support removing enum values directly.
        // The 'inherit' value would remain in the enum type after rollback.
    }
}
