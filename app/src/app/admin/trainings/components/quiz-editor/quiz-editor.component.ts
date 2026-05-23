import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    FormArray,
    ReactiveFormsModule,
    Validators,
    AbstractControl
} from '@angular/forms';
import {
    IonButton,
    IonIcon,
    IonRange,
    IonSpinner,
    AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline,
    trashOutline,
    saveOutline,
    closeCircleOutline,
    checkmarkCircleOutline
} from 'ionicons/icons';
import { TrainingsAdminService, SaveQuizDto } from '../../services/trainings-admin.service';
import { TrainingQuiz } from '../../models/training.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-quiz-editor',
    templateUrl: './quiz-editor.component.html',
    styleUrls: ['./quiz-editor.component.scss'],
    standalone: true,
    providers: [AlertController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonButton,
        IonIcon,
        IonRange,
        IonSpinner
    ]
})
export class QuizEditorComponent implements OnInit {
    @Input() materialId!: string;
    @Input() quiz: TrainingQuiz | null = null;
    @Output() quizSaved = new EventEmitter<TrainingQuiz>();
    @Output() quizDeleted = new EventEmitter<void>();

    form!: FormGroup;
    isSaving = false;
    isDeleting = false;

    constructor(
        private fb: FormBuilder,
        private trainingsAdminService: TrainingsAdminService,
        private toastService: ToastService,
        private alertCtrl: AlertController
    ) {
        addIcons({ addOutline, trashOutline, saveOutline, closeCircleOutline, checkmarkCircleOutline });
    }

    ngOnInit() {
        this.buildForm();
    }

    private buildForm() {
        const questions = this.quiz?.questions ?? [];

        this.form = this.fb.group({
            passingScore: [this.quiz?.passingScore ?? 70, [Validators.required, Validators.min(1), Validators.max(100)]],
            questions: this.fb.array(
                questions.length > 0
                    ? questions
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map(q => this.buildQuestionGroup(q))
                    : [this.buildQuestionGroup()]
            )
        });
    }

    private buildQuestionGroup(question?: any): FormGroup {
        const options = question?.options ?? [];
        return this.fb.group({
            text: [question?.text ?? '', [Validators.required]],
            score: [question?.score ?? null],
            options: this.fb.array(
                options.length >= 2
                    ? options
                        .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                        .map((o: any) => this.buildOptionGroup(o))
                    : [this.buildOptionGroup(), this.buildOptionGroup()]
            )
        });
    }

    private buildOptionGroup(option?: any): FormGroup {
        return this.fb.group({
            text: [option?.text ?? '', [Validators.required]],
            isCorrect: [option?.isCorrect ?? false]
        });
    }

    // ─── Getters ──────────────────────────────────────────────────────────────

    get questionsArray(): FormArray {
        return this.form.get('questions') as FormArray;
    }

    getOptionsArray(questionIndex: number): FormArray {
        return this.questionsArray.at(questionIndex).get('options') as FormArray;
    }

    get passingScore(): number {
        return this.form.get('passingScore')?.value ?? 70;
    }

    // ─── Questions ────────────────────────────────────────────────────────────

    addQuestion() {
        this.questionsArray.push(this.buildQuestionGroup());
    }

    removeQuestion(index: number) {
        if (this.questionsArray.length > 1) {
            this.questionsArray.removeAt(index);
        }
    }

    // ─── Options ──────────────────────────────────────────────────────────────

    addOption(questionIndex: number) {
        const options = this.getOptionsArray(questionIndex);
        if (options.length < 6) {
            options.push(this.buildOptionGroup());
        }
    }

    removeOption(questionIndex: number, optionIndex: number) {
        const options = this.getOptionsArray(questionIndex);
        if (options.length > 2) {
            options.removeAt(optionIndex);
        }
    }

    setCorrectOption(questionIndex: number, correctIndex: number) {
        const options = this.getOptionsArray(questionIndex);
        options.controls.forEach((ctrl, i) => {
            ctrl.get('isCorrect')?.setValue(i === correctIndex);
        });
    }

    isCorrectOption(questionIndex: number, optionIndex: number): boolean {
        return this.getOptionsArray(questionIndex).at(optionIndex).get('isCorrect')?.value === true;
    }

    // ─── Save ─────────────────────────────────────────────────────────────────

    async onSave() {
        if (this.form.invalid || this.isSaving) return;

        // Validate each question has exactly one correct option
        for (let i = 0; i < this.questionsArray.length; i++) {
            const options = this.getOptionsArray(i).value as { text: string; isCorrect: boolean }[];
            const correctCount = options.filter(o => o.isCorrect).length;
            if (correctCount !== 1) {
                await this.toastService.error(`La pregunta ${i + 1} debe tener exactamente una opción correcta.`);
                return;
            }
        }

        this.isSaving = true;
        const formValue = this.form.value;

        const dto: SaveQuizDto = {
            passingScore: formValue.passingScore,
            questions: formValue.questions.map((q: any, qi: number) => ({
                text: q.text,
                score: q.score ?? undefined,
                orderIndex: qi,
                options: q.options.map((o: any, oi: number) => ({
                    text: o.text,
                    isCorrect: o.isCorrect,
                    orderIndex: oi
                }))
            }))
        };

        this.trainingsAdminService.saveQuiz(this.materialId, dto).subscribe({
            next: async (result) => {
                await this.toastService.success('Quiz guardado correctamente');
                this.isSaving = false;
                this.quizSaved.emit(result);
            },
            error: async (error) => {
                console.error('Error saving quiz:', error);
                let errorMessage = 'Error al guardar el quiz';
                if (error.error?.message) {
                    errorMessage = Array.isArray(error.error.message)
                        ? error.error.message.join(', ')
                        : error.error.message;
                }
                await this.toastService.error(errorMessage);
                this.isSaving = false;
            }
        });
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    async confirmDelete() {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar Quiz',
            message: '¿Estás seguro de que deseas eliminar este quiz? Esta acción no se puede deshacer.',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => this.deleteQuiz()
                }
            ]
        });
        await alert.present();
    }

    private deleteQuiz() {
        this.isDeleting = true;
        this.trainingsAdminService.removeQuiz(this.materialId).subscribe({
            next: async () => {
                await this.toastService.success('Quiz eliminado correctamente');
                this.isDeleting = false;
                this.quizDeleted.emit();
            },
            error: async (error) => {
                console.error('Error deleting quiz:', error);
                await this.toastService.error('Error al eliminar el quiz');
                this.isDeleting = false;
            }
        });
    }
}
