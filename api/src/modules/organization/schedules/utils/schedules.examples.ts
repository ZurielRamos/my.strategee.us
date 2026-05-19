export const ScheduleConflictExamples = {
    "example1": {
        summary: "Conflicto: Mismo nombre",
        value: {
            "message": "Ya existe otro horario con este nombre",
            "error": "Conflict",
            "statusCode": 409
        }
    }
}

export const ScheduleNotFoundExamples = {
    "example1": {
        summary: "No encontrado",
        value: {
            "message": "Horario no encontrado",
            "error": "Not Found",
            "statusCode": 404
        }
    }
}

export const ScheduleCreatedExamples = {
    "example1": {
        summary: "Creado exitosamente",
        value: {
            "name": "Regular",
            "description": "Horario para personal regular",
            "dailySchedules": [
                {
                    "day": "Lunes",
                    "isWorkDay": true,
                    "entryTime": "07:40:00",
                    "exitTime": "17:40:00",
                    "lunchStart": "12:40:00",
                    "lunchEnd": "13:40:00"
                },
                {
                    "day": "Martes",
                    "isWorkDay": true,
                    "entryTime": "07:40:00",
                    "exitTime": "17:40:00",
                    "lunchStart": "12:40:00",
                    "lunchEnd": "13:40:00"
                },
                {
                    "day": "Miercoles",
                    "isWorkDay": true,
                    "entryTime": "07:40:00",
                    "exitTime": "17:40:00",
                    "lunchStart": "12:40:00",
                    "lunchEnd": "13:40:00"
                },
                {
                    "day": "Jueves",
                    "isWorkDay": true,
                    "entryTime": "07:40:00",
                    "exitTime": "17:40:00",
                    "lunchStart": "12:40:00",
                    "lunchEnd": "13:40:00"
                },
                {
                    "day": "Viernes",
                    "isWorkDay": true,
                    "entryTime": "07:40:00",
                    "exitTime": "17:40:00",
                    "lunchStart": "12:40:00",
                    "lunchEnd": "13:40:00"
                },
                {
                    "day": "Sabado",
                    "isWorkDay": true,
                    "entryTime": "08:30:00",
                    "exitTime": "12:00:00"
                },
                {
                    "day": "Domingo",
                    "isWorkDay": false
                }
            ]
        }
    }
}