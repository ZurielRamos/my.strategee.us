import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailTemplates } from './enums/email-templates.enum';

// Define la interfaz de variables que usará la plantilla
interface UserVariables {
    name: string;
    email: string;
    temporaryPassword?: string;
}

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    /**
     * Envía un correo de bienvenida a un nuevo usuario o empleado.
     * @param recipient Correo del destinatario.
     * @param subject Asunto del correo.
     * @param templateName Nombre del archivo HBS (sin .hbs).
     * @param context Variables a pasar a la plantilla.
     */
    async sendWelcome(recipient: string, subject: string, templateName: EmailTemplates, context: UserVariables) {

        // El método sendMail inyecta las variables del 'context' en la plantilla definida
        await this.mailerService.sendMail({
            to: recipient,
            subject: subject,
            template: templateName, // 'welcome' mapea a mail/templates/welcome.hbs
            context: {
                ...context
            },
        });
    }



    /**
     * Envía el correo con el enlace de restablecimiento de contraseña.
     * @param recipient Correo del destinatario.
     * @param resetToken Token de reset sin hashear
     * @param userName Nombre del usuario
     */
    async sendPasswordReset(
        recipient: string,
        resetToken: string,
        userName: string,
    ): Promise<void> {
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL;
        const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;
        const subject = 'Solicitud de Restablecimiento de Contraseña';

        await this.mailerService.sendMail({
            to: recipient,
            subject: subject,
            template: EmailTemplates.PASSWORD_RESET,
            context: {
                userName,
                resetLink,
                expiresIn: '1 hora',
            },

        });
    }

    /**
     * Envía email de bienvenida con enlace para configurar contraseña por primera vez
     * @param recipient Correo del destinatario
     * @param employeeName Nombre del empleado
     * @param setupToken Token de configuración sin hashear
     */
    async sendWelcomeWithPasswordSetup(
        recipient: string,
        employeeName: string,
        setupToken: string,
    ): Promise<void> {
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL;
        const setupLink = `${baseUrl}/auth/set-password?token=${setupToken}`;
        const subject = 'Bienvenido - Configura tu Contraseña';

        await this.mailerService.sendMail({
            to: recipient,
            subject: subject,
            template: EmailTemplates.WELCOME_PASSWORD_SETUP,
            context: {
                employeeName,
                setupLink,
                expiresIn: '24 horas',
            },
        });
    }

    /**
     * Envía un correo de notificación a un empleado
     */
    async sendNotification(
        recipient: string,
        employeeName: string,
        title: string,
        message: string,
        metadata?: Record<string, any>,
    ): Promise<void> {
        // Mapeo de tipos de solicitud a nombres legibles
        const requestTypeNames: Record<string, string> = {
            VACATION: 'Vacaciones',
            DOCUMENT: 'Documento',
            MEETING: 'Reunión con RRHH',
            BENEFIT: 'Beneficio',
            BIRTHDAY: 'Cumpleaños',
            ORDINARY_PERMISSION: 'Permiso Ordinario',
            SICK_LEAVE: 'Incapacidad Médica',
            MEDICAL_APPOINTMENT: 'Cita Médica',
            COMPENSATED_TIME_ACCUMULATION: 'Acumulación de Tiempo Compensado',
            COMPENSATED_TIME_USAGE: 'Uso de Tiempo Compensado',
            ENERGYZE_DAY_ACCUMULATION: 'Acumulación de Día Energyze',
            ENERGYZE_DAY_USAGE: 'Uso de Día Energyze',
            GIFTED_DAY_USAGE: 'Días Obsequiados por Servicios',
        };

        const statusLabels: Record<string, string> = {
            PENDING: 'Pendiente',
            APPROVED: 'Aprobada',
            REJECTED: 'Rechazada',
            CANCELLED: 'Cancelada',
        };

        const statusColors: Record<string, string> = {
            APPROVED: '#16a34a',
            REJECTED: '#dc2626',
            CANCELLED: '#d97706',
            PENDING: '#2563eb',
        };

        const requestDetails = metadata ? {
            requestId: metadata.requestId,
            requestType: requestTypeNames[metadata.requestType] || metadata.requestType,
            previousStatus: statusLabels[metadata.previousStatus] || metadata.previousStatus,
            newStatus: statusLabels[metadata.newStatus] || metadata.newStatus,
            newStatusColor: statusColors[metadata.newStatus] || '#2563eb',
            reviewerComment: metadata.reviewerComment || null,
            createdAt: metadata.createdAt
                ? new Date(metadata.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric',
                })
                : null,
            details: metadata.details ? this.formatDetails(metadata.details) : null,
        } : null;

        await this.mailerService.sendMail({
            to: recipient,
            subject: title,
            template: EmailTemplates.NOTIFICATION,
            context: { employeeName, title, message, requestDetails },
        });
    }

    /**
     * Convierte el objeto details de una solicitud en pares clave-valor legibles
     */
    private formatDetails(details: Record<string, any>): Array<{ label: string; value: string }> {
        const labelMap: Record<string, string> = {
            startDate: 'Fecha de inicio',
            endDate: 'Fecha de fin',
            date: 'Fecha',
            days: 'Días',
            hours: 'Horas',
            reason: 'Motivo',
            description: 'Descripción',
            documentType: 'Tipo de documento',
            meetingDate: 'Fecha de reunión',
            meetingTime: 'Hora de reunión',
            benefitType: 'Tipo de beneficio',
            appointmentDate: 'Fecha de cita',
            appointmentTime: 'Hora de cita',
            medicalCenter: 'Centro médico',
            diagnosis: 'Diagnóstico',
            accumulatedHours: 'Horas acumuladas',
            usedHours: 'Horas utilizadas',
            accumulatedDays: 'Días acumulados',
            usedDays: 'Días utilizados',
            notes: 'Notas',
        };

        return Object.entries(details)
            .filter(([, value]) => value !== null && value !== undefined && value !== '')
            .map(([key, value]) => ({
                label: labelMap[key] || key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            }));
    }
}