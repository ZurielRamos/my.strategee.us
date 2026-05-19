import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSystemSettingsTable1773262247000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'system_settings',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'vacationDaysLaborContract',
                        type: 'int',
                        default: 15,
                        comment: 'Días de vacaciones para contrato laboral',
                    },
                    {
                        name: 'vacationDaysServiceContract',
                        type: 'int',
                        default: 15,
                        comment: 'Días de vacaciones para contrato de prestación de servicios',
                    },
                    {
                        name: 'hoursPerWorkday',
                        type: 'decimal',
                        precision: 4,
                        scale: 2,
                        default: 8,
                        comment: 'Horas en un día laboral',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Insertar registro inicial con valores por defecto
        await queryRunner.query(`
            INSERT INTO system_settings (vacationDaysLaborContract, vacationDaysServiceContract, hoursPerWorkday)
            VALUES (15, 15, 8)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('system_settings');
    }
}
