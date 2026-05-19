import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonIcon,
    IonAccordionGroup,
    IonAccordion
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    helpCircleOutline,
    documentTextOutline,
    chatbubbleEllipsesOutline,
    mailOutline,
    callOutline,
    timeOutline,
    chevronDownOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQCategory {
    title: string;
    icon: string;
    items: FAQItem[];
}

@Component({
    selector: 'app-help',
    templateUrl: './help.page.html',
    styleUrls: ['./help.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonItem,
        IonLabel,
        IonIcon,
        IonAccordionGroup,
        IonAccordion,
        PageHeaderComponent
    ]
})
export class HelpPage {
    faqCategories: FAQCategory[] = [
        {
            title: 'Solicitudes',
            icon: 'document-text-outline',
            items: [
                {
                    question: '¿Cómo solicito vacaciones?',
                    answer: 'Ve a la sección de Solicitudes, haz clic en "Nueva Solicitud" y selecciona "Vacaciones". Completa el formulario con las fechas deseadas y envía tu solicitud. Tu supervisor recibirá una notificación para aprobarla.'
                },
                {
                    question: '¿Cuánto tiempo tarda en aprobarse una solicitud?',
                    answer: 'El tiempo de aprobación depende de tu supervisor. Generalmente, las solicitudes se revisan en un plazo de 24-48 horas hábiles. Recibirás una notificación cuando tu solicitud sea aprobada o rechazada.'
                },
                {
                    question: '¿Puedo cancelar una solicitud enviada?',
                    answer: 'Sí, puedes cancelar una solicitud que esté en estado "Pendiente". Ve a la sección de Solicitudes, busca tu solicitud y selecciona la opción de cancelar. Las solicitudes aprobadas o rechazadas no pueden ser canceladas.'
                },
                {
                    question: '¿Cómo veo el historial de mis solicitudes?',
                    answer: 'En la sección de Solicitudes encontrarás todas tus solicitudes organizadas por estado: Pendientes, Aprobadas y Rechazadas. Puedes filtrar por tipo de solicitud y fecha para encontrar lo que buscas.'
                }
            ]
        },
        {
            title: 'Perfil y Cuenta',
            icon: 'person-outline',
            items: [
                {
                    question: '¿Cómo actualizo mi información personal?',
                    answer: 'Ve a tu Perfil desde el menú de usuario. Allí podrás ver tu información personal. Para actualizar datos sensibles como dirección o información de contacto, contacta al departamento de Recursos Humanos.'
                },
                {
                    question: '¿Cómo cambio mi contraseña?',
                    answer: 'Ve a Ajustes > Cuenta y Seguridad > Cambiar Contraseña. Necesitarás ingresar tu contraseña actual y la nueva contraseña dos veces para confirmar el cambio.'
                },
                {
                    question: '¿Cómo actualizo mi foto de perfil?',
                    answer: 'Ve a tu Perfil y haz clic en el ícono de la cámara sobre tu foto actual. Puedes subir una nueva imagen desde tu dispositivo. La foto debe ser en formato JPG o PNG.'
                },
                {
                    question: '¿Cómo cierro sesión en otros dispositivos?',
                    answer: 'Ve a Ajustes > Cuenta y Seguridad > Sesiones Iniciadas. Allí verás todos los dispositivos donde has iniciado sesión y podrás cerrar sesiones individuales o todas a la vez.'
                }
            ]
        },
        {
            title: 'Beneficios',
            icon: 'gift-outline',
            items: [
                {
                    question: '¿Qué beneficios tengo disponibles?',
                    answer: 'Puedes ver todos tus beneficios disponibles en la sección de Solicitudes > Nueva Solicitud. Allí encontrarás beneficios como días de home office, sábados remotos, sábados energyze, entre otros, con sus respectivas cuotas mensuales.'
                },
                {
                    question: '¿Cómo se renuevan mis beneficios?',
                    answer: 'Los beneficios con cuota mensual se renuevan automáticamente el primer día de cada mes. Los días no utilizados no se acumulan para el siguiente mes.'
                },
                {
                    question: '¿Puedo solicitar más días de los disponibles?',
                    answer: 'No, solo puedes solicitar hasta el límite de tu cuota mensual disponible. Si necesitas días adicionales, contacta a tu supervisor o al departamento de Recursos Humanos.'
                }
            ]
        },
        {
            title: 'Notificaciones',
            icon: 'notifications-outline',
            items: [
                {
                    question: '¿Cómo activo las notificaciones?',
                    answer: 'Ve a Ajustes > Notificaciones y activa las opciones que desees. Puedes recibir notificaciones push en la aplicación y/o notificaciones por correo electrónico.'
                },
                {
                    question: '¿Qué tipo de notificaciones recibiré?',
                    answer: 'Recibirás notificaciones sobre el estado de tus solicitudes (aprobadas, rechazadas), recordatorios importantes, actualizaciones de beneficios y comunicados de la empresa.'
                },
                {
                    question: '¿Puedo desactivar las notificaciones?',
                    answer: 'Sí, puedes desactivar las notificaciones en cualquier momento desde Ajustes > Notificaciones. Puedes elegir desactivar solo las notificaciones push o solo las de correo electrónico.'
                }
            ]
        }
    ];

    constructor() {
        addIcons({
            helpCircleOutline,
            documentTextOutline,
            chatbubbleEllipsesOutline,
            mailOutline,
            callOutline,
            timeOutline,
            chevronDownOutline
        });
    }
}
