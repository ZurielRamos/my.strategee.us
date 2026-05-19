import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeParafiscales } from './entities/employee-parafiscales.entity';
import { UpsertParafiscalesDto } from './dto/upsert-parafiscales.dto';

@Injectable()
export class ParafiscalesService {
    constructor(
        @InjectRepository(EmployeeParafiscales)
        private readonly repo: Repository<EmployeeParafiscales>,
    ) {}

    /**
     * Obtiene la configuración de parafiscales de un empleado.
     * Retorna null si aún no tiene configuración.
     */
    async findByEmployee(employeeId: string): Promise<EmployeeParafiscales | null> {
        return this.repo.findOne({ where: { employeeId } });
    }

    /**
     * Crea o actualiza la configuración de parafiscales de un empleado.
     */
    async upsert(employeeId: string, dto: UpsertParafiscalesDto): Promise<EmployeeParafiscales> {
        let record = await this.repo.findOne({ where: { employeeId } });

        if (!record) {
            record = this.repo.create({ employeeId });
        }

        record.eps = dto.eps ?? record.eps ?? null;
        record.arl = dto.arl ?? record.arl ?? null;
        record.fondoPension = dto.fondoPension ?? record.fondoPension ?? null;
        record.cajaCompensacion = dto.cajaCompensacion ?? record.cajaCompensacion ?? null;

        return this.repo.save(record);
    }
}
