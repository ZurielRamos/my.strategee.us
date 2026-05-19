import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDeviceTokensTable1773600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'device_tokens',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'employee_id',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'fcm_token',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'platform',
                        type: 'enum',
                        enum: ['WEB', 'ANDROID', 'IOS'],
                        isNullable: false,
                    },
                    {
                        name: 'active',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
                    },
                    {
                        name: 'last_used_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Crear índice único en fcm_token
        await queryRunner.createIndex(
            'device_tokens',
            new TableIndex({
                name: 'idx_device_tokens_fcm_token',
                columnNames: ['fcm_token'],
                isUnique: true,
            }),
        );

        // Crear índice compuesto en employee_id y active
        await queryRunner.createIndex(
            'device_tokens',
            new TableIndex({
                name: 'idx_device_tokens_employee_active',
                columnNames: ['employee_id', 'active'],
            }),
        );

        // Crear índice compuesto en active y last_used_at
        await queryRunner.createIndex(
            'device_tokens',
            new TableIndex({
                name: 'idx_device_tokens_active_last_used',
                columnNames: ['active', 'last_used_at'],
            }),
        );

        // Crear foreign key hacia employees con CASCADE
        await queryRunner.createForeignKey(
            'device_tokens',
            new TableForeignKey({
                columnNames: ['employee_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );

        // Crear trigger para actualizar updated_at automáticamente
        await queryRunner.query(`
            CREATE TRIGGER trigger_update_device_tokens_updated_at
            BEFORE UPDATE ON device_tokens
            FOR EACH ROW
            SET NEW.updated_at = CURRENT_TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar trigger
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_device_tokens_updated_at
        `);

        const table = await queryRunner.getTable('device_tokens');
        
        if (table) {
            // Eliminar foreign keys
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('device_tokens', foreignKey);
            }
        }

        // Eliminar índices
        await queryRunner.dropIndex('device_tokens', 'idx_device_tokens_fcm_token');
        await queryRunner.dropIndex('device_tokens', 'idx_device_tokens_employee_active');
        await queryRunner.dropIndex('device_tokens', 'idx_device_tokens_active_last_used');

        // Eliminar tabla
        await queryRunner.dropTable('device_tokens');
    }
}
