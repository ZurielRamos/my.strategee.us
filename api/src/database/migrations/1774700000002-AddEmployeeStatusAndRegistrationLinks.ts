import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class AddEmployeeStatusAndRegistrationLinks1774700000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'employees',
            new TableColumn({ name: 'status', type: 'varchar', length: '20', default: "'ACTIVE'", isNullable: false }),
        );

        await queryRunner.createTable(
            new Table({
                name: 'employee_registration_links',
                columns: [
                    { name: 'id', type: 'varchar', length: '36', isPrimary: true, default: 'UUID()' },
                    { name: 'token', type: 'varchar', length: '64', isNullable: false, isUnique: true },
                    { name: 'is_active', type: 'boolean', default: true },
                    { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('employee_registration_links');
        await queryRunner.dropColumn('employees', 'status');
    }
}
