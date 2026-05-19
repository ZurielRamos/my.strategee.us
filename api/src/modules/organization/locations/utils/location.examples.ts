import { SwaggerExamplesMap } from "@common/decorators/api-examples.decorator";

export const LocationConflictExamples: SwaggerExamplesMap = {
    AlreadyNameExists: {
        summary: 'Ya existe una ubicación con este nombre',
        value: {
            "message": "Ya existe una ubicación con este nombre",
            "error": "Conflict",
            "statusCode": 409
        }
    }
}

export const LocationNotFoundExamples: SwaggerExamplesMap = {
    NotFound: {
        summary: 'Ubicación no encontrada',
        value: {
            "message": "Ubicación con ID 8a1f2996-909a-42af-a636-6b609952a5d no encontrada",
            "error": "Not Found",
            "statusCode": 404
        }
    }
}
