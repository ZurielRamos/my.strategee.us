import { VisibilityLevel } from './visibility.model';

export interface Credential {
  id: string;
  title?: string;
  url: string;
  username: string;
  password: string;
  directLoginUrl?: string;
  notes?: string;
  logoId?: string;
  logo?: {
    id: string;
    url: string;
    title?: string;
  };
  visibilityLevel: VisibilityLevel;
  ownerId: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vaultId: string;
  vault: {
    id: string;
    name: string;
  };
  employees?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: { url: string } | null;
  }[];
  visibilityEmployees?: {
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      profilePhoto?: { url: string } | null;
    };
  }[];
  visibilityCompanies?: { companyId: string; company?: { id: string; name: string } }[];
  visibilityAreas?: { areaId: string; area?: { id: string; name: string; company?: { name: string } } }[];
  visibilityPositions?: { positionId: string; position?: { id: string; name: string; department?: { name: string } } }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialListItem {
  id: string;
  title?: string;
  url: string;
  logoId?: string;
  logo?: {
    id: string;
    url: string;
    title?: string;
  };
  ownerId: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vault: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

export interface CreateCredentialDto {
  title?: string;
  url: string;
  username: string;
  password: string;
  directLoginUrl?: string;
  notes?: string;
  logoId?: string;
  visibilityLevel: VisibilityLevel;
  vaultId: string;
  companyIds?: string[];
  areaIds?: string[];
  positionIds?: string[];
  employeeIds?: string[];
}

export interface UpdateCredentialDto {
  title?: string;
  url?: string;
  username?: string;
  password?: string;
  directLoginUrl?: string;
  notes?: string;
  logoId?: string;
  visibilityLevel?: VisibilityLevel;
  vaultId?: string;
  companyIds?: string[];
  areaIds?: string[];
  positionIds?: string[];
  employeeIds?: string[];
}
