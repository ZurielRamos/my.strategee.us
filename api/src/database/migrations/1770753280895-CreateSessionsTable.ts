import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateSessionsTable1770753280895 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create sessions table
        await queryRunner.createTable(
            new Table({
                name: 'sessions',
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
                        name: 'refreshToken',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'deviceName',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'deviceType',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'ipAddress',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'userAgent',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'lastUsedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
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
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            'sessions',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // Remove refreshToken column from users table
        await queryRunner.dropColumn('users', 'refreshToken');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back refreshToken column to users table
        await queryRunner.query(`
            ALTER TABLE users 
            ADD COLUMN refreshToken VARCHAR(255) NULL
        `);

        // Drop sessions table (foreign key will be dropped automatically)
        await queryRunner.dropTable('sessions');
    }

}

