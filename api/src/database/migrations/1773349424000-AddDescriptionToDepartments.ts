import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDescriptionToDepartments1773349424000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('departments', new TableColumn({
            name: 'description',
            type: 'text',
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('departments', 'description');
    }
}
