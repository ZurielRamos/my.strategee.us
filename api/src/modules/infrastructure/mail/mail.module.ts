import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

// Definir la carpeta raíz de las plantillas de forma dinámica
const templateDir = join(
  // Si estamos en producción (o modo compilado), usamos 'dist'
  // Si estamos en desarrollo (ts-node), usamos 'src'
  process.cwd(),
  process.env.NODE_ENV === 'production' ? 'dist' : 'src',
  'mail',
  'templates',
);

@Global() // Hace que MailService esté disponible en toda la aplicación sin necesidad de importarlo
@Module({
  imports: [
    MailerModule.forRoot({
      // ⚠️ CONFIGURACIÓN SMTP
      transport: {
        host: 'smtp.gmail.com', // 👈 Reemplaza con tu host SMTP (ej. Gmail, SendGrid, Mailgun)
        port: 465,
        secure: true, // true para 465, false para otros puertos (como 587)
        auth: {
          user: 'notificaciones@strategee.us', // 👈 Tu usuario SMTP
          pass: 'xxqu etow bnob sdls',  // 👈 Tu contraseña/API Key
        },
      },
      defaults: {
        from: '"My Strategee" <notificaciones@strategee.us>', // Correo por defecto
      },
      template: {
        dir: templateDir, // 👈 Ruta a la carpeta de plantillas (mail/templates)
        adapter: new HandlebarsAdapter(),
        options: {
          strict: false,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService], // Exportamos para que otros módulos lo utilicen
})
export class MailModule { }