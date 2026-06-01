import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddVaultVisibilityTables1773900100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add visibility_level column to vaults table
        await queryRunner.addColumn(
            'vaults',
            new TableColumn({
                name: 'visibility_level',
                type: 'enum',
                enum: ['private', 'public', 'by_company', 'by_area', 'by_position', 'by_employee_list'],
                default: "'private'",
                isNullable: false,
            }),
        );

        // Create vault_visibility_companies table
        await queryRunner.createTable(
            new Table({
                name: 'vault_visibility_companies',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'vault_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'vault_visibility_companies',
            new TableForeignKey({
                name: 'FK_vault_visibility_companies_vault',
                columnNames: ['vault_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'vaults',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'vault_visibility_companies',
            new TableForeignKey({
                name: 'FK_vault_visibility_companies_company',
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'vault_visibility_companies',
            new TableIndex({
                name: 'IDX_vault_visibility_companies_vault_id',
                columnNames: ['vault_id'],
            }),
        );

        // Create vault_visibility_areas table
        await queryRunner.createTable(
            new Table({
                name: 'vault_visibility_areas',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'vault_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'area_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'vault_visibility_areas',
            new TableForeignKey({
                name: 'FK_vault_visibility_areas_vault',
                columnNames: ['vault_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'vaults',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'vault_visibility_areas',
            new TableForeignKey({
                name: 'FK_vault_visibility_areas_area',
                columnNames: ['area_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'areas',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'vault_visibility_areas',
            new TableIndex({
                name: 'IDX_vault_visibility_areas_vault_id',
                columnNames: ['vault_id'],
            }),
        );

        // Create vault_visibility_positions table
        await queryRunner.createTable(
            new Table({
                name: 'vault_visibility_positions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'vault_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'position_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'vault_visibility_positions',
            new TableForeignKey({
                name: 'FK_vault_visibility_positions_vault',
                columnNames: ['vault_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'vaults',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'vault_visibility_positions',
            new TableForeignKey({
                name: 'FK_vault_visibility_positions_position',
                columnNames: ['position_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'positions',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'vault_visibility_positions',
            new TableIndex({
                name: 'IDX_vault_visibility_positions_vault_id',
                columnNames: ['vault_id'],
            }),
        );

        // Create vault_visibility_employees table
        await queryRunner.createTable(
            new Table({
                name: 'vault_visibility_employees',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'vault_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'employee_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'vault_visibility_employees',
            new TableForeignKey({
                name: 'FK_vault_visibility_employees_vault',
                columnNames: ['vault_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'vaults',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'vault_visibility_employees',
            new TableForeignKey({
                name: 'FK_vault_visibility_employees_employee',
                columnNames: ['employee_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'vault_visibility_employees',
            new TableIndex({
                name: 'IDX_vault_visibility_employees_vault_id',
                columnNames: ['vault_id'],
            }),
        );

        await queryRunner.createIndex(
            'vault_visibility_employees',
            new TableIndex({
                name: 'IDX_vault_visibility_employees_employee_id',
                columnNames: ['employee_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('vault_visibility_employees');
        await queryRunner.dropTable('vault_visibility_positions');
        await queryRunner.dropTable('vault_visibility_areas');
        await queryRunner.dropTable('vault_visibility_companies');
        await queryRunner.dropColumn('vaults', 'visibility_level');
    }
}
