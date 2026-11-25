import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateGoogleWorkspaceTokensTable1774600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'google_workspace_tokens',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: 'UUID()',
                    },
                    {
                        name: 'user_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'google_email',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'encrypted_refresh_token',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'scopes',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        precision: 6,
                        default: 'CURRENT_TIMESTAMP(6)',
                    },
                    {
                        name: 'updated_at',
                        type: 'datetime',
                        precision: 6,
                        default: 'CURRENT_TIMESTAMP(6)',
                        onUpdate: 'CURRENT_TIMESTAMP(6)',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'google_workspace_tokens',
            new TableForeignKey({
                name: 'FK_google_workspace_tokens_user',
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('google_workspace_tokens', true, true);
    }
}
