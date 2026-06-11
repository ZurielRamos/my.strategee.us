export interface ReceptionFormat {
    id: string;
    allocationId: string;
    token: string;
    tokenExpiresAt: string;
    signerName: string | null;
    signerDocument: string | null;
    signerEmail: string | null;
    sentAt: string | null;
    isAccepted: boolean;
    acceptedAt: string | null;
    signatureData: string | null;
    createdAt: string;
    updatedAt: string;
}
