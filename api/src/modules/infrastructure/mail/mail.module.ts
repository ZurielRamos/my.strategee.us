import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow<string>('SMTP_HOST'),
          port: Number(config.get<string>('SMTP_PORT', '465')),
          // true para el puerto 465, false para otros puertos (como 587)
          secure: config.get<string>('SMTP_SECURE', 'true') === 'true',
          auth: {
            user: config.getOrThrow<string>('SMTP_USER'),
            pass: config.getOrThrow<string>('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: config.get<string>('MAIL_FROM') ?? config.getOrThrow<string>('SMTP_USER'),
        },
        template: {
          dir: templateDir,
          adapter: new HandlebarsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService], // Exportamos para que otros módulos lo utilicen
})
export class MailModule { }