import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateGiftedDaysLedgerTable1774100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'gifted_days_ledger',
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
                        name: 'type',
                        type: 'enum',
                        enum: ['OBSEQUIO', 'DISFRUTE', 'AJUSTE', 'VENCIMIENTO'],
                        isNullable: false,
                    },
                    {
                        name: 'days',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'request_id',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'note',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Índice para búsquedas por empleado
        await queryRunner.createIndex(
            'gifted_days_ledger',
            new TableIndex({
                name: 'IDX_gifted_days_ledger_employee_id',
                columnNames: ['employee_id'],
            }),
        );

        // Foreign key hacia employees
        await queryRunner.createForeignKey(
            'gifted_days_ledger',
            new TableForeignKey({
                columnNames: ['employee_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );

        // Foreign key hacia requests (opcional)
        await queryRunner.createForeignKey(
            'gifted_days_ledger',
            new TableForeignKey({
                columnNames: ['request_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'requests',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('gifted_days_ledger');
    }
}
