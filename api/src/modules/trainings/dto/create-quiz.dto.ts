import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuizOptionDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class QuizQuestionDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty({ required: false, description: 'Si no se provee, se calcula automáticamente' })
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiProperty({ type: [QuizOptionDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options: QuizOptionDto[];
}

export class CreateQuizDto {
  @ApiProperty({ minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  passingScore: number;

  @ApiProperty({ type: [QuizQuestionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}
