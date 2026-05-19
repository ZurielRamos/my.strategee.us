import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePasswordVaultTables1773800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create vaults table
        await queryRunner.createTable(
            new Table({
                name: 'vaults',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'ownerId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create index on ownerId for vaults
        await queryRunner.createIndex(
            'vaults',
            new TableIndex({
                name: 'IDX_vaults_ownerId',
                columnNames: ['ownerId'],
            }),
        );

        // Create foreign key for vaults.ownerId -> employees.id
        await queryRunner.createForeignKey(
            'vaults',
            new TableForeignKey({
                columnNames: ['ownerId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );

        // Create credentials table
        await queryRunner.createTable(
            new Table({
                name: 'credentials',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '200',
                        isNullable: true,
                    },
                    {
                        name: 'url',
                        type: 'varchar',
                        length: '500',
                        isNullable: false,
                    },
                    {
                        name: 'encryptedUsername',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'encryptedPassword',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'directLoginUrl',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'logoId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'visibilityLevel',
                        type: 'enum',
                        enum: ['private', 'public', 'by_company', 'by_area', 'by_position', 'by_employee_list'],
                        isNullable: false,
                    },
                    {
                        name: 'ownerId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'vaultId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create indexes for credentials
        await queryRunner.createIndex(
            'credentials',
            new TableIndex({
                name: 'IDX_credentials_ownerId',
                columnNames: ['ownerId'],
            }),
        );

        await queryRunner.createIndex(
            'credentials',
            new TableIndex({
                name: 'IDX_credentials_vaultId',
                columnNames: ['vaultId'],
            }),
        );

        await queryRunner.createIndex(
            'credentials',
            new TableIndex({
                name: 'IDX_credentials_visibilityLevel',
                columnNames: ['visibilityLevel'],
            }),
        );

        // Create foreign keys for credentials
        await queryRunner.createForeignKey(
            'credentials',
            new TableForeignKey({
                columnNames: ['ownerId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'credentials',
            new TableForeignKey({
                columnNames: ['vaultId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'vaults',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'credentials',
            new TableForeignKey({
                columnNames: ['logoId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'attachments',
                onDelete: 'SET NULL',
            }),
        );

        // Create credential_visibility_companies table
        await queryRunner.createTable(
            new Table({
                name: 'credential_visibility_companies',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'credentialId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'companyId',
                        type: 'uuid',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Create composite index for credential_visibility_companies
        await queryRunner.createIndex(
            'credential_visibility_companies',
            new TableIndex({
                name: 'IDX_credential_visibility_companies_composite',
                columnNames: ['credentialId', 'companyId'],
            }),
        );

        // Create foreign keys for credential_visibility_companies
        await queryRunner.createForeignKey(
            'credential_visibility_companies',
            new TableForeignKey({
                columnNames: ['credentialId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'credentials',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'credential_visibility_companies',
            new TableForeignKey({
                columnNames: ['companyId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        // Create credential_visibility_areas table
        await queryRunner.createTable(
            new Table({
                name: 'credential_visibility_areas',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'credentialId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'areaId',
                        type: 'uuid',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Create composite index for credential_visibility_areas
        await queryRunner.createIndex(
            'credential_visibility_areas',
            new TableIndex({
                name: 'IDX_credential_visibility_areas_composite',
                columnNames: ['credentialId', 'areaId'],
            }),
        );

        // Create foreign keys for credential_visibility_areas
        await queryRunner.createForeignKey(
            'credential_visibility_areas',
            new TableForeignKey({
                columnNames: ['credentialId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'credentials',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'credential_visibility_areas',
            new TableForeignKey({
                columnNames: ['areaId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'areas',
                onDelete: 'CASCADE',
            }),
        );

        // Create credential_visibility_positions table
        await queryRunner.createTable(
            new Table({
                name: 'credential_visibility_positions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'credentialId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'positionId',
                        type: 'uuid',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Create composite index for credential_visibility_positions
        await queryRunner.createIndex(
            'credential_visibility_positions',
            new TableIndex({
                name: 'IDX_credential_visibility_positions_composite',
                columnNames: ['credentialId', 'positionId'],
            }),
        );

        // Create foreign keys for credential_visibility_positions
        await queryRunner.createForeignKey(
            'credential_visibility_positions',
            new TableForeignKey({
                columnNames: ['credentialId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'credentials',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'credential_visibility_positions',
            new TableForeignKey({
                columnNames: ['positionId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'positions',
                onDelete: 'CASCADE',
            }),
        );

        // Create credential_visibility_employees table
        await queryRunner.createTable(
            new Table({
                name: 'credential_visibility_employees',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'credentialId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'employeeId',
                        type: 'uuid',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Create composite index for credential_visibility_employees
        await queryRunner.createIndex(
            'credential_visibility_employees',
            new TableIndex({
                name: 'IDX_credential_visibility_employees_composite',
                columnNames: ['credentialId', 'employeeId'],
            }),
        );

        // Create foreign keys for credential_visibility_employees
        await queryRunner.createForeignKey(
            'credential_visibility_employees',
            new TableForeignKey({
                columnNames: ['credentialId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'credentials',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'credential_visibility_employees',
            new TableForeignKey({
                columnNames: ['employeeId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );

        // Create credential_access_logs table
        await queryRunner.createTable(
            new Table({
                name: 'credential_access_logs',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'credentialId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'employeeId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'accessedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create indexes for credential_access_logs
        await queryRunner.createIndex(
            'credential_access_logs',
            new TableIndex({
                name: 'IDX_credential_access_logs_credentialId',
                columnNames: ['credentialId'],
            }),
        );

        await queryRunner.createIndex(
            'credential_access_logs',
            new TableIndex({
                name: 'IDX_credential_access_logs_employeeId',
                columnNames: ['employeeId'],
            }),
        );

        // Create foreign keys for credential_access_logs
        await queryRunner.createForeignKey(
            'credential_access_logs',
            new TableForeignKey({
                columnNames: ['credentialId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'credentials',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'credential_access_logs',
            new TableForeignKey({
                columnNames: ['employeeId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'employees',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to respect foreign key constraints
        await queryRunner.dropTable('credential_access_logs');
        await queryRunner.dropTable('credential_visibility_employees');
        await queryRunner.dropTable('credential_visibility_positions');
        await queryRunner.dropTable('credential_visibility_areas');
        await queryRunner.dropTable('credential_visibility_companies');
        await queryRunner.dropTable('credentials');
        await queryRunner.dropTable('vaults');
    }
}
