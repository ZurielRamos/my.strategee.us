export interface GlobalParameter {
  id: string;
  key: string;
  value: number;
  validFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGlobalParameterDto {
  key: string;
  value: number;
  validFrom: string;
}

export interface UpdateGlobalParameterDto {
  key?: string;
  value?: number;
  validFrom?: string;
}
