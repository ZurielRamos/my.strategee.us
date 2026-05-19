import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCredentialAccessLogsCascade1773900000000 implements MigrationInterface {
    name = 'UpdateCredentialAccessLogsCascade1773900000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing foreign key constraint
        await queryRunner.query(`
            ALTER TABLE \`credential_access_logs\` 
            DROP FOREIGN KEY \`FK_7f20a3c374da32eb9a825619c5a\`
        `);

        // Add the foreign key constraint with CASCADE delete
        await queryRunner.query(`
            ALTER TABLE \`credential_access_logs\` 
            ADD CONSTRAINT \`FK_7f20a3c374da32eb9a825619c5a\` 
            FOREIGN KEY (\`credential_id\`) 
            REFERENCES \`credentials\`(\`id\`) 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the CASCADE foreign key constraint
        await queryRunner.query(`
            ALTER TABLE \`credential_access_logs\` 
            DROP FOREIGN KEY \`FK_7f20a3c374da32eb9a825619c5a\`
        `);

        // Restore the original foreign key constraint without CASCADE
        await queryRunner.query(`
            ALTER TABLE \`credential_access_logs\` 
            ADD CONSTRAINT \`FK_7f20a3c374da32eb9a825619c5a\` 
            FOREIGN KEY (\`credential_id\`) 
            REFERENCES \`credentials\`(\`id\`) 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
    }
}
