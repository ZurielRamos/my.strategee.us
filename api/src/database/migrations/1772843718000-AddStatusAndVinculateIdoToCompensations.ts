import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusAndVinculateIdoToCompensations1772843718000 implements MigrationInterface {
    name = 'AddStatusAndVinculateIdoToCompensations1772843718000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columna vinculateIdo
        await queryRunner.query(`
            ALTER TABLE "compensations" 
            ADD COLUMN "vinculateIdo" boolean NOT NULL DEFAULT false
        `);

        // Agregar columna status
        await queryRunner.query(`
            ALTER TABLE "compensations" 
            ADD COLUMN "status" varchar NOT NULL DEFAULT 'ACTIVE'
        `);

        // Crear tipo enum para status
        await queryRunner.query(`
            ALTER TABLE "compensations" 
            ALTER COLUMN "status" TYPE varchar
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "compensations" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "compensations" DROP COLUMN "vinculateIdo"`);
    }
}
