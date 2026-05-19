import { ConflictException } from '@nestjs/common';

export interface EntityDependency {
    entity: string;
    count: number;
    examples?: string[];
}

/**
 * Exception thrown when attempting to delete an entity with active dependencies
 */
export class DependencyConflictException extends ConflictException {
    constructor(
        message: string,
        public readonly dependencies: EntityDependency[],
    ) {
        super({
            message,
            error: 'Conflict',
            dependencies,
        });
    }
}
