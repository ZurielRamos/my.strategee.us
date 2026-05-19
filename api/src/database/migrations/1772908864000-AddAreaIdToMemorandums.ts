import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddAreaIdToMemorandums1772908864000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columna departmentId
        await queryRunner.addColumn(
            'memorandums',
            new TableColumn({
                name: 'department_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        // Agregar foreign key (sin constraint para permitir flexibilidad)
        // Si deseas agregar la constraint, descomenta las siguientes líneas:
        /*
        await queryRunner.createForeignKey(
            'memorandums',
            new TableForeignKey({
                columnNames: ['department_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'departments',
                onDelete: 'SET NULL',
            }),
        );
        */
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar foreign key si fue creada
        /*
        const table = await queryRunner.getTable('memorandums');
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('department_id') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('memorandums', foreignKey);
        }
        */

        // Eliminar columna
        await queryRunner.dropColumn('memorandums', 'department_id');
    }
}
