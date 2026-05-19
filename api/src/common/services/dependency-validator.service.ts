import { Injectable } from '@nestjs/common';
import { DataSource, EntityMetadata, Repository } from 'typeorm';

export interface EntityDependency {
    entity: string;
    count: number;
    examples?: string[];
}

export interface DependencyValidationResult {
    hasDependencies: boolean;
    dependencies: EntityDependency[];
}

/**
 * Service for validating entity dependencies before deletion
 */
@Injectable()
export class DependencyValidatorService {
    constructor(private readonly dataSource: DataSource) { }

    /**
     * Validates if an entity can be safely deleted
     * @param entityClass The entity class to check
     * @param entityId The ID of the entity to delete
     * @returns Validation result with dependency details
     */
    async validateDeletion(
        entityClass: new () => any,
        entityId: string,
    ): Promise<DependencyValidationResult> {
        const metadata = this.dataSource.getMetadata(entityClass);
        const dependencies: EntityDependency[] = [];

        // Find all relations where this entity is referenced
        const allMetadata = this.dataSource.entityMetadatas;

        for (const relatedMetadata of allMetadata) {
            // Skip self-references
            if (relatedMetadata.target === entityClass) {
                continue;
            }

            // Check each relation in the related entity
            for (const relation of relatedMetadata.relations) {
                if (relation.type === metadata.target) {
                    // This entity is referenced by the related entity
                    const count = await this.countRelatedRecords(
                        relatedMetadata,
                        relation.propertyName,
                        entityId,
                    );

                    if (count > 0) {
                        const examples = await this.getExamples(
                            relatedMetadata,
                            relation.propertyName,
                            entityId,
                        );

                        dependencies.push({
                            entity: relatedMetadata.tableName,
                            count,
                            examples,
                        });
                    }
                }
            }
        }

        return {
            hasDependencies: dependencies.length > 0,
            dependencies,
        };
    }

    /**
     * Counts related records
     */
    private async countRelatedRecords(
        metadata: EntityMetadata,
        relationProperty: string,
        entityId: string,
    ): Promise<number> {
        const repository = this.dataSource.getRepository(metadata.target);

        // Find the foreign key column name
        const relation = metadata.relations.find(r => r.propertyName === relationProperty);
        if (!relation) return 0;

        const foreignKeyColumn = relation.joinColumns[0]?.databaseName || `${relationProperty}Id`;

        try {
            return await repository.count({
                where: { [foreignKeyColumn]: entityId } as any,
            });
        } catch (error) {
            // If the relation doesn't exist or has a different structure, return 0
            return 0;
        }
    }

    /**
     * Gets examples of related records (first 3)
     */
    private async getExamples(
        metadata: EntityMetadata,
        relationProperty: string,
        entityId: string,
    ): Promise<string[]> {
        const repository = this.dataSource.getRepository(metadata.target);

        const relation = metadata.relations.find(r => r.propertyName === relationProperty);
        if (!relation) return [];

        const foreignKeyColumn = relation.joinColumns[0]?.databaseName || `${relationProperty}Id`;

        try {
            const records = await repository.find({
                where: { [foreignKeyColumn]: entityId } as any,
                take: 3,
            });

            // Try to extract a meaningful identifier (name, title, or id)
            return records.map((record: any) =>
                record.name || record.title || record.id || 'Unknown'
            );
        } catch (error) {
            return [];
        }
    }
}
