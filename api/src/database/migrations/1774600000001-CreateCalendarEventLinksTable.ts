import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateCalendarEventLinksTable1774600000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'calendar_event_links',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: 'UUID()',
                    },
                    {
                        name: 'user_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'google_event_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'minute_id',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        precision: 6,
                        default: 'CURRENT_TIMESTAMP(6)',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createUniqueConstraint(
            'calendar_event_links',
            new TableUnique({
                name: 'UQ_calendar_event_links_user_event',
                columnNames: ['user_id', 'google_event_id'],
            }),
        );

        await queryRunner.createForeignKey(
            'calendar_event_links',
            new TableForeignKey({
                name: 'FK_calendar_event_links_user',
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('calendar_event_links', true, true);
    }
}
