import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCompensatedTimeLedgerTable1773000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'compensated_time_ledger',
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
                        enum: ['ACUMULACION', 'DISFRUTE', 'AJUSTE', 'VENCIMIENTO'],
                        isNullable: false,
                    },
                    {
                        name: 'hours',
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

        // Crear índice en employee_id
        await queryRunner.createIndex(
            'compensated_time_ledger',
            new TableIndex({
                name: 'IDX_compensated_time_ledger_employee_id',
                columnNames: ['employee_id'],
            }),
        );

        // Crear foreign key hacia employees
        await queryRunner.createForeignKey(
            'compensated_time_ledger',
            new TableForeignKey({
                columnNames: ['employee_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );

        // Crear foreign key hacia requests (opcional, puede ser null)
        await queryRunner.createForeignKey(
            'compensated_time_ledger',
            new TableForeignKey({
                columnNames: ['request_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'requests',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('compensated_time_ledger');
        
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('compensated_time_ledger', foreignKey);
            }
        }

        await queryRunner.dropIndex('compensated_time_ledger', 'IDX_compensated_time_ledger_employee_id');
        await queryRunner.dropTable('compensated_time_ledger');
    }
}
