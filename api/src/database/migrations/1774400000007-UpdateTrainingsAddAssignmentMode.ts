import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTrainingsAddAssignmentMode1774400000007 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Hacer nullable starts_at y ends_at
        await queryRunner.query(`
            ALTER TABLE \`trainings\`
            MODIFY COLUMN \`starts_at\` datetime NULL,
            MODIFY COLUMN \`ends_at\` datetime NULL
        `);

        // Agregar valor 'inactive' al enum status
        await queryRunner.query(`
            ALTER TABLE \`trainings\`
            MODIFY COLUMN \`status\` enum('draft','active','inactive','expired') NOT NULL DEFAULT 'draft'
        `);

        // Agregar columna assignment_mode
        await queryRunner.query(`
            ALTER TABLE \`trainings\`
            ADD COLUMN \`assignment_mode\` enum('all','all_with_exclusions','selected') NOT NULL DEFAULT 'all'
            AFTER \`is_mandatory\`
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`trainings\` DROP COLUMN \`assignment_mode\``);

        await queryRunner.query(`
            ALTER TABLE \`trainings\`
            MODIFY COLUMN \`status\` enum('draft','active','expired') NOT NULL DEFAULT 'draft'
        `);

        await queryRunner.query(`
            ALTER TABLE \`trainings\`
            MODIFY COLUMN \`starts_at\` datetime NOT NULL,
            MODIFY COLUMN \`ends_at\` datetime NOT NULL
        `);
    }
}
