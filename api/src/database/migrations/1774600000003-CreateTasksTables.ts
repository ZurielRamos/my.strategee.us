import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTasksTables1774600000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'tasks',
                columns: [
                    { name: 'id', type: 'varchar', length: '36', isPrimary: true, default: 'UUID()' },
                    { name: 'assignee_user_id', type: 'varchar', length: '36', isNullable: false },
                    { name: 'title', type: 'varchar', length: '500', isNullable: false },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'due_date', type: 'date', isNullable: true },
                    { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
                    { name: 'completed_at', type: 'datetime', isNullable: true },
                    { name: 'source', type: 'varchar', length: '20', default: "'manual'" },
                    { name: 'recap_commitment_id', type: 'int', isNullable: true, isUnique: true },
                    { name: 'recap_minute_id', type: 'int', isNullable: true },
                    { name: 'recap_minute_number', type: 'varchar', length: '32', isNullable: true },
                    { name: 'recap_client_name', type: 'varchar', length: '255', isNullable: true },
                    { name: 'recap_project_name', type: 'varchar', length: '255', isNullable: true },
                    { name: 'recap_modified_at', type: 'varchar', length: '20', isNullable: true },
                    { name: 'google_task_id', type: 'varchar', length: '255', isNullable: true },
                    { name: 'google_updated_at', type: 'varchar', length: '40', isNullable: true },
                    { name: 'google_sync_pending', type: 'tinyint', width: 1, default: 1 },
                    { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
                    {
                        name: 'updated_at', type: 'datetime', precision: 6,
                        default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)',
                    },
                ],
            }),
            true,
        );
        await queryRunner.createIndex('tasks', new TableIndex({
            name: 'IDX_tasks_assignee_status', columnNames: ['assignee_user_id', 'status'],
        }));
        await queryRunner.createIndex('tasks', new TableIndex({
            name: 'IDX_tasks_google_task_id', columnNames: ['google_task_id'],
        }));
        await queryRunner.createForeignKey('tasks', new TableForeignKey({
            name: 'FK_tasks_assignee_user',
            columnNames: ['assignee_user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createTable(
            new Table({
                name: 'task_sync_state',
                columns: [
                    { name: 'key', type: 'varchar', length: '100', isPrimary: true },
                    { name: 'value', type: 'varchar', length: '255', isNullable: true },
                    {
                        name: 'updated_at', type: 'datetime', precision: 6,
                        default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('task_sync_state', true);
        await queryRunner.dropTable('tasks', true, true, true);
    }
}
