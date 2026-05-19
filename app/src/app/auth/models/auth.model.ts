export interface SignInRequest {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    email: string;
    roles: string[];
    employeeId?: string | null;
    profile?: any;
}

export interface AuthResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
}

export interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}
