import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTitleToAttachments1772823797300 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'attachments',
            new TableColumn({
                name: 'title',
                type: 'varchar',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('attachments', 'title');
    }
}
