import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddParentIdToVaults1773900000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add parent_id column to vaults table for nested folders
        await queryRunner.addColumn(
            'vaults',
            new TableColumn({
                name: 'parent_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        // Create index on parent_id for efficient tree queries
        await queryRunner.createIndex(
            'vaults',
            new TableIndex({
                name: 'IDX_vaults_parent_id',
                columnNames: ['parent_id'],
            }),
        );

        // Create foreign key for self-referencing relationship
        await queryRunner.createForeignKey(
            'vaults',
            new TableForeignKey({
                name: 'FK_vaults_parent_id',
                columnNames: ['parent_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'vaults',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('vaults', 'FK_vaults_parent_id');
        await queryRunner.dropIndex('vaults', 'IDX_vaults_parent_id');
        await queryRunner.dropColumn('vaults', 'parent_id');
    }
}
