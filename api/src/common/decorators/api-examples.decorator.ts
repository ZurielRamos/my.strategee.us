import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ExampleObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

// Un tipo simple para que el autocompletado te ayude al crear ejemplos
export type SwaggerExamplesMap = Record<string, ExampleObject>;

export const ApiExamplesResponse = <TModel extends Type<any>>(
    status: number,
    model: TModel, // El DTO que define la estructura
    examples: SwaggerExamplesMap, // Tu objeto con los casos de uso
    options?: {
        description?: string;
        isArray?: boolean; // Por si devuelve un array de objetos
    }
) => {
    return applyDecorators(
        ApiExtraModels(model), // Importante para que getSchemaPath funcione
        ApiResponse({
            status,
            description: options?.description,
            content: {
                'application/json': {
                    schema: options?.isArray
                        ? { type: 'array', items: { $ref: getSchemaPath(model) } }
                        : { $ref: getSchemaPath(model) },
                    examples: examples,
                },
            },
        }),
    );
};