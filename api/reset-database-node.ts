import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

async function resetDatabase() {
    const connection = await mysql.createConnection({
        host: '64.225.35.43',
        port: 3306,
        user: 'tech',
        password: '7VDhO87JEpzaM79b',
        database: 'my_strategee',
        multipleStatements: true,
    });

    try {
        console.log('🔗 Conectando a la base de datos...');

        // Leer el archivo SQL
        const sqlScript = fs.readFileSync(
            path.join(__dirname, 'reset-database.sql'),
            'utf-8'
        );

        console.log('🗑️  Eliminando tablas existentes...');

        // Ejecutar el script
        await connection.query(sqlScript);

        console.log('✅ Base de datos reiniciada exitosamente!');
        console.log('📝 Ahora puedes ejecutar: npm run start:dev');

    } catch (error) {
        console.error('❌ Error al reiniciar la base de datos:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

resetDatabase();
