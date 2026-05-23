import { Controller, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { TrainingQuizService } from './training-quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';

@ApiTags('Quizzes de Capacitación')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('trainings/materials')
export class TrainingQuizController {
  constructor(private readonly quizService: TrainingQuizService) {}

  @Post('/:materialId/quiz')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear o reemplazar el quiz de un material' })
  save(
    @Param('materialId') materialId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizService.save(materialId, dto);
  }

  @Patch('/:materialId/quiz')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar el quiz de un material (reemplaza el existente)' })
  update(
    @Param('materialId') materialId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizService.save(materialId, dto);
  }

  @Delete('/:materialId/quiz')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar el quiz de un material' })
  remove(@Param('materialId') materialId: string) {
    return this.quizService.remove(materialId);
  }
}
