import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePasswordResetTokensTable1770757067500 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create password_reset_tokens table
        await queryRunner.createTable(
            new Table({
                name: 'password_reset_tokens',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'expiresAt',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            'password_reset_tokens',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop password_reset_tokens table (foreign key will be dropped automatically)
        await queryRunner.dropTable('password_reset_tokens');
    }

}


