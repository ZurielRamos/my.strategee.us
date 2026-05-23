import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingQuiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizOption } from './entities/quiz-option.entity';
import { TrainingMaterial } from './entities/training-material.entity';
import { CreateQuizDto, QuizQuestionDto } from './dto/create-quiz.dto';

@Injectable()
export class TrainingQuizService {
  constructor(
    @InjectRepository(TrainingQuiz)
    private readonly quizRepository: Repository<TrainingQuiz>,
    @InjectRepository(QuizQuestion)
    private readonly questionRepository: Repository<QuizQuestion>,
    @InjectRepository(QuizOption)
    private readonly optionRepository: Repository<QuizOption>,
    @InjectRepository(TrainingMaterial)
    private readonly materialRepository: Repository<TrainingMaterial>,
  ) {}

  async save(materialId: string, dto: CreateQuizDto): Promise<TrainingQuiz> {
    // 1. Verificar que el material existe
    const material = await this.materialRepository.findOne({ where: { id: materialId } });
    if (!material) {
      throw new NotFoundException(`Material con id ${materialId} no encontrado`);
    }

    // 2. Validar que cada pregunta tenga exactamente una opción correcta
    for (const question of dto.questions) {
      const correctOptions = question.options.filter((o) => o.isCorrect);
      if (correctOptions.length !== 1) {
        throw new BadRequestException('Cada pregunta debe tener exactamente una opción correcta');
      }
    }

    // 3. Validar que cada pregunta tenga al menos 2 opciones
    for (const question of dto.questions) {
      if (question.options.length < 2) {
        throw new BadRequestException('Cada pregunta debe tener al menos 2 opciones');
      }
    }

    // 4. Si ya existe un quiz para ese material, eliminarlo con sus preguntas y opciones
    const existingQuiz = await this.quizRepository.findOne({
      where: { materialId },
      relations: ['questions', 'questions.options'],
    });
    if (existingQuiz) {
      // Eliminar opciones primero, luego preguntas, luego quiz
      for (const question of existingQuiz.questions ?? []) {
        if (question.options?.length) {
          await this.optionRepository.delete({ questionId: question.id });
        }
      }
      if (existingQuiz.questions?.length) {
        await this.questionRepository.delete({ quizId: existingQuiz.id });
      }
      await this.quizRepository.delete({ id: existingQuiz.id });
    }

    // 5. Calcular scores automáticos
    const autoScore = parseFloat((100 / dto.questions.length).toFixed(2));
    const questionsWithScore = dto.questions.map((q) => ({
      ...q,
      score: q.score !== undefined && q.score !== null ? q.score : autoScore,
    }));

    // 6. Crear el quiz
    const quiz = this.quizRepository.create({
      materialId,
      passingScore: dto.passingScore,
    });
    const savedQuiz = await this.quizRepository.save(quiz);

    // Crear preguntas con sus opciones
    for (const questionDto of questionsWithScore) {
      const question = this.questionRepository.create({
        quizId: savedQuiz.id,
        text: questionDto.text,
        score: questionDto.score,
        orderIndex: questionDto.orderIndex,
      });
      const savedQuestion = await this.questionRepository.save(question);

      for (const optionDto of questionDto.options) {
        const option = this.optionRepository.create({
          questionId: savedQuestion.id,
          text: optionDto.text,
          isCorrect: optionDto.isCorrect,
          orderIndex: optionDto.orderIndex,
        });
        await this.optionRepository.save(option);
      }
    }

    // 7. Retornar el quiz con relaciones
    return this.quizRepository.findOne({
      where: { id: savedQuiz.id },
      relations: ['questions', 'questions.options'],
    }) as Promise<TrainingQuiz>;
  }

  async remove(materialId: string): Promise<{ message: string }> {
    const quiz = await this.quizRepository.findOne({
      where: { materialId },
      relations: ['questions', 'questions.options'],
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz para el material con id ${materialId} no encontrado`);
    }

    // Eliminar en orden: opciones → preguntas → quiz
    for (const question of quiz.questions ?? []) {
      if (question.options?.length) {
        await this.optionRepository.delete({ questionId: question.id });
      }
    }
    if (quiz.questions?.length) {
      await this.questionRepository.delete({ quizId: quiz.id });
    }
    await this.quizRepository.delete({ id: quiz.id });

    return { message: 'Quiz eliminado correctamente' };
  }
}
