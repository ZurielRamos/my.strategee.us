import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfilePhotoToEmployees1772840536000 implements MigrationInterface {
    name = 'AddProfilePhotoToEmployees1772840536000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ADD "profilePhotoId" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "employees" 
            ADD CONSTRAINT "FK_employees_profilePhoto" 
            FOREIGN KEY ("profilePhotoId") 
            REFERENCES "attachments"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "employees" 
            DROP CONSTRAINT "FK_employees_profilePhoto"
        `);

        await queryRunner.query(`
            ALTER TABLE "employees" 
            DROP COLUMN "profilePhotoId"
        `);
    }
}
