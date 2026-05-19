import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    DataSource,
    Repository
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<any> {
    constructor(
        dataSource: DataSource,
        private readonly cls: ClsService,
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
    ) {
        dataSource.subscribers.push(this);
    }

    /**
     * Skip logging for AuditLog entity itself to avoid infinite loops
     */
    private shouldSkip(entity: any, metadata: any): boolean {
        return entity instanceof AuditLog || metadata.tableName === 'audit_logs';
    }

    async afterInsert(event: InsertEvent<any>) {
        if (this.shouldSkip(event.entity, event.metadata)) return;

        const user = this.cls.get('user');
        const userId = user ? user['sub'] : null;

        try {
            const auditLog = this.auditLogRepository.create({
                entityName: event.metadata.tableName,
                entityId: event.entity.id,
                action: 'create',
                userId: userId,
                changes: event.entity,
            });

            await this.auditLogRepository.save(auditLog);
        } catch (error) {
            console.error('Error saving audit log (insert):', error);
        }
    }

    async afterUpdate(event: UpdateEvent<any>) {
        if (this.shouldSkip(event.entity, event.metadata)) return;

        const user = this.cls.get('user');
        const userId = user ? user['sub'] : null;

        const entity = event.entity;
        if (!entity) return;

        try {
            // Calculate changes
            const changes: Record<string, any> = {};

            // Only specific columns changed
            if (event.updatedColumns.length > 0) {
                event.updatedColumns.forEach((column) => {
                    const propName = column.propertyName;
                    const oldValue = event.databaseEntity[propName];
                    const newValue = entity[propName];

                    // Simple check for value update
                    if (oldValue !== newValue) {
                        changes[propName] = {
                            from: oldValue,
                            to: newValue,
                        };
                    }
                });
            } else {
                // Fallback if updatedColumns is empty but event triggered (e.g. save)
                changes['full_update'] = entity;
            }

            if (Object.keys(changes).length > 0) {
                const auditLog = this.auditLogRepository.create({
                    entityName: event.metadata.tableName,
                    entityId: entity.id || (event.databaseEntity ? event.databaseEntity.id : 'unknown'),
                    action: 'update',
                    userId: userId,
                    changes: changes,
                });

                await this.auditLogRepository.save(auditLog);
            }
        } catch (error) {
            console.error('Error saving audit log (update):', error);
        }
    }

    async afterRemove(event: RemoveEvent<any>) {
        if (this.shouldSkip(event.entity, event.metadata)) return;

        const user = this.cls.get('user');
        const userId = user ? user['sub'] : null;

        try {
            // For remove, event.entityId might be available, or event.databaseEntity
            const entityId = event.entityId || (event.databaseEntity ? event.databaseEntity.id : 'unknown');

            const auditLog = this.auditLogRepository.create({
                entityName: event.metadata.tableName,
                entityId: entityId,
                action: 'delete',
                userId: userId,
                changes: event.databaseEntity,
            });

            await this.auditLogRepository.save(auditLog);
        } catch (error) {
            console.error('Error saving audit log (remove):', error);
        }
    }
}
