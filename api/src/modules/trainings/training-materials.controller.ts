import { Controller, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { TrainingMaterialsService } from './training-materials.service';
import { CreateTrainingMaterialDto } from './dto/create-training-material.dto';
import { ReorderMaterialsDto } from './dto/reorder-materials.dto';

@ApiTags('Materiales de Capacitación')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('trainings')
export class TrainingMaterialsController {
  constructor(private readonly materialsService: TrainingMaterialsService) {}

  @Post('/:id/materials')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir un material (PDF o video) a una capacitación' })
  upload(
    @Param('id') trainingId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateTrainingMaterialDto,
  ) {
    return this.materialsService.upload(trainingId, file, dto);
  }

  @Patch('/:id/materials/reorder')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reordenar los materiales de una capacitación' })
  reorder(
    @Param('id') trainingId: string,
    @Body() dto: ReorderMaterialsDto,
  ) {
    return this.materialsService.reorder(trainingId, dto);
  }

  @Delete('/:id/materials/:materialId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un material de una capacitación' })
  remove(
    @Param('id') trainingId: string,
    @Param('materialId') materialId: string,
  ) {
    return this.materialsService.remove(trainingId, materialId);
  }
}
