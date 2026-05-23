import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingMaterial } from './entities/training-material.entity';
import { Training } from './entities/training.entity';
import { TrainingQuiz } from './entities/quiz.entity';
import { CreateTrainingMaterialDto } from './dto/create-training-material.dto';
import { ReorderMaterialsDto } from './dto/reorder-materials.dto';
import { AttachmentsService } from '@modules/infrastructure/attachments/attachments.service';
import { AttachmentFolder } from '@modules/infrastructure/attachments/enums/attachment-folder.enum';

const ALLOWED_MIME_TYPES = ['application/pdf', 'video/mp4', 'video/webm', 'video/ogg'];

@Injectable()
export class TrainingMaterialsService {
  constructor(
    @InjectRepository(TrainingMaterial)
    private readonly materialRepository: Repository<TrainingMaterial>,
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
    @InjectRepository(TrainingQuiz)
    private readonly quizRepository: Repository<TrainingQuiz>,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  // ─── Upload ──────────────────────────────────────────────────────────────────

  async upload(
    trainingId: string,
    file: Express.Multer.File,
    dto: CreateTrainingMaterialDto,
  ): Promise<TrainingMaterial> {
    // 1. Validar mimetype
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan PDF (application/pdf) y video (video/mp4, video/webm, video/ogg).`,
      );
    }

    // 2. Verificar que la training existe
    const training = await this.trainingRepository.findOne({ where: { id: trainingId } });
    if (!training) {
      throw new NotFoundException(`Training #${trainingId} no encontrada`);
    }

    // 3. Subir archivo a Firebase
    const attachment = await this.attachmentsService.upload(file, {
      folder: AttachmentFolder.TRAININGS,
      title: dto.title,
    });

    // 4. Calcular orderIndex: max + 1 (o 0 si no hay materiales)
    const lastMaterial = await this.materialRepository.find({
      where: { trainingId },
      order: { orderIndex: 'DESC' },
      take: 1,
    });
    const orderIndex = lastMaterial.length > 0 ? lastMaterial[0].orderIndex + 1 : 0;

    // 5. Crear y guardar el material
    const material = this.materialRepository.create({
      trainingId,
      attachmentId: attachment.id,
      title: dto.title,
      orderIndex,
    });
    const saved = await this.materialRepository.save(material);

    // 6. Retornar con relación attachment cargada
    return this.materialRepository.findOne({
      where: { id: saved.id },
      relations: ['attachment'],
    }) as Promise<TrainingMaterial>;
  }

  // ─── Reorder ─────────────────────────────────────────────────────────────────

  async reorder(trainingId: string, dto: ReorderMaterialsDto): Promise<TrainingMaterial[]> {
    // 1. Verificar que la training existe
    const training = await this.trainingRepository.findOne({ where: { id: trainingId } });
    if (!training) {
      throw new NotFoundException(`Training #${trainingId} no encontrada`);
    }

    // 2. Actualizar orderIndex de cada material en paralelo
    await Promise.all(
      dto.items.map((item) =>
        this.materialRepository.update(
          { id: item.materialId, trainingId },
          { orderIndex: item.orderIndex },
        ),
      ),
    );

    // 3. Retornar materiales ordenados por orderIndex ASC
    return this.materialRepository.find({
      where: { trainingId },
      order: { orderIndex: 'ASC' },
      relations: ['attachment'],
    });
  }

  // ─── Remove ──────────────────────────────────────────────────────────────────

  async remove(trainingId: string, materialId: string): Promise<{ message: string }> {
    // 1. Buscar el material con relaciones quiz y attachment
    const material = await this.materialRepository.findOne({
      where: { id: materialId },
      relations: ['quiz', 'attachment'],
    });

    // 2. Verificar que existe y pertenece a la training
    if (!material || material.trainingId !== trainingId) {
      throw new NotFoundException(
        `Material #${materialId} no encontrado en la training #${trainingId}`,
      );
    }

    // 3. Si tiene quiz, eliminarlo (cascade elimina preguntas y opciones)
    if (material.quiz) {
      await this.quizRepository.remove(material.quiz);
    }

    // 4. Eliminar el attachment de Firebase Storage
    if (material.attachmentId) {
      await this.attachmentsService.remove(material.attachmentId);
    }

    // 5. Eliminar el material
    await this.materialRepository.remove(material);

    return { message: 'Material eliminado correctamente' };
  }
}
