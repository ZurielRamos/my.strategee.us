export interface AccessLog {
  id: string;
  credentialId: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  accessedAt: Date;
}
