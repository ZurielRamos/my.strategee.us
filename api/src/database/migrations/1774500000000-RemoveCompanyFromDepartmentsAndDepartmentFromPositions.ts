import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class RemoveCompanyFromDepartmentsAndDepartmentFromPositions1774500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key from departments -> companies
        const departmentsTable = await queryRunner.getTable('departments');
        const companyFk = departmentsTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('companyId') !== -1 || fk.columnNames.indexOf('company_id') !== -1
        );
        if (companyFk) {
            await queryRunner.dropForeignKey('departments', companyFk);
        }

        // Drop companyId column from departments
        const hasCompanyId = departmentsTable?.columns.find(c => c.name === 'companyId' || c.name === 'company_id');
        if (hasCompanyId) {
            await queryRunner.dropColumn('departments', hasCompanyId.name);
        }

        // Remove foreign key from positions -> departments
        const positionsTable = await queryRunner.getTable('positions');
        const departmentFk = positionsTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('departmentId') !== -1 || fk.columnNames.indexOf('department_id') !== -1
        );
        if (departmentFk) {
            await queryRunner.dropForeignKey('positions', departmentFk);
        }

        // Drop departmentId column from positions
        const hasDepartmentId = positionsTable?.columns.find(c => c.name === 'departmentId' || c.name === 'department_id');
        if (hasDepartmentId) {
            await queryRunner.dropColumn('positions', hasDepartmentId.name);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-add departmentId to positions
        await queryRunner.addColumn(
            'positions',
            new TableColumn({
                name: 'departmentId',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.createForeignKey(
            'positions',
            new TableForeignKey({
                columnNames: ['departmentId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'departments',
                onDelete: 'CASCADE',
            }),
        );

        // Re-add companyId to departments
        await queryRunner.addColumn(
            'departments',
            new TableColumn({
                name: 'companyId',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.createForeignKey(
            'departments',
            new TableForeignKey({
                columnNames: ['companyId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );
    }
}
