/**
 * Contenido legal de My Strategee: Términos y Condiciones de Uso y
 * Política de Tratamiento de Datos Personales (Colombia).
 *
 * IMPORTANTE: completar los datos de LEGAL_CONFIG con la información real del
 * Responsable y hacer revisar los textos por un abogado antes de su publicación.
 * Cada vez que cambie el contenido, actualizar LEGAL_VERSION y LEGAL_UPDATED.
 */

export const LEGAL_VERSION = '1.0';
export const LEGAL_UPDATED = '25 de noviembre de 2026';

export const LEGAL_CONFIG = {
    brand: 'My Strategee',
    legalName: '[RAZÓN SOCIAL DEL RESPONSABLE]',
    nit: '[NIT]',
    address: '[DIRECCIÓN DEL DOMICILIO PRINCIPAL]',
    city: '[CIUDAD DEL DOMICILIO PRINCIPAL]',
    privacyEmail: '[CORREO PARA CONSULTAS Y RECLAMOS SOBRE DATOS PERSONALES]',
    phone: '[TELÉFONO DE CONTACTO]',
};

/** Verdadero mientras queden datos de LEGAL_CONFIG por completar. */
export const LEGAL_CONFIG_PENDING = Object.values(LEGAL_CONFIG).some(v => v.startsWith('['));

export interface LegalSection {
    title: string;
    paragraphs?: string[];
    items?: string[];
    /** Párrafos que se muestran después de la lista de ítems. */
    after?: string[];
}

export interface LegalDocument {
    slug: 'terminos' | 'privacidad';
    title: string;
    intro: string[];
    sections: LegalSection[];
}

const c = LEGAL_CONFIG;
const responsable = `${c.legalName}, identificada con NIT ${c.nit}, con domicilio principal en ${c.city} (${c.address})`;

