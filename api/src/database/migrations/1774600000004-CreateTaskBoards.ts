import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

/**
 * Tableros de tareas: tableros, listas, accesos compartidos y listas de Google Tasks por tablero.
 * Las tareas existentes quedan sin tablero (board_id NULL) y la aplicación las ubica
 * la primera vez que el usuario abre Tareas o corre la sincronización.
 */
export class CreateTaskBoards1774600000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const timestamps = [
            { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
            { name: 'updated_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' },
        ];

        await queryRunner.createTable(new Table({
            name: 'boards',
            columns: [
                { name: 'id', type: 'varchar', length: '36', isPrimary: true, default: 'UUID()' },
                { name: 'owner_user_id', type: 'varchar', length: '36', isNullable: false },
                { name: 'name', type: 'varchar', length: '120', isNullable: false },
                { name: 'type', type: 'varchar', length: '20', default: "'custom'" },
                ...timestamps,
            ],
        }), true);
        await queryRunner.createIndex('boards', new TableIndex({ name: 'IDX_boards_owner', columnNames: ['owner_user_id'] }));
        await queryRunner.createForeignKey('boards', new TableForeignKey({
            name: 'FK_boards_owner_user', columnNames: ['owner_user_id'],
            referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE',
        }));

        await queryRunner.createTable(new Table({
            name: 'board_lists',
            columns: [
                { name: 'id', type: 'varchar', length: '36', isPrimary: true, default: 'UUID()' },
                { name: 'board_id', type: 'varchar', length: '36', isNullable: false },
                { name: 'name', type: 'varchar', length: '80', isNullable: false },
                { name: 'position', type: 'int', default: 0 },
                { name: 'is_done', type: 'tinyint', width: 1, default: 0 },
                ...timestamps,
            ],
        }), true);
        await queryRunner.createForeignKey('board_lists', new TableForeignKey({
            name: 'FK_board_lists_board', columnNames: ['board_id'],
            referencedTableName: 'boards', referencedColumnNames: ['id'], onDelete: 'CASCADE',
        }));

        await queryRunner.createTable(new Table({
            name: 'board_shares',
            columns: [
                { name: 'id', type: 'varchar', length: '36', isPrimary: true, default: 'UUID()' },
                { name: 'board_id', type: 'varchar', length: '36', isNullable: false },
                { name: 'user_id', type: 'varchar', length: '36', isNullable: true },
                { name: 'department_id', type: 'varchar', length: '36', isNullable: true },
                timestamps[0],
            ],
        }), true);
        await queryRunner.createUniqueConstraint('board_shares', new TableUnique({
            name: 'UQ_board_shares_board_user', columnNames: ['board_id', 'user_id'],
        }));
        await queryRunner.createUniqueConstraint('board_shares', new TableUnique({
            name: 'UQ_board_shares_board_department', columnNames: ['board_id', 'department_id'],
        }));
        await queryRunner.createForeignKeys('board_shares', [
            new TableForeignKey({
                name: 'FK_board_shares_board', columnNames: ['board_id'],
                referencedTableName: 'boards', referencedColumnNames: ['id'], onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                name: 'FK_board_shares_user', columnNames: ['user_id'],
                referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE',
            }),
        ]);

        await queryRunner.createTable(new Table({
            name: 'google_task_lists',
            columns: [
                { name: 'id', type: 'varchar', length: '36', isPrimary: true, default: 'UUID()' },
                { name: 'user_id', type: 'varchar', length: '36', isNullable: false },
                { name: 'board_id', type: 'varchar', length: '36', isNullable: false },
                { name: 'google_list_id', type: 'varchar', length: '255', isNullable: false },
                { name: 'pulled_at', type: 'varchar', length: '40', isNullable: true },
            ],
        }), true);
        await queryRunner.createUniqueConstraint('google_task_lists', new TableUnique({
            name: 'UQ_google_task_lists_user_board', columnNames: ['user_id', 'board_id'],
        }));
        await queryRunner.createForeignKeys('google_task_lists', [
            new TableForeignKey({
                name: 'FK_google_task_lists_user', columnNames: ['user_id'],
                referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                name: 'FK_google_task_lists_board', columnNames: ['board_id'],
                referencedTableName: 'boards', referencedColumnNames: ['id'], onDelete: 'CASCADE',
            }),
        ]);

        await queryRunner.addColumns('tasks', [
            new TableColumn({ name: 'board_id', type: 'varchar', length: '36', isNullable: true }),
            new TableColumn({ name: 'list_id', type: 'varchar', length: '36', isNullable: true }),
            new TableColumn({ name: 'position', type: 'int', default: 0 }),
        ]);
        await queryRunner.createIndex('tasks', new TableIndex({ name: 'IDX_tasks_list_position', columnNames: ['list_id', 'position'] }));
        await queryRunner.createForeignKeys('tasks', [
            new TableForeignKey({
                name: 'FK_tasks_board', columnNames: ['board_id'],
                referencedTableName: 'boards', referencedColumnNames: ['id'], onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                name: 'FK_tasks_list', columnNames: ['list_id'],
                referencedTableName: 'board_lists', referencedColumnNames: ['id'], onDelete: 'SET NULL',
            }),
        ]);
        // La lista única "My Strategee" en Google se reemplaza por una lista por tablero.
        const tokens = await queryRunner.getTable('google_workspace_tokens');
        for (const column of ['tasks_pulled_at', 'tasks_list_id']) {
            if (tokens?.findColumnByName(column)) {
                await queryRunner.dropColumn('google_workspace_tokens', column);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('tasks', 'FK_tasks_list');
        await queryRunner.dropForeignKey('tasks', 'FK_tasks_board');
        await queryRunner.dropIndex('tasks', 'IDX_tasks_list_position');
        await queryRunner.dropColumns('tasks', ['position', 'list_id', 'board_id']);
        await queryRunner.dropTable('google_task_lists', true, true);
        await queryRunner.dropTable('board_shares', true, true);
        await queryRunner.dropTable('board_lists', true, true);
        await queryRunner.dropTable('boards', true, true);
    }
}
