export type CredentialLogAction = 'created' | 'accessed' | 'updated';

export interface AccessLog {
  id: string;
  credentialId: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  action: CredentialLogAction;
  accessedAt: Date;
}
