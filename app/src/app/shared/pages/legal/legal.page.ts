import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import {
    LEGAL_CONFIG_PENDING,
    LEGAL_DOCUMENTS,
    LEGAL_UPDATED,
    LEGAL_VERSION,
    LegalDocument,
} from '../../legal/legal-content';

@Component({
    selector: 'app-legal',
    templateUrl: './legal.page.html',
    styleUrls: ['./legal.page.scss'],
    standalone: true,
    imports: [CommonModule, RouterLink, IonContent],
})
export class LegalPage implements OnInit {
    document: LegalDocument | null = null;
    readonly version = LEGAL_VERSION;
    readonly updated = LEGAL_UPDATED;
    readonly otherDocuments = Object.values(LEGAL_DOCUMENTS);

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        const slug = this.route.snapshot.paramMap.get('doc') || '';
        this.document = LEGAL_DOCUMENTS[slug] ?? null;
        if (LEGAL_CONFIG_PENDING) {
            console.warn('LEGAL_CONFIG tiene datos pendientes por completar (shared/legal/legal-content.ts).');
        }
    }
}
