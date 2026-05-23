import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
    IonContent,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonProgressBar,
    IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    arrowBackOutline,
    checkmarkCircleOutline,
    lockClosedOutline,
    documentTextOutline,
    videocamOutline,
    helpCircleOutline,
    chevronForwardOutline,
    refreshOutline,
    openOutline,
    arrowForwardOutline,
    schoolOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TrainingsEmployeeService, QuizAnswer } from '../services/trainings-employee.service';
import { MyTraining, MyTrainingMaterial, QuizSubmitResult } from '../models/my-training.model';
import { ToastService } from '../../../shared/services/toast.service';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';

type PlayerView = 'material' | 'quiz' | 'quiz-result';

@Component({
    selector: 'app-training-player',
    templateUrl: './training-player.page.html',
    styleUrls: ['./training-player.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonContent,
        IonIcon,
        IonSpinner,
        IonBadge,
        IonProgressBar,
        IonButton,
        PageHeaderComponent,
        PdfViewerComponent
    ]
})
export class TrainingPlayerPage implements OnInit {
    training: MyTraining | null = null;
    isLoading = false;
    isSubmitting = false;

    activeMaterial: MyTrainingMaterial | null = null;
    currentView: PlayerView = 'material';
    safePdfUrl: SafeResourceUrl | null = null;

    // Quiz state
    selectedAnswers: Record<string, string> = {};
    quizResult: QuizSubmitResult | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private trainingsService: TrainingsEmployeeService,
        private toastService: ToastService,
        private sanitizer: DomSanitizer
    ) {
        addIcons({
            arrowBackOutline,
            checkmarkCircleOutline,
            lockClosedOutline,
            documentTextOutline,
            videocamOutline,
            helpCircleOutline,
            chevronForwardOutline,
            refreshOutline,
            openOutline,
            arrowForwardOutline,
            schoolOutline
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadTraining(id);
        }
    }

    loadTraining(id: string, onLoaded?: () => void) {
        this.isLoading = true;
        this.trainingsService.getMyTrainingDetail(id).subscribe({
            next: (training) => {
                this.training = training;
                this.isLoading = false;
                if (onLoaded) {
                    onLoaded();
                    return;
                }
                // Abrir el primer material accesible no completado
                const firstPending = training.materials.find(
                    m => m.isAccessible && !m.progress?.isCompleted
                );
                if (firstPending) {
                    this.openMaterial(firstPending);
                } else if (training.materials.length > 0) {
                    this.openMaterial(training.materials[0]);
                }
            },
            error: (error) => {
                console.error('Error loading training:', error);
                this.isLoading = false;
                this.toastService.error('Error al cargar la capacitación');
            }
        });
    }

    openMaterial(material: MyTrainingMaterial) {
        if (!material.isAccessible) return;
        this.activeMaterial = material;
        this.currentView = 'material';
        this.selectedAnswers = {};
        this.quizResult = null;
        // Sanitizar la URL del PDF para que Angular la acepte en el iframe
        if (material.attachment?.mimeType === 'application/pdf') {
            this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(material.attachment.url);
        } else {
            this.safePdfUrl = null;
        }
    }

    goBack() {
        this.router.navigate(['/employee/trainings']);
    }

    // ─── Material completion ──────────────────────────────────────────────────

    onVideoEnded() {
        if (!this.activeMaterial) return;
        if (this.activeMaterial.quiz) {
            this.currentView = 'quiz';
        } else {
            this.completeMaterial();
        }
    }

    onPdfFinished() {
        if (!this.activeMaterial) return;
        if (this.activeMaterial.quiz) {
            this.currentView = 'quiz';
        } else {
            this.completeMaterial();
        }
    }

    private completeMaterial() {
        if (!this.training || !this.activeMaterial) return;
        this.isSubmitting = true;

        this.trainingsService.completeMaterial(this.training.id, this.activeMaterial.id).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.loadTraining(this.training!.id);
            },
            error: (error) => {
                console.error('Error completing material:', error);
                this.isSubmitting = false;
                this.toastService.error('Error al registrar el progreso');
            }
        });
    }

    // ─── Quiz ─────────────────────────────────────────────────────────────────

    selectAnswer(questionId: string, optionId: string) {
        this.selectedAnswers = { ...this.selectedAnswers, [questionId]: optionId };
    }

    isAnswerSelected(questionId: string, optionId: string): boolean {
        return this.selectedAnswers[questionId] === optionId;
    }

    get allQuestionsAnswered(): boolean {
        if (!this.activeMaterial?.quiz) return false;
        return this.activeMaterial.quiz.questions.every(
            q => !!this.selectedAnswers[q.id]
        );
    }

    submitQuiz() {
        if (!this.training || !this.activeMaterial?.quiz || !this.allQuestionsAnswered) return;
        this.isSubmitting = true;

        const answers: QuizAnswer[] = Object.entries(this.selectedAnswers).map(
            ([questionId, optionId]) => ({ questionId, optionId })
        );

        this.trainingsService.submitQuiz(this.training.id, this.activeMaterial.id, answers).subscribe({
            next: (result) => {
                this.quizResult = result;
                this.isSubmitting = false;
                if (result.passed) {
                    // Recargar para actualizar isAccessible del siguiente material
                    const currentMaterialId = this.activeMaterial!.id;
                    this.loadTraining(this.training!.id, () => {
                        // Restaurar activeMaterial al material actual (ya completado)
                        const refreshed = this.training!.materials.find(m => m.id === currentMaterialId);
                        if (refreshed) this.activeMaterial = refreshed;
                        this.currentView = 'quiz-result';
                    });
                } else {
                    this.currentView = 'quiz-result';
                }
            },

            error: (error) => {
                console.error('Error submitting quiz:', error);
                this.isSubmitting = false;
                this.toastService.error('Error al enviar las respuestas');
            }
        });
    }

    get nextMaterial(): MyTrainingMaterial | null {
        if (!this.training || !this.activeMaterial) return null;
        const sorted = this.sortedMaterials;
        const currentIndex = sorted.findIndex(m => m.id === this.activeMaterial!.id);
        const next = sorted[currentIndex + 1];
        return next?.isAccessible ? next : null;
    }

    goToNextMaterial() {
        const next = this.nextMaterial;
        if (next) this.openMaterial(next);
    }

    retryQuiz() {
        this.selectedAnswers = {};
        this.quizResult = null;
        this.currentView = 'quiz';
    }

    isIncorrectQuestion(questionId: string): boolean {
        if (!this.quizResult) return false;
        return this.quizResult.incorrectQuestions.some(q => q.questionId === questionId);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    get sortedMaterials(): MyTrainingMaterial[] {
        if (!this.training?.materials) return [];
        return [...this.training.materials].sort((a, b) => a.orderIndex - b.orderIndex);
    }

    get overallProgress(): number {
        if (!this.training?.materials?.length) return 0;
        const completed = this.training.materials.filter(m => m.progress?.isCompleted).length;
        return completed / this.training.materials.length;
    }

    get completedCount(): number {
        return this.training?.materials.filter(m => m.progress?.isCompleted).length ?? 0;
    }

    getMaterialIcon(mimeType: string | undefined): string {
        if (mimeType?.startsWith('video/')) return 'videocam-outline';
        return 'document-text-outline';
    }

    isActiveMaterial(material: MyTrainingMaterial): boolean {
        return this.activeMaterial?.id === material.id;
    }
}
