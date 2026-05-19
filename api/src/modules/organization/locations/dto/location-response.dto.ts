import { ApiProperty } from "@nestjs/swagger";


export class LocationResponseDto {
    @ApiProperty({ example: "8a1f2996-909a-42af-a636-6b609952a5da" })
    id: string;
    @ApiProperty({ example: "Oficina Principal" })
    name: string;
    @ApiProperty({ example: "Sede central de la empresa" })
    description: string;
    @ApiProperty({ example: "Calle 100 # 15-20" })
    address: string;
    @ApiProperty({ example: "Bogotá" })
    city: string;
    @ApiProperty({ example: "Colombia" })
    country: string;
    @ApiProperty({ example: true })
    isActive: boolean;
    @ApiProperty({ example: "2026-02-11T17:04:27.171Z" })
    createdAt: Date;
    @ApiProperty({ example: "2026-02-11T17:04:27.171Z" })
    updatedAt: Date;
}