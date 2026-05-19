export interface Vault {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  credentialCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVaultDto {
  name: string;
  description?: string;
}

export interface UpdateVaultDto {
  name?: string;
  description?: string;
}
