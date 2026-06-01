import { VisibilityLevel } from './visibility.model';

export interface Vault {
  id: string;
  name: string;
  description?: string;
  visibilityLevel: VisibilityLevel;
  ownerId: string;
  parentId?: string | null;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  credentialCount?: number;
  visibilityEmployees?: { employeeId: string; employee?: { id: string; firstName: string; lastName: string } }[];
  visibilityCompanies?: { companyId: string; company?: { id: string; name: string } }[];
  visibilityAreas?: { areaId: string; area?: { id: string; name: string } }[];
  visibilityPositions?: { positionId: string; position?: { id: string; name: string } }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVaultDto {
  name: string;
  description?: string;
  parentId?: string;
  visibilityLevel?: VisibilityLevel;
  companyIds?: string[];
  areaIds?: string[];
  positionIds?: string[];
  employeeIds?: string[];
}

export interface UpdateVaultDto {
  name?: string;
  description?: string;
  parentId?: string | null;
  visibilityLevel?: VisibilityLevel;
  companyIds?: string[];
  areaIds?: string[];
  positionIds?: string[];
  employeeIds?: string[];
}
