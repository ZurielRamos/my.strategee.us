import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateTrainingAssignmentsTable1774400000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'training_assignments',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: 'UUID()',
                    },
                    {
                        name: 'training_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'employee_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'in_progress', 'completed'],
                        default: "'pending'",
                        isNullable: false,
                    },
                    {
                        name: 'completed_at',
                        type: 'datetime',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createUniqueConstraint(
            'training_assignments',
            new TableUnique({
                name: 'UQ_training_assignments_training_employee',
                columnNames: ['training_id', 'employee_id'],
            }),
        );

        await queryRunner.createForeignKey(
            'training_assignments',
            new TableForeignKey({
                columnNames: ['training_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'trainings',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'training_assignments',
            new TableForeignKey({
                columnNames: ['employee_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('training_assignments');
        if (table) {
            for (const fk of table.foreignKeys) {
                await queryRunner.dropForeignKey('training_assignments', fk);
            }
        }
        await queryRunner.dropUniqueConstraint(
            'training_assignments',
            'UQ_training_assignments_training_employee',
        );
        await queryRunner.dropTable('training_assignments');
    }
}
