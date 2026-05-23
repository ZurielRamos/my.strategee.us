import {
    Component, Input, OnDestroy, OnChanges, SimpleChanges,
    ElementRef, ViewChild, ChangeDetectorRef, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    chevronBackOutline, chevronForwardOutline,
    expandOutline, contractOutline,
    addOutline, removeOutline
} from 'ionicons/icons';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { environment } from 'src/environments/environment';

// Worker local servido como asset — sin restricciones de CSP
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';

@Component({
    selector: 'app-pdf-viewer',
    templateUrl: './pdf-viewer.component.html',
    styleUrls: ['./pdf-viewer.component.scss'],
    standalone: true,
    imports: [CommonModule, IonIcon, IonSpinner]
})
export class PdfViewerComponent implements OnDestroy, OnChanges {
    @Input() attachmentId!: string;  // ID del attachment — se usa para el proxy del backend

    @ViewChild('pageCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('viewerContainer', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

    pdfDoc: PDFDocumentProxy | null = null;
    totalPages = 0;
    currentPage = 1;
    isLoading = true;
    hasError = false;
    isFullscreen = false;
    scale = 1.0;

    isFlipping = false;
    flipDirection: 'forward' | 'backward' = 'forward';

    private renderTask: any = null;

    constructor(
        private cdr: ChangeDetectorRef,
        private zone: NgZone,
        private http: HttpClient
    ) {
        addIcons({ chevronBackOutline, chevronForwardOutline, expandOutline, contractOutline, addOutline, removeOutline });
        document.addEventListener('fullscreenchange', this.onFullscreenChange);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['attachmentId'] && this.attachmentId) {
            this.loadPdf();
        }
    }

    ngOnDestroy() {
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
        this.renderTask?.cancel();
        this.pdfDoc?.destroy();
    }

    private onFullscreenChange = () => {
        this.zone.run(() => {
            this.isFullscreen = !!document.fullscreenElement;
            this.cdr.detectChanges();
            setTimeout(() => this.renderCurrentPage(), 150);
        });
    };

    async loadPdf() {
        this.isLoading = true;
        this.hasError = false;
        this.currentPage = 1;
        this.renderTask?.cancel();
        this.pdfDoc?.destroy();
        this.pdfDoc = null;
        this.cdr.detectChanges();

        try {
            // Descargar el PDF via proxy del backend — evita CORS con Firebase Storage
            const proxyUrl = `${environment.apiUrl}/attachments/${this.attachmentId}/proxy`;
            const arrayBuffer = await this.http
                .get(proxyUrl, { responseType: 'arraybuffer' })
                .toPromise();

            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/cmaps/`,
                cMapPacked: true,
            });

            this.pdfDoc = await loadingTask.promise;
            this.totalPages = this.pdfDoc.numPages;
            this.isLoading = false;
            this.cdr.detectChanges();
            await this.renderCurrentPage();
        } catch (err: any) {
            console.error('Error loading PDF:', err);
            this.hasError = true;
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    async renderCurrentPage() {
        if (!this.pdfDoc) return;

        // Esperar a que el canvas esté disponible en el DOM
        await new Promise(r => setTimeout(r, 0));
        if (!this.canvasRef?.nativeElement) return;

        this.renderTask?.cancel();

        const page = await this.pdfDoc.getPage(this.currentPage);
        const canvas = this.canvasRef.nativeElement;
        const container = this.containerRef?.nativeElement;

        const containerWidth = Math.max((container?.clientWidth ?? 700) - 96, 300);
        const viewport1 = page.getViewport({ scale: 1 });
        const autoScale = containerWidth / viewport1.width;
        const finalScale = autoScale * this.scale;

        const viewport = page.getViewport({ scale: finalScale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.renderTask = page.render({ canvasContext: ctx, viewport });
        try {
            await this.renderTask.promise;
        } catch (e: any) {
            if (e?.name !== 'RenderingCancelledException') console.error(e);
        }
    }

    // ─── Navegación ──────────────────────────────────────────────────────────

    get canGoBack(): boolean { return this.currentPage > 1; }
    get canGoForward(): boolean { return this.currentPage < this.totalPages; }

    async nextPage() {
        if (!this.canGoForward || this.isFlipping) return;
        this.flipDirection = 'forward';
        this.isFlipping = true;
        this.cdr.detectChanges();
        await new Promise(r => setTimeout(r, 180));
        this.currentPage++;
        await this.renderCurrentPage();
        await new Promise(r => setTimeout(r, 180));
        this.isFlipping = false;
        this.cdr.detectChanges();
    }

    async prevPage() {
        if (!this.canGoBack || this.isFlipping) return;
        this.flipDirection = 'backward';
        this.isFlipping = true;
        this.cdr.detectChanges();
        await new Promise(r => setTimeout(r, 180));
        this.currentPage--;
        await this.renderCurrentPage();
        await new Promise(r => setTimeout(r, 180));
        this.isFlipping = false;
        this.cdr.detectChanges();
    }

    // ─── Zoom ────────────────────────────────────────────────────────────────

    async zoomIn() {
        this.scale = Math.min(this.scale + 0.2, 3.0);
        await this.renderCurrentPage();
    }

    async zoomOut() {
        this.scale = Math.max(this.scale - 0.2, 0.4);
        await this.renderCurrentPage();
    }

    // ─── Pantalla completa ───────────────────────────────────────────────────

    toggleFullscreen() {
        const el = this.containerRef?.nativeElement;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}
