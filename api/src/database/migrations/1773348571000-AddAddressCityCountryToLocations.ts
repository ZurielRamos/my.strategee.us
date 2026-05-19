import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAddressCityCountryToLocations1773348571000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'locations',
            new TableColumn({
                name: 'address',
                type: 'text',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'locations',
            new TableColumn({
                name: 'city',
                type: 'varchar',
                length: '100',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'locations',
            new TableColumn({
                name: 'country',
                type: 'varchar',
                length: '100',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('locations', 'country');
        await queryRunner.dropColumn('locations', 'city');
        await queryRunner.dropColumn('locations', 'address');
    }
}
