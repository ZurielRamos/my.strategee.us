import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTrainingMaterialDto {
  @ApiProperty({ example: 'Introducción a la seguridad industrial' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;
}
