import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveStatusFromMemorandums1772919059000 implements MigrationInterface {
    name = 'RemoveStatusFromMemorandums1772919059000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Eliminar la columna status de la tabla memorandums
        await queryRunner.query(`ALTER TABLE "memorandums" DROP COLUMN "status"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaurar la columna status en caso de rollback
        await queryRunner.query(`
            ALTER TABLE "memorandums" 
            ADD "status" character varying NOT NULL DEFAULT 'ACTIVE'
        `);
        
        // Recrear el tipo enum si es necesario
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "memorandums_status_enum" AS ENUM('ACTIVE', 'PENDING');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        // Cambiar el tipo de la columna a enum
        await queryRunner.query(`
            ALTER TABLE "memorandums" 
            ALTER COLUMN "status" TYPE "memorandums_status_enum" 
            USING "status"::"memorandums_status_enum"
        `);
    }
}
