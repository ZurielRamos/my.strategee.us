import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddHireDateAndContractTypeToEmployees1774700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('employees', [
            new TableColumn({ name: 'hire_date', type: 'date', isNullable: true }),
            new TableColumn({
                name: 'contract_type',
                type: 'enum',
                enum: [
                    'Término Indefinido',
                    'Término Fijo',
                    'Prestación de servicios superior a un mes',
                    'Prestación de servicios inferior a un mes',
                ],
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('employees', 'contract_type');
        await queryRunner.dropColumn('employees', 'hire_date');
    }
}
