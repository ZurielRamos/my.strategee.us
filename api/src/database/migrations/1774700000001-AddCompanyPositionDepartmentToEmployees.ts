import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCompanyPositionDepartmentToEmployees1774700000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('employees', [
            new TableColumn({ name: 'company_id', type: 'varchar', length: '36', isNullable: true }),
            new TableColumn({ name: 'position_id', type: 'varchar', length: '36', isNullable: true }),
            new TableColumn({ name: 'department_id', type: 'varchar', length: '36', isNullable: true }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('employees', 'department_id');
        await queryRunner.dropColumn('employees', 'position_id');
        await queryRunner.dropColumn('employees', 'company_id');
    }
}
