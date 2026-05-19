import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IncomesService } from './incomes.service';
import { Income } from './entities/income.entity';

@ApiTags('Incomes')
@Controller('Incomes')
export class IncomesController {
    constructor(private readonly incomesService: IncomesService) { }


    @ApiOperation({ summary: 'Consulta todos los ingresos activos de un empleado' })
    @ApiParam({ name: 'id', description: 'The UUID of the employee', type: 'string' })
    @ApiResponse({ status: 200, description: 'List of active incomes for the employee.', type: [Income] })
    @Get('employee/:id')
    async findAllByEmployee(@Param('id') id: string): Promise<Income[]> {
        return this.incomesService.findAllByEmployee(id);
    }
}
