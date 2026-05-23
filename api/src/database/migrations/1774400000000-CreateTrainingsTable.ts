import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTrainingsTable1774400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'trainings',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: 'UUID()',
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '200',
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'starts_at',
                        type: 'datetime',
                        isNullable: false,
                    },
                    {
                        name: 'ends_at',
                        type: 'datetime',
                        isNullable: false,
                    },
                    {
                        name: 'is_mandatory',
                        type: 'tinyint',
                        width: 1,
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['draft', 'active', 'expired'],
                        default: "'draft'",
                        isNullable: false,
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('trainings');
    }
}
