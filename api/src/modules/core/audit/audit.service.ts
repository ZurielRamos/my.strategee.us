import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { User } from '@modules/iam/users/entities/user.entity';

export interface AuditLogWithUser extends AuditLog {
    userName?: string;
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findByEntity(entityName: string, entityId: string): Promise<AuditLogWithUser[]> {
        // Primero obtenemos los logs de auditoría
        const logs = await this.auditLogRepository.find({
            where: {
                entityName,
                entityId,
            },
            order: {
                createdAt: 'DESC',
            },
        });

        console.log('Audit logs found:', logs.length);

        // Luego obtenemos los IDs únicos de usuarios
        const userIds = [...new Set(logs.map(log => log.userId).filter(id => id))];
        console.log('Unique user IDs:', userIds);

        // Obtenemos los usuarios con sus empleados
        const users = await this.userRepository.find({
            where: userIds.map(id => ({ id })),
            relations: ['employee'],
        });

        console.log('Users found:', users.length);

        // Creamos un mapa de userId -> nombre completo del empleado
        const userMap = new Map(
            users
                .filter(user => user.employee)
                .map(user => [
                    user.id, 
                    `${user.employee!.firstName} ${user.employee!.lastName}`
                ])
        );

        console.log('User map:', userMap);

        // Mapeamos los logs con los nombres de usuario
        return logs.map(log => ({
            ...log,
            userName: log.userId ? userMap.get(log.userId) || undefined : undefined
        }));
    }
}
