import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './entities/position.entity';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Contract } from '../../core/contracts/entities/contract.entity';
import { DependencyConflictException, EntityDependency } from '@common/exceptions/dependency-conflict.exception';

@Injectable()
export class PositionsService {
    constructor(
        @InjectRepository(Position)
        private readonly positionsRepository: Repository<Position>,
        @InjectRepository(Contract)
        private readonly contractsRepository: Repository<Contract>,
    ) { }

    async create(createPositionDto: CreatePositionDto): Promise<Position> {
        const position = this.positionsRepository.create(createPositionDto);
        return this.positionsRepository.save(position);
    }

    async findAll(): Promise<Position[]> {
        return this.positionsRepository.find();
    }

    async findOne(id: string): Promise<Position> {
        const position = await this.positionsRepository.findOne({
            where: { id }
        });
        if (!position) {
            throw new NotFoundException(`Cargo con ID ${id} no encontrado`);
        }
        return position;
    }

    async update(id: string, updatePositionDto: UpdatePositionDto): Promise<Position> {
        const position = await this.positionsRepository.findOne({
            where: { id }
        });
        
        if (!position) {
            throw new NotFoundException(`Cargo con ID ${id} no encontrado`);
        }

        await this.positionsRepository.update(id, updatePositionDto);
        
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const position = await this.findOne(id);

        // Check for dependencies
        const dependencies = await this.checkDependencies(id);

        if (dependencies.length > 0) {
            throw new DependencyConflictException(
                'No se puede eliminar el cargo porque está siendo utilizado',
                dependencies,
            );
        }

        await this.positionsRepository.remove(position);
    }

    /**
     * Check if the position has any dependencies (contracts via memorandums)
     */
    private async checkDependencies(positionId: string): Promise<EntityDependency[]> {
        const dependencies: EntityDependency[] = [];

        // Check contracts (via memorandums which reference positions)
        const contracts = await this.contractsRepository
            .createQueryBuilder('contract')
            .innerJoin('contract.memorandums', 'memorandum')
            .where('memorandum.positionId = :positionId', { positionId })
            .take(3)
            .leftJoinAndSelect('contract.employee', 'employee')
            .getMany();

        if (contracts.length > 0) {
            const totalContracts = await this.contractsRepository
                .createQueryBuilder('contract')
                .innerJoin('contract.memorandums', 'memorandum')
                .where('memorandum.positionId = :positionId', { positionId })
                .getCount();

            dependencies.push({
                entity: 'contracts',
                count: totalContracts,
                examples: contracts.map(c =>
                    c.employee ? `Contrato de ${c.employee.firstName} ${c.employee.lastName}` : `Contrato ${c.id}`
                ),
            });
        }

        return dependencies;
    }
}
