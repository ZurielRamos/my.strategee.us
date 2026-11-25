/**
 * Permisos de Google Workspace que se piden a los usuarios del dominio.
 * Es la única fuente de verdad: la app los obtiene desde /google-workspace/status.
 *
 * Se usan los permisos más acotados que cubren cada caso:
 * - calendar.events: leer y crear eventos.
 * - tasks: leer y gestionar tareas.
 * - documents: crear y editar documentos de Google Docs.
 * - drive.file: acceder solo a archivos de Drive creados o abiertos por la app.
 */
export const GOOGLE_WORKSPACE_SCOPES: readonly string[] = [
    'openid',
    'email',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file',
];

/** Google devuelve "email" expandido a esta URL en el campo scope. */
const SCOPE_ALIASES: Record<string, string> = {
    'https://www.googleapis.com/auth/userinfo.email': 'email',
};

export function normalizeScopes(scope: string | null | undefined): string[] {
    if (!scope) {
        return [];
    }
    return scope
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => SCOPE_ALIASES[s] ?? s);
}
