import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddActionToCredentialAccessLogs1773900400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'credential_access_logs',
            new TableColumn({
                name: 'action',
                type: 'enum',
                enum: ['created', 'accessed', 'updated'],
                default: "'accessed'",
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('credential_access_logs', 'action');
    }
}
