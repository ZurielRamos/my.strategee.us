import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/iam/users/users.service';
import { Role } from './modules/iam/authorization/enums/role.enum';

async function createAdminUser() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    try {
        console.log('🔍 Verificando si existe el usuario administrador...');

        // Verificar si ya existe
        const existingAdmin = await usersService.findByEmail('admin@strategee.com');

        if (existingAdmin) {
            console.log('⚠️  El usuario administrador ya existe.');
            console.log('📧 Email: admin@strategee.com');
            console.log('🔑 Password: Admin123!');
            await app.close();
            return;
        }

        console.log('👤 Creando usuario administrador...');

        // Crear admin
        const admin = await usersService.create({
            email: 'admin@strategee.com',
            password: 'Admin123!',
            roles: [Role.ADMIN],
        });

        console.log('\n✅ Usuario administrador creado exitosamente!\n');
        console.log('═══════════════════════════════════════════');
        console.log('📧 Email:    admin@strategee.com');
        console.log('🔑 Password: Admin123!');
        console.log('👑 Rol:      ADMIN');
        console.log('🆔 ID:       ' + admin.id);
        console.log('═══════════════════════════════════════════\n');
        console.log('🚀 Puedes usar estas credenciales en:');
        console.log('   POST http://localhost:3000/api/v1/auth/sign-in\n');

    } catch (error) {
        console.error('❌ Error al crear usuario administrador:', error.message);
    } finally {
        await app.close();
    }
}

createAdminUser();
