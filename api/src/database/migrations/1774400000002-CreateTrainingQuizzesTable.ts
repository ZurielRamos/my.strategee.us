import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTrainingQuizzesTable1774400000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // training_quizzes
        await queryRunner.createTable(
            new Table({
                name: 'training_quizzes',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: 'UUID()',
                    },
                    {
                        name: 'material_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'passing_score',
                        type: 'int',
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

        await queryRunner.createForeignKey(
            'training_quizzes',
            new TableForeignKey({
                columnNames: ['material_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'training_materials',
                onDelete: 'CASCADE',
            }),
        );

        // training_quiz_questions
        await queryRunner.createTable(
            new Table({
                name: 'training_quiz_questions',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: 'UUID()',
                    },
                    {
                        name: 'quiz_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'text',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'score',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'order_index',
                        type: 'int',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'training_quiz_questions',
            new TableForeignKey({
                columnNames: ['quiz_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'training_quizzes',
                onDelete: 'CASCADE',
            }),
        );

        // training_quiz_options
        await queryRunner.createTable(
            new Table({
                name: 'training_quiz_options',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: 'UUID()',
                    },
                    {
                        name: 'question_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'text',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'is_correct',
                        type: 'tinyint',
                        width: 1,
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'order_index',
                        type: 'int',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'training_quiz_options',
            new TableForeignKey({
                columnNames: ['question_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'training_quiz_questions',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const optionsTable = await queryRunner.getTable('training_quiz_options');
        if (optionsTable) {
            for (const fk of optionsTable.foreignKeys) {
                await queryRunner.dropForeignKey('training_quiz_options', fk);
            }
        }
        await queryRunner.dropTable('training_quiz_options');

        const questionsTable = await queryRunner.getTable('training_quiz_questions');
        if (questionsTable) {
            for (const fk of questionsTable.foreignKeys) {
                await queryRunner.dropForeignKey('training_quiz_questions', fk);
            }
        }
        await queryRunner.dropTable('training_quiz_questions');

        const quizzesTable = await queryRunner.getTable('training_quizzes');
        if (quizzesTable) {
            for (const fk of quizzesTable.foreignKeys) {
                await queryRunner.dropForeignKey('training_quizzes', fk);
            }
        }
        await queryRunner.dropTable('training_quizzes');
    }
}
