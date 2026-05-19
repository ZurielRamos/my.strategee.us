/**
 * Payload para enviar notificaciones push mediante FCM
 */
export interface PushNotificationPayload {
    notification: {
        title: string;
        body: string;
    };
    data: {
        notificationId: string;
        requestId?: string;
        type: string;
    };
}

/**
 * Respuesta del servicio FCM al enviar una notificación
 */
export interface FCMResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}
