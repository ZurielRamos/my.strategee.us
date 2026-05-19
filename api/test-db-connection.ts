import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_SYNC === 'true',
    namingStrategy: new SnakeNamingStrategy(),
    entities: [],
});

AppDataSource.initialize()
    .then(() => {
        console.log('Data Source has been initialized!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error during Data Source initialization', err);
        process.exit(1);
    });
