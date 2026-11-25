import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTermsAcceptanceToEmployees1774700000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('employees', [
            new TableColumn({ name: 'terms_accepted_at', type: 'datetime', isNullable: true }),
            new TableColumn({ name: 'terms_version', type: 'varchar', length: '20', isNullable: true }),
            new TableColumn({ name: 'terms_accepted_ip', type: 'varchar', length: '45', isNullable: true }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('employees', 'terms_accepted_ip');
        await queryRunner.dropColumn('employees', 'terms_version');
        await queryRunner.dropColumn('employees', 'terms_accepted_at');
    }
}
