import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import cookieParser from "cookie-parser";
import { apiReference } from "@scalar/nestjs-api-reference";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());
  

  app.enableCors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8100",
      process.env.FRONTEND_URL ?? '',
    ].filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('My Strategee')
    .setDescription('My Strategee API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth', // Clave de referencia para usar en @ApiBearerAuth()
    )
    .addTag('Locations',
      'Gestion de las ubicaciones disponibles para trabajo, como oficinas, sucursales, etc. \n\n' +
      'Estas ubicaciones son utilizadas para asignar a los empleados en los contratos.'
    )
    .addTag('Benefits',
      'Gestion de los beneficios disponibles para los empleados.'
    )
    .addTag('Attachments',
      'Biblioteca de medios centralizada. Gestiona fotos, documentos y videos almacenados en Firebase Storage.'
    )
    .addExtension('x-tagGroups', [
      {
        name: 'Gestion de Acceso',
        tags: ['Authentication', 'Users', 'Sessions'],
      },
      {
        name: 'Gestion de Personal',
        tags: ['Employees', 'Contracts', 'Benefits', 'Compensation'],
      },
      {
        name: 'Organización',
        tags: ['Companies', 'Departments', 'Positions', 'Schedules', 'Locations'],
      },
      {
        name: 'Gestion de Solicitudes',
        tags: ['Requests', 'Vacations'],
      },
      {
        name: 'Gestion de Finanzas',
        tags: ['Global Parameters', 'Incomes'],
      },
      {
        name: 'Gestión de Recursos',
        tags: ['Attachments'],
      },
    ])
    .addSecurityRequirements('JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // <--- Activa la persistencia aquí
    },
  });


  app.use(
    '/docs',
    apiReference({
      spec: {
        content: document, // Le pasamos el MISMO documento
      },
      configuration: {
        persistAuth: true,
        defaultHttpClient: {
          targetKey: 'javascript',
          clientKey: 'fetch',
        },
        authentication: {
          preferredSecurityScheme: 'JWT-auth',
          http: {
            bearer: {
              name: 'JWT-auth',
            },
          },
        },
        theme: 'purple', // Puedes personalizar el tema (purple, solarized, moon, etc.)
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