// ===========================================================================
// TÉRMINOS Y CONDICIONES DE USO
// ===========================================================================
export const TERMS_DOCUMENT: LegalDocument = {
    slug: 'terminos',
    title: 'Términos y Condiciones de Uso',
    intro: [
        `Los presentes Términos y Condiciones de Uso (en adelante, los "Términos") regulan el acceso y la utilización de la plataforma ${c.brand} (en adelante, la "Plataforma"), incluidos su aplicación web, su aplicación móvil, su interfaz de programación (API), los formularios de registro y los demás servicios asociados, puestos a disposición por ${responsable} (en adelante, la "Compañía").`,
        'Lea atentamente estos Términos antes de enviar su registro o utilizar la Plataforma. Al marcar la casilla de aceptación, enviar el formulario de registro, iniciar sesión o usar cualquiera de las funcionalidades, usted declara que los ha leído, comprendido y aceptado en su totalidad. Si no está de acuerdo, debe abstenerse de continuar.',
    ],
    sections: [
        {
            title: '1. Aceptación y valor probatorio',
            paragraphs: [
                'La aceptación de estos Términos se realiza por medios electrónicos y constituye una manifestación de voluntad válida, de conformidad con la Ley 527 de 1999 y demás normas que regulan el comercio electrónico, los mensajes de datos y las firmas electrónicas en Colombia.',
                'La Compañía conservará, como prueba de la aceptación, la fecha y hora, la dirección IP desde la cual se realizó y la versión de los Términos aceptada. Dichos registros tendrán valor probatorio en cualquier controversia.',
            ],
        },
        {
            title: '2. Definiciones',
            items: [
                'Usuario: toda persona natural que accede a la Plataforma, ya sea como solicitante de registro, colaborador, contratista, administrador o en cualquier otra calidad autorizada.',
                'Colaborador: persona natural vinculada a la Compañía o a alguna de las empresas del grupo empresarial a través de un contrato laboral, de prestación de servicios o de otra modalidad.',
                'Solicitud de registro: información que una persona envía mediante el formulario público para que la Compañía evalúe su alta en la Plataforma.',
                'Credenciales: correo corporativo, contraseña y cualquier otro mecanismo de autenticación asignado al Usuario.',
                'Información de la Compañía: toda información, documento, dato, credencial, contenido o material al que el Usuario acceda a través de la Plataforma y que no sea de dominio público.',
                'Datos personales, Titular, Responsable, Encargado y Tratamiento: tienen el significado previsto en la Ley 1581 de 2012 y en la Política de Tratamiento de Datos Personales de la Compañía.',
            ],
        },
        {
            title: '3. Objeto y alcance de la Plataforma',
            paragraphs: [
                'La Plataforma es una herramienta de gestión de talento humano y de operación interna que, según el perfil y los permisos de cada Usuario, permite, entre otras, las siguientes funcionalidades:',
            ],
            items: [
                'Registro y administración de la información personal, laboral y de seguridad social de los Colaboradores, incluidos los contactos de emergencia y los aportes parafiscales.',
                'Gestión de contratos, memorandos, cargos, áreas, empresas, horarios y ubicaciones.',
                'Gestión de solicitudes (vacaciones, permisos, incapacidades, tiempo compensado, días obsequiados y otras), saldos y trazabilidad de las decisiones.',
                'Consulta de información de compensación, beneficios, ingresos y parámetros globales, conforme a los permisos asignados.',
                'Calendario, tareas, actas de reunión y sincronización con servicios de Google Workspace.',
                'Capacitaciones, materiales de formación y su seguimiento.',
                'Inventario de activos, asignaciones y formatos de recepción con firma electrónica.',
                'Bóveda de credenciales y contraseñas compartidas con reglas de visibilidad.',
                'Notificaciones por correo electrónico, notificaciones push y mensajería a través de WhatsApp.',
                'Biblioteca de documentos y gestión de archivos adjuntos.',
            ],
            after: [
                'La Compañía podrá agregar, modificar, suspender o retirar funcionalidades en cualquier momento, sin que ello genere derecho a indemnización alguna.',
            ],
        },
        {
            title: '4. Solicitud de registro, revisión y aprobación',
            paragraphs: [
                'El formulario público de registro permite que una persona suministre su información para que la Compañía la revise. El envío del formulario crea únicamente una solicitud pendiente y no implica, por sí mismo, la creación de una cuenta, el otorgamiento de acceso a la Plataforma ni la existencia, promesa o expectativa de un vínculo laboral, contractual o comercial.',
                'La Compañía podrá aprobar, solicitar correcciones o rechazar cualquier solicitud a su entera discreción y sin necesidad de justificar su decisión. Cuando una solicitud sea rechazada, la información suministrada podrá ser eliminada de la Plataforma, sin perjuicio de las obligaciones legales de conservación que resulten aplicables.',
                'Una vez aprobada la solicitud, la Compañía enviará un mensaje al correo corporativo indicado para que el Usuario configure su contraseña. El enlace tendrá un tiempo de vigencia limitado; vencido este, deberá solicitarse uno nuevo al administrador.',
                'El enlace del formulario de registro es de uso exclusivo del personal al que la Compañía lo comparta. Está prohibido divulgarlo a terceros no autorizados, usarlo para enviar información de otra persona sin su consentimiento o automatizar su diligenciamiento.',
            ],
        },
        {
            title: '5. Veracidad y actualización de la información',
            paragraphs: [
                'El Usuario garantiza que la información que suministra es veraz, completa, exacta y actual, y se obliga a mantenerla actualizada. La inexactitud, el suplantamiento de identidad o la presentación de documentos o datos falsos podrán dar lugar al rechazo de la solicitud, a la suspensión o cancelación del acceso y a las acciones disciplinarias, civiles y penales a que haya lugar.',
                'El Usuario es responsable de los perjuicios que cause a la Compañía o a terceros por información errónea o desactualizada que haya suministrado.',
            ],
        },
        {
            title: '6. Cuentas, credenciales y seguridad',
            items: [
                'Las credenciales son personales, intransferibles y confidenciales. El Usuario es responsable de toda actividad realizada con ellas.',
                'El Usuario debe elegir una contraseña robusta (mínimo ocho caracteres, con mayúsculas, minúsculas, números y símbolos), no reutilizarla en otros servicios y no compartirla ni almacenarla en lugares inseguros.',
                'El Usuario debe cerrar sesión al terminar de utilizar la Plataforma en dispositivos compartidos o públicos.',
                'Si el Usuario sospecha de un uso no autorizado de su cuenta o de una vulneración de seguridad, debe informarlo de inmediato al administrador de la Plataforma o al canal que la Compañía indique.',
                'La Compañía podrá bloquear, restablecer o revocar credenciales en cualquier momento por razones de seguridad, por la terminación de la relación con el Usuario o por incumplimiento de estos Términos.',
            ],
        },
        {
            title: '7. Uso aceptable y conductas prohibidas',
            paragraphs: ['El Usuario se obliga a utilizar la Plataforma de manera lícita, diligente, de buena fe y exclusivamente para los fines laborales o contractuales para los cuales se le concedió acceso. En particular, queda prohibido:'],
            items: [
                'Acceder o intentar acceder a información, módulos, cuentas o datos para los que no cuente con autorización, o eludir los controles de acceso y de visibilidad.',
                'Consultar, copiar, extraer, divulgar o usar datos personales de otros Colaboradores o de terceros con fines distintos a los autorizados por la Compañía.',
                'Introducir virus, código malicioso o realizar pruebas de vulnerabilidad, escaneos, ingeniería inversa, descompilación o ataques de denegación de servicio sin autorización escrita.',
                'Usar la Plataforma para acosar, discriminar, difamar, suplantar o amenazar a otras personas, o para cualquier actividad contraria a la ley, a la moral o al orden público.',
                'Cargar contenido que infrinja derechos de propiedad intelectual, derechos de terceros o que contenga material ilícito, ofensivo o malicioso.',
                'Utilizar medios automatizados (bots, scrapers) para acceder a la Plataforma o enviar formularios de registro de forma masiva.',
                'Alterar, falsificar o eliminar registros, solicitudes, saldos, firmas, aprobaciones o rastros de auditoría.',
                'Ceder, vender, sublicenciar o permitir el uso de su cuenta a otra persona.',
            ],
            after: [
                'Las conductas anteriores podrán constituir, además, delitos informáticos sancionados por la Ley 1273 de 2009 (acceso abusivo a un sistema informático, violación de datos personales, suplantación de sitios web, entre otros) y faltas disciplinarias conforme al Reglamento Interno de Trabajo o al contrato respectivo.',
            ],
        },
        {
            title: '8. Confidencialidad e información de la Compañía',
            paragraphs: [
                'El Usuario reconoce que a través de la Plataforma puede conocer información confidencial, secretos empresariales, datos personales de terceros, credenciales y demás Información de la Compañía. Se obliga a mantenerla en reserva, a usarla únicamente para el cumplimiento de sus funciones y a no divulgarla, reproducirla ni utilizarla en beneficio propio o de terceros, tanto durante la vigencia de su relación con la Compañía como después de su terminación, por el tiempo que la información conserve su carácter confidencial o por el que disponga la ley.',
                'Las credenciales almacenadas en la bóveda de contraseñas son propiedad de la Compañía o de los terceros que las hubieren autorizado. Su visibilidad depende de los niveles definidos (público, por empresa, por puesto, por empleados específicos, entre otros) y el Usuario solo podrá usarlas para los fines laborales autorizados, sin copiarlas, compartirlas o conservarlas fuera de la Plataforma.',
                'Esta cláusula es complementaria a las obligaciones de confidencialidad y lealtad previstas en el contrato de trabajo, en el contrato de prestación de servicios, en los acuerdos de confidencialidad y en el artículo 58 del Código Sustantivo del Trabajo, según corresponda.',
            ],
        },
        {
            title: '9. Servicios y plataformas de terceros',
            paragraphs: [
                'Para su funcionamiento, la Plataforma se apoya en servicios de terceros, entre ellos Google Workspace (correo, calendario y tareas), Google Firebase (almacenamiento de archivos y notificaciones push), proveedores de mensajería de WhatsApp, servicios de correo electrónico (SMTP) y servicios de transcripción y generación de actas de reunión.',
                'El uso de dichos servicios está sujeto, además, a los términos y políticas de sus respectivos proveedores, que el Usuario debe respetar. La Compañía no es responsable por las fallas, interrupciones, cambios de condiciones o incidentes de seguridad atribuibles a esos terceros, sin perjuicio de las obligaciones que le correspondan como Responsable del Tratamiento de datos personales.',
                'Cuando el Usuario conecte voluntariamente su cuenta corporativa de Google u otro servicio a la Plataforma, autoriza a esta a acceder a los datos estrictamente necesarios para la funcionalidad solicitada (por ejemplo, eventos de calendario o tareas) y podrá revocar dicha conexión en cualquier momento desde su cuenta del proveedor.',
            ],
        },
        {
            title: '10. Comunicaciones y notificaciones',
            paragraphs: [
                'El Usuario acepta recibir comunicaciones relacionadas con la operación de la Plataforma y con su relación con la Compañía (por ejemplo, aprobaciones, recordatorios, cambios en solicitudes, convocatorias a capacitaciones, alertas de seguridad y avisos administrativos) a través del correo electrónico, notificaciones push, mensajes de WhatsApp o dentro de la propia Plataforma.',
                'Estas comunicaciones son de carácter operativo y no constituyen publicidad. El Usuario podrá gestionar algunas preferencias de notificación desde la configuración de su cuenta, salvo las que sean necesarias para la prestación del servicio o para el cumplimiento de obligaciones legales o contractuales.',
            ],
        },
        {
            title: '11. Registros de actividad, auditoría y recursos corporativos',
            paragraphs: [
                'La Plataforma y las cuentas corporativas asociadas son herramientas de trabajo de propiedad de la Compañía. Por razones de seguridad, trazabilidad y cumplimiento, la Plataforma registra eventos de actividad (por ejemplo, inicios de sesión, cambios en datos de contacto, aprobaciones, ajustes de saldos y accesos a información sensible) que podrán ser revisados por los administradores autorizados y utilizados para investigaciones internas, auditorías, atención de requerimientos de autoridades y defensa de los intereses de la Compañía.',
                'El Usuario reconoce que no tiene expectativa de privacidad respecto de la información que cargue o genere en las herramientas corporativas, sin perjuicio de los derechos que le asisten como Titular de datos personales y de las garantías constitucionales y legales, que serán siempre respetadas.',
            ],
        },
        {
            title: '12. Propiedad intelectual',
            paragraphs: [
                `La Plataforma, su código fuente, diseño, interfaces, bases de datos, marcas, logotipos, nombres comerciales, documentación y demás contenidos, así como la marca ${c.brand}, son propiedad de la Compañía o de sus licenciantes y están protegidos por la Ley 23 de 1982, la Decisión Andina 351 de 1993, la Decisión Andina 486 de 2000 y demás normas aplicables.`,
                'Estos Términos no transfieren al Usuario derecho alguno sobre la propiedad intelectual, salvo una licencia limitada, personal, revocable, no exclusiva e intransferible para usar la Plataforma conforme a su finalidad y mientras subsista su autorización de acceso.',
                'Los contenidos que el Usuario cargue en el ejercicio de sus funciones (documentos, actas, tareas, materiales) se entienden elaborados en cumplimiento de sus obligaciones y su uso por la Compañía se rige por la ley y por el contrato correspondiente. El Usuario garantiza que dichos contenidos no infringen derechos de terceros.',
            ],
        },
        {
            title: '13. Disponibilidad, mantenimiento y limitación de responsabilidad',
            paragraphs: [
                'La Compañía procurará mantener la Plataforma disponible de manera continua, pero no garantiza que el servicio sea ininterrumpido ni libre de errores. Podrán presentarse suspensiones por mantenimiento, actualizaciones, fallas técnicas, caídas de proveedores, casos fortuitos o fuerza mayor.',
                'En la máxima medida permitida por la ley, la Compañía no será responsable por (i) daños indirectos, lucro cesante o pérdida de oportunidades derivados del uso o la imposibilidad de uso de la Plataforma; (ii) el uso indebido de las credenciales por causas imputables al Usuario; (iii) la información inexacta suministrada por el Usuario o por terceros; (iv) la interrupción de servicios de terceros. Nada en estos Términos limita la responsabilidad que no pueda excluirse conforme a la ley, ni los derechos irrenunciables del trabajador.',
                'Los saldos, cálculos y demás información visibles en la Plataforma (por ejemplo, vacaciones o compensaciones) tienen carácter informativo y operativo; en caso de discrepancia prevalecerán los documentos contractuales, la liquidación oficial de nómina y las normas laborales aplicables.',
            ],
        },
        {
            title: '14. Protección de datos personales',
            paragraphs: [
                'El Tratamiento de los datos personales que se recolectan y gestionan a través de la Plataforma se rige por la Política de Tratamiento de Datos Personales de la Compañía, que forma parte integral de estos Términos y que el Usuario declara conocer y aceptar mediante la autorización expresa que se otorga en el formulario de registro o en el momento de su vinculación.',
                'En el ejercicio de sus funciones, los Usuarios con acceso a datos personales de otros Colaboradores actúan bajo las instrucciones de la Compañía, están obligados a guardar reserva y a aplicar las medidas de seguridad definidas, y responden por el uso indebido de dicha información.',
            ],
        },
        {
            title: '15. Suspensión y terminación del acceso',
            paragraphs: [
                'La Compañía podrá suspender o terminar el acceso del Usuario, de forma inmediata y sin previo aviso, cuando: (i) termine o se suspenda la relación laboral o contractual que justifica el acceso; (ii) se incumplan estos Términos o la ley; (iii) exista riesgo para la seguridad de la Plataforma o de la información; (iv) lo ordene una autoridad competente.',
                'La terminación del acceso no extingue las obligaciones de confidencialidad, de protección de datos, de propiedad intelectual ni las demás que por su naturaleza deban subsistir. La Compañía conservará la información del Usuario durante los plazos legales y conforme a la Política de Tratamiento de Datos Personales.',
            ],
        },
        {
            title: '16. Modificaciones',
            paragraphs: [
                'La Compañía podrá modificar estos Términos en cualquier momento para adaptarlos a cambios legales, técnicos u operativos. La versión vigente estará siempre disponible en la Plataforma, con indicación de la fecha de su última actualización. Cuando los cambios sean sustanciales, la Compañía podrá solicitar una nueva aceptación o informarlos por los canales habituales de comunicación.',
                'El uso continuado de la Plataforma después de la publicación de los cambios implicará su aceptación, sin perjuicio de los derechos del Titular previstos en la Ley 1581 de 2012 respecto de nuevas finalidades del Tratamiento.',
            ],
        },
        {
            title: '17. Ley aplicable, jurisdicción y solución de controversias',
            paragraphs: [
                `Estos Términos se rigen por las leyes de la República de Colombia. Las controversias que surjan en relación con ellos se someterán, previo intento de arreglo directo entre las partes por un término de treinta (30) días calendario, a los jueces y tribunales competentes de ${c.city}, Colombia, sin perjuicio de las competencias especiales que la ley atribuya a la jurisdicción ordinaria laboral, a la Superintendencia de Industria y Comercio en materia de protección de datos personales o a otras autoridades.`,
            ],
        },
        {
            title: '18. Disposiciones generales',
            items: [
                'Integralidad: estos Términos y la Política de Tratamiento de Datos Personales constituyen el acuerdo completo entre el Usuario y la Compañía respecto del uso de la Plataforma, sin perjuicio de los contratos, reglamentos y políticas internas aplicables.',
                'Divisibilidad: si alguna disposición fuera declarada nula o inaplicable, las demás conservarán plena validez.',
                'No renuncia: la omisión o demora de la Compañía en ejercer un derecho no implica su renuncia.',
                'Cesión: la Compañía podrá ceder estos Términos a una sociedad vinculada o a un sucesor en el negocio. El Usuario no podrá cederlos sin autorización escrita.',
                'Prevalencia laboral: ninguna disposición de estos Términos se interpretará en perjuicio de los derechos mínimos, ciertos e irrenunciables del trabajador reconocidos por la Constitución y la ley.',
                'Idioma: estos Términos se redactan en español, que prevalecerá sobre cualquier traducción.',
            ],
        },
        {
            title: '19. Contacto',
            paragraphs: [
                `Para consultas sobre estos Términos puede comunicarse con la Compañía en ${c.address}, ${c.city}, al teléfono ${c.phone} o al correo electrónico ${c.privacyEmail}.`,
            ],
        },
    ],
};

