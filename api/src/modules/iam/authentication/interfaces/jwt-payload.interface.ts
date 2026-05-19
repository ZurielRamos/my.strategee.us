import { Role } from '../../authorization/enums/role.enum';

export interface JwtPayload {
    sub: string; // User ID
    email: string;
    roles: Role[];
    employeeId: string | null; // Employee ID
    sessionId?: string; // Session ID (optional)
}
