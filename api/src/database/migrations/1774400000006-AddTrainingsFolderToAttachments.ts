import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrainingsFolderToAttachments1774400000006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`attachments\` MODIFY COLUMN \`folder\` ENUM('general','employees','contracts','requests','logos','trainings') NOT NULL DEFAULT 'general'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`attachments\` MODIFY COLUMN \`folder\` ENUM('general','employees','contracts','requests','logos') NOT NULL DEFAULT 'general'`,
        );
    }
}
