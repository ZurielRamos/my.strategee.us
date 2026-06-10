import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private readonly departmentsRepository: Repository<Department>,
    ) { }

    async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
        const department = this.departmentsRepository.create(createDepartmentDto);
        return this.departmentsRepository.save(department);
    }

    async findAll(): Promise<Department[]> {
        return this.departmentsRepository.find();
    }

    async findOne(id: string): Promise<Department> {
        const department = await this.departmentsRepository.findOne({
            where: { id }
        });
        if (!department) {
            throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
        }
        return department;
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
        const department = await this.departmentsRepository.findOne({
            where: { id }
        });
        
        if (!department) {
            throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
        }

        await this.departmentsRepository.update(id, updateDepartmentDto);
        
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const department = await this.findOne(id);
        await this.departmentsRepository.remove(department);
    }
}
