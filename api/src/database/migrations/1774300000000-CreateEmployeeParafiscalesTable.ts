import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateEmployeeParafiscalesTable1774300000000 implements MigrationInterface {
    name = 'CreateEmployeeParafiscalesTable1774300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'employee_parafiscales',
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
                        type: 'uuid',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'eps',
                        type: 'varchar',
                        length: '150',
                        isNullable: true,
                    },
                    {
                        name: 'arl',
                        type: 'varchar',
                        length: '150',
                        isNullable: true,
                    },
                    {
                        name: 'fondo_pension',
                        type: 'varchar',
                        length: '150',
                        isNullable: true,
                    },
                    {
                        name: 'caja_compensacion',
                        type: 'varchar',
                        length: '150',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['employee_id'],
                        referencedTableName: 'employees',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('employee_parafiscales');
    }
}
