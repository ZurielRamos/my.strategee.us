import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeCredentialFieldsOptional1773900200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make title NOT NULL (it's now the only required field)
        await queryRunner.changeColumn('credentials', 'title', new TableColumn({
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
        }));

        // Make url nullable
        await queryRunner.changeColumn('credentials', 'url', new TableColumn({
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: true,
        }));

        // Make encryptedUsername nullable
        await queryRunner.changeColumn('credentials', 'encryptedUsername', new TableColumn({
            name: 'encryptedUsername',
            type: 'text',
            isNullable: true,
        }));

        // Make encryptedPassword nullable
        await queryRunner.changeColumn('credentials', 'encryptedPassword', new TableColumn({
            name: 'encryptedPassword',
            type: 'text',
            isNullable: true,
        }));

        // Set default for visibilityLevel
        await queryRunner.changeColumn('credentials', 'visibilityLevel', new TableColumn({
            name: 'visibilityLevel',
            type: 'enum',
            enum: ['private', 'public', 'by_company', 'by_area', 'by_position', 'by_employee_list'],
            isNullable: false,
            default: "'private'",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert title to nullable
        await queryRunner.changeColumn('credentials', 'title', new TableColumn({
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: true,
        }));

        // Revert url to NOT NULL
        await queryRunner.changeColumn('credentials', 'url', new TableColumn({
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: false,
        }));

        // Revert encryptedUsername to NOT NULL
        await queryRunner.changeColumn('credentials', 'encryptedUsername', new TableColumn({
            name: 'encryptedUsername',
            type: 'text',
            isNullable: false,
        }));

        // Revert encryptedPassword to NOT NULL
        await queryRunner.changeColumn('credentials', 'encryptedPassword', new TableColumn({
            name: 'encryptedPassword',
            type: 'text',
            isNullable: false,
        }));

        // Remove default from visibilityLevel
        await queryRunner.changeColumn('credentials', 'visibilityLevel', new TableColumn({
            name: 'visibilityLevel',
            type: 'enum',
            enum: ['private', 'public', 'by_company', 'by_area', 'by_position', 'by_employee_list'],
            isNullable: false,
        }));
    }
}