// ===========================================================================
// POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES Y AUTORIZACIÓN
// ===========================================================================
export const PRIVACY_DOCUMENT: LegalDocument = {
    slug: 'privacidad',
    title: 'Política de Tratamiento de Datos Personales y Autorización',
    intro: [
        `La presente Política de Tratamiento de Datos Personales (en adelante, la "Política") se expide en cumplimiento del artículo 15 de la Constitución Política de Colombia, la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (incorporado en el Decreto Único 1074 de 2015) y demás normas que los modifiquen, reglamenten o complementen. Establece las condiciones en las que ${c.legalName} trata los datos personales recolectados a través de la plataforma ${c.brand}.`,
        'Al marcar la casilla de autorización en el formulario de registro, usted manifiesta que ha sido informado de manera clara y suficiente sobre el Tratamiento de sus datos, sus finalidades y sus derechos, y otorga su autorización previa, expresa e informada.',
    ],
    sections: [
        {
            title: '1. Responsable del Tratamiento',
            items: [
                `Razón social: ${c.legalName}`,
                `NIT: ${c.nit}`,
                `Domicilio: ${c.address}, ${c.city}, Colombia`,
                `Correo electrónico para consultas y reclamos: ${c.privacyEmail}`,
                `Teléfono: ${c.phone}`,
            ],
            after: [
                'Cuando la Plataforma sea utilizada por varias empresas vinculadas al mismo grupo empresarial, cada una actuará como Responsable respecto de los datos de sus propios Colaboradores, y la Compañía podrá actuar como Encargada de aquellas, conforme a los acuerdos de transmisión que correspondan.',
            ],
        },
        {
            title: '2. Definiciones',
            items: [
                'Autorización: consentimiento previo, expreso e informado del Titular para llevar a cabo el Tratamiento de datos personales.',
                'Dato personal: cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables.',
                'Dato público: dato que no es semiprivado, privado o sensible (por ejemplo, el estado civil o la profesión).',
                'Dato sensible: aquel que afecta la intimidad del Titular o cuyo uso indebido puede generar su discriminación, como los datos que revelen el origen racial o étnico, la orientación política, las convicciones religiosas o filosóficas, la pertenencia a sindicatos u organizaciones sociales o de derechos humanos, los relativos a la salud, a la vida sexual y los datos biométricos.',
                'Encargado del Tratamiento: persona natural o jurídica que realiza el Tratamiento por cuenta del Responsable.',
                'Responsable del Tratamiento: persona natural o jurídica que decide sobre la base de datos y/o el Tratamiento de los datos.',
                'Titular: persona natural cuyos datos personales son objeto de Tratamiento.',
                'Tratamiento: cualquier operación sobre datos personales, como la recolección, almacenamiento, uso, circulación, transmisión, transferencia o supresión.',
                'Transmisión: comunicación de datos personales a un Encargado, dentro o fuera de Colombia, para que realice el Tratamiento por cuenta del Responsable.',
                'Transferencia: envío de datos personales por parte del Responsable a otro Responsable ubicado dentro o fuera del país.',
            ],
        },
        {
            title: '3. Principios aplicables',
            paragraphs: ['El Tratamiento se rige por los principios de legalidad, finalidad, libertad, veracidad o calidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad, previstos en el artículo 4 de la Ley 1581 de 2012. En particular:'],
            items: [
                'Solo se recolectan los datos necesarios para las finalidades descritas en esta Política.',
                'Los datos se tratan únicamente por personas autorizadas y bajo deber de reserva.',
                'El Titular puede conocer, actualizar y rectificar sus datos en todo momento.',
                'Se adoptan medidas técnicas, humanas y administrativas para proteger la información.',
            ],
        },
        {
            title: '4. Datos personales que se recolectan',
            paragraphs: ['Según la relación del Titular con la Compañía y las funcionalidades que utilice, la Plataforma puede tratar las siguientes categorías de datos:'],
            items: [
                'Identificación: nombres, apellidos, tipo y número de documento (cédula de ciudadanía, cédula de extranjería, pasaporte, tarjeta de identidad, Permiso por Protección Temporal, Permiso Especial de Permanencia u otros), fecha de nacimiento y género.',
                'Contacto: dirección de residencia, teléfono personal, correo electrónico personal y correo electrónico corporativo.',
                'Información laboral: fecha de ingreso, tipo de contrato, empresa, cargo, área o departamento, horarios, ubicación, historial de contratos y memorandos, indicadores de desempeño y demás datos de la relación laboral o contractual.',
                'Seguridad social y aportes parafiscales: EPS, ARL, fondo de pensiones, caja de compensación familiar y demás afiliaciones.',
                'Información económica: salario, compensaciones, beneficios, ingresos y descuentos asociados a la relación laboral o contractual.',
                'Gestión del talento: solicitudes de vacaciones, permisos, incapacidades, tiempo compensado y días obsequiados, saldos, capacitaciones realizadas, tareas, actas de reunión y eventos de calendario.',
                'Datos de terceros: nombre, parentesco, teléfono y correo de sus contactos de emergencia.',
                'Imagen y firma: fotografía de perfil y firma electrónica o trazo de firma en formatos de recepción de activos.',
                'Datos técnicos y de uso: credenciales de acceso (la contraseña se almacena cifrada), direcciones IP, identificadores de dispositivos, tokens de notificaciones push, dispositivos de WhatsApp vinculados, registros de actividad y de auditoría, fecha, hora y versión de la aceptación de estos documentos.',
                'Información de activos y credenciales corporativas asignadas al Titular, y la información que el Titular cargue voluntariamente en la Plataforma.',
            ],
        },
        {
            title: '5. Datos sensibles y datos de menores de edad',
            paragraphs: [
                'Algunos de los datos tratados pueden ser sensibles o revelar información sensible, como los relacionados con la afiliación a EPS o con incapacidades y licencias médicas, o la fotografía de perfil cuando permita identificar de manera única a la persona. El Titular no está obligado a autorizar el Tratamiento de datos sensibles ni a responder preguntas sobre ellos. Sin embargo, la entrega de algunos de estos datos es necesaria para cumplir obligaciones legales de afiliación a la seguridad social y para la ejecución de la relación laboral o contractual.',
                'Los datos sensibles se tratarán exclusivamente para las finalidades descritas en esta Política que sean estrictamente necesarias, con acceso restringido al personal autorizado y con medidas reforzadas de seguridad. Ninguna actividad de la Compañía estará condicionada a que el Titular suministre datos sensibles que no sean indispensables.',
                'La Compañía solo trata datos de niños, niñas y adolescentes cuando la ley lo permite y se garantiza el respeto de sus derechos prevalentes. Si el Titular es menor de dieciocho (18) años, el Tratamiento requiere la autorización de su representante legal y, para la vinculación laboral de menores, el cumplimiento de las exigencias del Código de la Infancia y la Adolescencia y del Código Sustantivo del Trabajo (incluida la autorización de la autoridad competente).',
            ],
        },
        {
            title: '6. Datos de terceros: contactos de emergencia',
            paragraphs: [
                'Cuando el Titular suministre datos de otras personas (por ejemplo, contactos de emergencia), declara que cuenta con la autorización de dichas personas para compartir su información con la Compañía, que les ha informado sobre la finalidad de su uso y que ellas pueden ejercer sus derechos como Titulares ante la Compañía.',
                'Estos datos se tratarán exclusivamente para contactar a la persona indicada en situaciones de emergencia relacionadas con el Titular y no se utilizarán con fines comerciales ni se compartirán con terceros, salvo requerimiento de autoridad competente.',
            ],
        },
        {
            title: '7. Finalidades del Tratamiento',
            paragraphs: ['Los datos personales se recolectan, almacenan, usan, circulan y, en general, se tratan para las siguientes finalidades:'],
            items: [
                'Evaluar, aprobar o rechazar la solicitud de registro y verificar la identidad y la información suministrada.',
                'Crear y administrar la cuenta de acceso del Titular y enviar los mensajes necesarios para configurar y recuperar sus credenciales.',
                'Gestionar la vinculación, ejecución y terminación de la relación laboral o contractual: contratación, memorandos, cargos, horarios, ubicaciones, nómina, prestaciones sociales, beneficios y compensaciones.',
                'Realizar las afiliaciones y el pago de aportes al Sistema de Seguridad Social Integral y a las cajas de compensación familiar, y cumplir las obligaciones tributarias, contables, laborales y de reporte ante autoridades.',
                'Gestionar solicitudes de vacaciones, permisos, incapacidades, tiempo compensado y días obsequiados, así como el cálculo y control de saldos.',
                'Administrar capacitaciones, evaluaciones, tareas, actas de reunión, calendario y demás herramientas de productividad.',
                'Asignar y controlar activos de inventario y credenciales corporativas, y gestionar los formatos de recepción y firma electrónica.',
                'Contactar a las personas indicadas como contactos de emergencia cuando sea necesario.',
                'Enviar comunicaciones operativas, notificaciones push, correos electrónicos y mensajes de WhatsApp relacionados con la Plataforma y con la relación con la Compañía.',
                'Garantizar la seguridad de la información y de la Plataforma, prevenir fraudes y accesos no autorizados, y mantener registros de auditoría y trazabilidad.',
                'Elaborar estadísticas, indicadores y reportes internos de gestión humana, de forma agregada o disociada cuando sea posible.',
                'Atender requerimientos de autoridades judiciales o administrativas, y ejercer o defender los derechos de la Compañía en procesos judiciales, arbitrales o administrativos.',
                'Cumplir las obligaciones legales y contractuales de la Compañía y las demás finalidades que se informen al Titular en el momento de la recolección, siempre que sean compatibles con las anteriores.',
            ],
            after: [
                'Los datos no se utilizarán para finalidades distintas a las aquí descritas sin una nueva autorización del Titular, salvo que la ley lo permita.',
            ],
        },
        {
            title: '8. Autorización del Titular',
            paragraphs: [
                'El Tratamiento de datos personales por parte de la Compañía requiere la autorización previa, expresa e informada del Titular, salvo las excepciones legales (artículo 10 de la Ley 1581 de 2012), entre ellas la información requerida por una entidad pública o administrativa en ejercicio de sus funciones legales o por orden judicial, los datos de naturaleza pública y los casos de urgencia médica o sanitaria.',
                'La autorización se otorga mediante un mecanismo electrónico (casilla de aceptación en el formulario de registro, en la Plataforma o en el momento de la vinculación), lo que constituye una conducta inequívoca del Titular según el artículo 7 del Decreto 1377 de 2013. La Compañía conservará la prueba de la autorización, incluidas la fecha, la dirección IP y la versión de este documento aceptada.',
                'Con su autorización, el Titular declara que ha sido informado de: (i) el Tratamiento al que serán sometidos sus datos y su finalidad; (ii) el carácter facultativo de las respuestas sobre datos sensibles o de menores; (iii) los derechos que le asisten; y (iv) la identificación y datos de contacto del Responsable.',
            ],
        },
        {
            title: '9. Encargados, transmisiones y transferencias',
            paragraphs: [
                'Para el funcionamiento de la Plataforma, la Compañía podrá compartir datos personales con Encargados que prestan servicios por su cuenta y bajo sus instrucciones, entre ellos:',
            ],
            items: [
                'Proveedores de infraestructura, alojamiento y bases de datos.',
                'Google (Google Workspace, Google Firebase y servicios de nube), para correo, calendario, tareas, almacenamiento de archivos y notificaciones push.',
                'Proveedores de mensajería de WhatsApp y de servicios de correo electrónico (SMTP).',
                'Proveedores de servicios de transcripción y generación de actas de reunión.',
                'Asesores jurídicos, contables, de seguridad de la información, auditores y entidades de seguridad social o de nómina, cuando sea necesario para las finalidades de esta Política.',
            ],
            after: [
                'Algunos de estos proveedores pueden almacenar o procesar los datos en servidores ubicados fuera de Colombia. En esos casos, la Compañía realizará las transmisiones o transferencias internacionales con sujeción a los artículos 25 y 26 de la Ley 1581 de 2012 y a la regulación de la Superintendencia de Industria y Comercio, exigiendo niveles adecuados de protección y, cuando corresponda, celebrando contratos de transmisión de datos. El Titular autoriza expresamente dichas transmisiones y transferencias.',
                'La Compañía no vende los datos personales ni los cede a terceros con fines comerciales. Podrá entregarlos a las autoridades que los requieran en ejercicio de sus funciones legales.',
            ],
        },
        {
            title: '10. Derechos de los Titulares',
            paragraphs: ['De acuerdo con el artículo 8 de la Ley 1581 de 2012, el Titular tiene derecho a:'],
            items: [
                'Conocer, actualizar y rectificar sus datos personales frente al Responsable o los Encargados.',
                'Solicitar prueba de la autorización otorgada, salvo cuando no sea requerida.',
                'Ser informado, previa solicitud, sobre el uso que se le ha dado a sus datos.',
                'Presentar ante la Superintendencia de Industria y Comercio quejas por infracciones a la ley.',
                'Revocar la autorización y/o solicitar la supresión de sus datos cuando no se respeten los principios, derechos y garantías constitucionales y legales, o cuando no exista un deber legal o contractual de conservarlos.',
                'Acceder en forma gratuita a sus datos personales que hayan sido objeto de Tratamiento.',
            ],
            after: [
                'La revocatoria y la supresión no procederán cuando el Titular tenga un deber legal o contractual de permanecer en las bases de datos de la Compañía (por ejemplo, las obligaciones de conservación de la historia laboral y de los soportes de seguridad social, tributarios y contables). La revocatoria de la autorización podría implicar la imposibilidad de mantener la relación o el acceso a la Plataforma, en la medida en que el Tratamiento sea necesario para ello.',
            ],
        },
        {
            title: '11. Procedimiento para consultas y reclamos',
            paragraphs: [
                `Los Titulares, sus causahabientes, representantes o apoderados podrán ejercer sus derechos mediante comunicación dirigida a ${c.privacyEmail} o a la dirección física ${c.address}, ${c.city}, indicando su identificación, la descripción de los hechos y la petición concreta, y adjuntando los documentos que respalden la solicitud. Un área o persona designada por la Compañía atenderá las peticiones.`,
            ],
            items: [
                'Consultas: serán atendidas en un máximo de diez (10) días hábiles contados desde la fecha de recibo. Si no fuere posible, se informará al interesado el motivo de la demora y la nueva fecha, que no podrá superar cinco (5) días hábiles adicionales (artículo 14 de la Ley 1581 de 2012).',
                'Reclamos de corrección, actualización, supresión o por presunto incumplimiento: se atenderán en un máximo de quince (15) días hábiles. Si el reclamo estuviere incompleto, se requerirá al interesado dentro de los cinco (5) días siguientes para que lo subsane; transcurridos dos (2) meses sin respuesta se entenderá que ha desistido. Si no fuere posible resolver en dicho término, se informará el motivo y la nueva fecha, que no podrá superar ocho (8) días hábiles adicionales (artículo 15 de la Ley 1581 de 2012).',
                'Requisito de procedibilidad: el Titular solo podrá elevar queja ante la Superintendencia de Industria y Comercio una vez agotado el trámite de consulta o reclamo ante la Compañía.',
            ],
        },
        {
            title: '12. Medidas de seguridad',
            paragraphs: [
                'La Compañía adopta medidas técnicas, humanas y administrativas razonables para proteger los datos personales contra pérdida, consulta, uso o acceso no autorizado o fraudulento, tales como: control de acceso por roles y niveles de visibilidad, almacenamiento cifrado de contraseñas, comunicaciones cifradas, registros de auditoría, políticas de contraseñas robustas, copias de seguridad, segregación de funciones y acuerdos de confidencialidad con el personal y los proveedores.',
                'Ningún sistema es completamente invulnerable. En caso de un incidente de seguridad que afecte los datos personales, la Compañía lo reportará a la Superintendencia de Industria y Comercio y a los Titulares afectados cuando así lo exija la ley, dentro de los términos aplicables.',
            ],
        },
        {
            title: '13. Conservación de los datos',
            paragraphs: [
                'Los datos personales se conservarán durante la vigencia de la relación con el Titular y, posteriormente, por el tiempo necesario para cumplir las finalidades que originaron su recolección y las obligaciones legales, laborales, de seguridad social, tributarias, contables y contractuales de la Compañía, incluido el término de prescripción de las acciones laborales y el necesario para acreditar la historia laboral y atender reconocimientos pensionales, que podrá extenderse hasta por veinte (20) años contados desde la terminación de la relación, salvo que una norma disponga un plazo distinto.',
                'Si la solicitud de registro es rechazada, los datos suministrados serán eliminados de la Plataforma, salvo que deban conservarse por obligación legal o para la defensa de los derechos de la Compañía. Vencidos los plazos de conservación, los datos serán suprimidos o anonimizados de forma segura.',
            ],
        },
        {
            title: '14. Registro Nacional de Bases de Datos',
            paragraphs: [
                'La Compañía inscribirá y actualizará sus bases de datos en el Registro Nacional de Bases de Datos (RNBD) administrado por la Superintendencia de Industria y Comercio, en los casos y plazos en que la normativa vigente lo exija.',
            ],
        },
        {
            title: '15. Vigencia y modificaciones',
            paragraphs: [
                `Esta Política rige a partir de su publicación y permanecerá vigente mientras la Compañía realice Tratamiento de datos personales. Cualquier cambio sustancial será comunicado oportunamente a los Titulares por los medios habituales de la Plataforma, antes de su implementación. La versión vigente es la ${LEGAL_VERSION}, actualizada el ${LEGAL_UPDATED}.`,
                'Cuando los cambios afecten las finalidades del Tratamiento de manera que requieran una nueva autorización, la Compañía la solicitará al Titular.',
            ],
        },
    ],
};

export const LEGAL_DOCUMENTS: Record<string, LegalDocument> = {
    terminos: TERMS_DOCUMENT,
    privacidad: PRIVACY_DOCUMENT,
};
