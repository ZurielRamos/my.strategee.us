import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateNotificationsTable1773500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'notifications',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'type',
                        type: 'enum',
                        enum: ['REQUEST_STATUS_CHANGE'],
                        isNullable: false,
                    },
                    {
                        name: 'message',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['UNREAD', 'READ'],
                        default: "'UNREAD'",
                        isNullable: false,
                    },
                    {
                        name: 'employee_id',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'request_id',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'read_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Crear índice compuesto en employee_id y status
        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'IDX_notifications_employee_status',
                columnNames: ['employee_id', 'status'],
            }),
        );

        // Crear índice compuesto en employee_id y created_at
        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'IDX_notifications_employee_created',
                columnNames: ['employee_id', 'created_at'],
            }),
        );

        // Crear índice en created_at para limpieza de notificaciones antiguas
        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'IDX_notifications_created',
                columnNames: ['created_at'],
            }),
        );

        // Crear foreign key hacia employees con CASCADE
        await queryRunner.createForeignKey(
            'notifications',
            new TableForeignKey({
                columnNames: ['employee_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );

        // Crear foreign key hacia requests con SET NULL
        await queryRunner.createForeignKey(
            'notifications',
            new TableForeignKey({
                columnNames: ['request_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'requests',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('notifications');
        
        if (table) {
            // Eliminar foreign keys
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('notifications', foreignKey);
            }
        }

        // Eliminar índices
        await queryRunner.dropIndex('notifications', 'IDX_notifications_employee_status');
        await queryRunner.dropIndex('notifications', 'IDX_notifications_employee_created');
        await queryRunner.dropIndex('notifications', 'IDX_notifications_created');

        // Eliminar tabla
        await queryRunner.dropTable('notifications');
    }
}
