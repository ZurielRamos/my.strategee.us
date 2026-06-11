import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonList,
    IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    documentTextOutline,
    checkmarkCircleOutline,
    alertCircleOutline,
    laptopOutline,
    hardwareChipOutline,
    cubeOutline,
    personOutline,
    mailOutline,
    cardOutline,
    createOutline,
} from 'ionicons/icons';
import { environment } from 'src/environments/environment';

type PageState = 'loading' | 'valid' | 'accepted' | 'error' | 'success';

interface ReceptionFormatData {
    id: string;
    token: string;
    tokenExpiresAt: string;
    signerName: string | null;
    signerDocument: string | null;
    signerEmail: string | null;
    isAccepted: boolean;
    acceptedAt: string | null;
    signatureData: string | null;
    allocation: {
        id: string;
        inventory: {
            name: string;
            value: number;
            typeInventory?: { name: string };
            features?: Array<{
                id: string;
                hardware?: { name: string } | null;
                software?: { name: string } | null;
                description: string | null;
                hardwareId: string | null;
                softwareId: string | null;
            }>;
        };
        elements?: Array<{
            id: string;
            additionalElement?: { name: string };
            value: number;
        }>;
        employee?: {
            firstName: string;
            lastName: string;
        };
    };
}

interface SignFormData {
    signerName: string;
    signerDocument: string;
    signerEmail: string;
    signatureData: string;
}

@Component({
    selector: 'app-reception-format',
    templateUrl: './reception-format.page.html',
    styleUrls: ['./reception-format.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonItem,
        IonLabel,
        IonInput,
        IonButton,
        IonIcon,
        IonSpinner,
        IonList,
        IonNote,
    ],
})
export class ReceptionFormatPage implements OnInit {
    state: PageState = 'loading';
    errorMessage = '';
    data: ReceptionFormatData | null = null;
    submitting = false;

    form: SignFormData = {
        signerName: '',
        signerDocument: '',
        signerEmail: '',
        signatureData: '',
    };

    private token = '';
    private readonly apiUrl = `${environment.apiUrl}/inventory/reception-format`;

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
    ) {
        addIcons({
            documentTextOutline,
            checkmarkCircleOutline,
            alertCircleOutline,
            laptopOutline,
            hardwareChipOutline,
            cubeOutline,
            personOutline,
            mailOutline,
            cardOutline,
            createOutline,
        });
    }

    ngOnInit(): void {
        this.token = this.route.snapshot.paramMap.get('token') || '';
        this.loadFormatData();
    }

    get hardwareFeatures() {
        return (this.data?.allocation?.inventory?.features || []).filter(f => f.hardwareId);
    }

    get softwareFeatures() {
        return (this.data?.allocation?.inventory?.features || []).filter(f => f.softwareId);
    }

    get additionalElements() {
        return this.data?.allocation?.elements || [];
    }

    get isFormValid(): boolean {
        const { signerName, signerDocument, signerEmail } = this.form;
        if (!signerName.trim() || signerName.length > 100) return false;
        if (!signerDocument.trim() || signerDocument.length > 20) return false;
        if (!signerEmail.trim() || signerEmail.length > 150) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signerEmail)) return false;
        return true;
    }

    submitSign(): void {
        if (!this.isFormValid || this.submitting) return;

        this.submitting = true;

        const body: any = {
            signerName: this.form.signerName.trim(),
            signerDocument: this.form.signerDocument.trim(),
            signerEmail: this.form.signerEmail.trim(),
        };

        if (this.form.signatureData?.trim()) {
            body.signatureData = this.form.signatureData.trim();
        }

        this.http.post(`${this.apiUrl}/sign/${this.token}`, body).subscribe({
            next: () => {
                this.state = 'success';
                this.submitting = false;
            },
            error: (err: HttpErrorResponse) => {
                this.submitting = false;
                if (err.status === 400) {
                    this.errorMessage = err.error?.message || 'Error al procesar la solicitud.';
                    this.state = 'error';
                } else {
                    this.errorMessage = 'Ocurrió un error inesperado. Intente nuevamente.';
                    this.state = 'error';
                }
            },
        });
    }

    private loadFormatData(): void {
        this.state = 'loading';

        this.http.get<ReceptionFormatData>(`${this.apiUrl}/sign/${this.token}`).subscribe({
            next: (response) => {
                this.data = response;
                if (response.isAccepted) {
                    this.state = 'accepted';
                } else {
                    this.state = 'valid';
                }
            },
            error: (err: HttpErrorResponse) => {
                this.errorMessage = 'El enlace no es válido o ha expirado. Solicite un nuevo envío al administrador.';
                this.state = 'error';
            },
        });
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }
}
