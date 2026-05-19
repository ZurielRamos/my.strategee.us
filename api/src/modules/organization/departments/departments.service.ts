import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CompaniesService } from '../companies/companies.service';
import { Position } from '../positions/entities/position.entity';
import { DependencyConflictException, EntityDependency } from '@common/exceptions/dependency-conflict.exception';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private readonly departmentsRepository: Repository<Department>,
        @InjectRepository(Position)
        private readonly positionsRepository: Repository<Position>,
        private readonly companiesService: CompaniesService,
    ) { }

    async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
        // Validar existence of company
        await this.companiesService.findOne(createDepartmentDto.companyId);

        const department = this.departmentsRepository.create(createDepartmentDto);
        return this.departmentsRepository.save(department);
    }

    async findAll(companyId?: string): Promise<Department[]> {
        if (companyId) {
            return this.departmentsRepository.find({ 
                where: { companyId },
                relations: ['company']
            });
        }
        return this.departmentsRepository.find({ relations: ['company'] });
    }

    async findOne(id: string): Promise<Department> {
        const department = await this.departmentsRepository.findOne({
            where: { id },
            relations: ['company']
        });
        if (!department) {
            throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
        }
        return department;
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
        // Find without relations to avoid conflicts
        const department = await this.departmentsRepository.findOne({
            where: { id }
        });
        
        if (!department) {
            throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
        }

        if (updateDepartmentDto.companyId) {
            await this.companiesService.findOne(updateDepartmentDto.companyId);
        }

        // Update using query builder to ensure DB update
        await this.departmentsRepository.update(id, updateDepartmentDto);
        
        // Reload with updated relations
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const department = await this.findOne(id);

        // Check for dependencies
        const dependencies = await this.checkDependencies(id);

        if (dependencies.length > 0) {
            throw new DependencyConflictException(
                'No se puede eliminar el departamento porque está siendo utilizado',
                dependencies,
            );
        }

        await this.departmentsRepository.remove(department);
    }

    /**
     * Check if the department has any dependencies (positions)
     */
    private async checkDependencies(departmentId: string): Promise<EntityDependency[]> {
        const dependencies: EntityDependency[] = [];

        // Check positions
        const positions = await this.positionsRepository.find({
            where: { departmentId },
            take: 3,
        });

        if (positions.length > 0) {
            const totalPositions = await this.positionsRepository.count({
                where: { departmentId },
            });

            dependencies.push({
                entity: 'positions',
                count: totalPositions,
                examples: positions.map(p => p.name),
            });
        }

        return dependencies;
    }
}
