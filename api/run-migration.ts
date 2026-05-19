import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import { register } from 'tsconfig-paths';

// Cargar variables de entorno
dotenv.config();

// Registrar path aliases
register({
    baseUrl: './',
    paths: {
        '@common/*': ['src/common/*'],
        '@config/*': ['src/config/*'],
        '@modules/*': ['src/modules/*'],
        '@administration/*': ['src/modules/administration/*'],
        '@finance/*': ['src/modules/finance/*'],
        '@iam/*': ['src/modules/iam/*'],
        '@infrastructure/*': ['src/modules/infrastructure/*'],
        '@workforce/*': ['src/modules/workforce/*'],
    },
});

const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!, 10) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*.ts'],
    namingStrategy: new SnakeNamingStrategy(),
});

async function runMigrations() {
    try {
        await AppDataSource.initialize();
        console.log('Data Source has been initialized!');
        
        await AppDataSource.runMigrations();
        console.log('Migrations have been executed successfully!');
        
        await AppDataSource.destroy();
        console.log('Data Source has been closed!');
    } catch (error) {
        console.error('Error during migration execution:', error);
        process.exit(1);
    }
}

runMigrations();
