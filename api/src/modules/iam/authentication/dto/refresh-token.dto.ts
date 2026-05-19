import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkOTNkNDNlNS02ZWRjLTQ2MjMtOGZiMC01NDg5ZTBmOWNmM2UiLCJlbWFpbCI6ImFkbWluQHN0cmF0ZWdlZS51cyIsInJvbGVzIjpbIkFETUlOIl0sImlhdCI6MTc3MDY1NDA5NiwiZXhwIjoxNzcxMjU4ODk2fQ.9JtGa3FeQWLzzTD6H_TVIz8T-SGNEMRvip5eFoVsuC8',
        description: 'Refresh token para obtener nuevos tokens de acceso',
    })
    @IsString()
    @IsNotEmpty({ message: 'El refresh token es requerido' })
    refreshToken: string;
}
