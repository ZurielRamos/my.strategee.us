import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateTrainingExclusionsTable1774400000005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'training_exclusions',
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
                        name: 'created_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createUniqueConstraint(
            'training_exclusions',
            new TableUnique({
                name: 'UQ_training_exclusions_training_employee',
                columnNames: ['training_id', 'employee_id'],
            }),
        );

        await queryRunner.createForeignKey(
            'training_exclusions',
            new TableForeignKey({
                columnNames: ['training_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'trainings',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'training_exclusions',
            new TableForeignKey({
                columnNames: ['employee_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('training_exclusions');
        if (table) {
            for (const fk of table.foreignKeys) {
                await queryRunner.dropForeignKey('training_exclusions', fk);
            }
        }
        await queryRunner.dropUniqueConstraint(
            'training_exclusions',
            'UQ_training_exclusions_training_employee',
        );
        await queryRunner.dropTable('training_exclusions');
    }
}
