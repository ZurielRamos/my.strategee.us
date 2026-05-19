import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCompanyLogoToAttachment1772829723000 implements MigrationInterface {
    name = 'UpdateCompanyLogoToAttachment1772829723000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new logoId column
        await queryRunner.query(`
            ALTER TABLE "companies" 
            ADD COLUMN "logoId" uuid
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "companies" 
            ADD CONSTRAINT "FK_companies_logoId" 
            FOREIGN KEY ("logoId") 
            REFERENCES "attachments"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);

        // Drop old logoUrl column
        await queryRunner.query(`
            ALTER TABLE "companies" 
            DROP COLUMN "logoUrl"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back logoUrl column
        await queryRunner.query(`
            ALTER TABLE "companies" 
            ADD COLUMN "logoUrl" varchar
        `);

        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "companies" 
            DROP CONSTRAINT "FK_companies_logoId"
        `);

        // Drop logoId column
        await queryRunner.query(`
            ALTER TABLE "companies" 
            DROP COLUMN "logoId"
        `);
    }
}
