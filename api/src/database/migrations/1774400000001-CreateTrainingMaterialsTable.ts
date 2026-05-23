import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTrainingMaterialsTable1774400000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'training_materials',
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
                        name: 'attachment_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '200',
                        isNullable: false,
                    },
                    {
                        name: 'order_index',
                        type: 'int',
                        isNullable: false,
                        default: 0,
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

        await queryRunner.createForeignKey(
            'training_materials',
            new TableForeignKey({
                columnNames: ['training_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'trainings',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('training_materials');
        if (table) {
            for (const foreignKey of table.foreignKeys) {
                await queryRunner.dropForeignKey('training_materials', foreignKey);
            }
        }
        await queryRunner.dropTable('training_materials');
    }
}
