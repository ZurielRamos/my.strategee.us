import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';

export class QuizAnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @IsUUID()
  optionId: string;
}

export class SubmitQuizAttemptDto {
  @ApiProperty({ type: [QuizAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
