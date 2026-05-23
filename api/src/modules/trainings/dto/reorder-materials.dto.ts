import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class MaterialOrderItemDto {
  @ApiProperty()
  @IsUUID()
  materialId: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class ReorderMaterialsDto {
  @ApiProperty({ type: [MaterialOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialOrderItemDto)
  items: MaterialOrderItemDto[];
}
