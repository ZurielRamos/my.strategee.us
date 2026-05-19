import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Memorandum } from '../../core/contracts/entities/memorandum.entity';
import { DependencyConflictException, EntityDependency } from '@common/exceptions/dependency-conflict.exception';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
        @InjectRepository(Memorandum)
        private readonly memorandumsRepository: Repository<Memorandum>,
    ) { }

    async create(createLocationDto: CreateLocationDto): Promise<Location> {
        // Check if a location with the same name exists
        const existingLocation = await this.locationsRepository.findOne({
            where: { name: createLocationDto.name },
        });

        if (existingLocation) {
            throw new ConflictException('Ya existe una ubicación con este nombre');
        }

        const location = this.locationsRepository.create(createLocationDto);
        return this.locationsRepository.save(location);
    }

    async findAll(): Promise<Location[]> {
        return this.locationsRepository.find({
            order: { name: 'ASC' },
        });
    }

    async findAllActive(): Promise<Location[]> {
        return this.locationsRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Location> {
        const location = await this.locationsRepository.findOne({
            where: { id },
        });

        if (!location) {
            throw new NotFoundException(`Ubicación con ID ${id} no encontrada`);
        }

        return location;
    }

    async update(id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
        const location = await this.findOne(id);

        // Check for name conflict if name is being updated
        if (updateLocationDto.name && updateLocationDto.name !== location.name) {
            const existingLocation = await this.locationsRepository.findOne({
                where: { name: updateLocationDto.name },
            });

            if (existingLocation) {
                throw new ConflictException('Ya existe una ubicación con este nombre');
            }
        }

        Object.assign(location, updateLocationDto);
        return this.locationsRepository.save(location);
    }

    async remove(id: string): Promise<void> {
        const location = await this.findOne(id);

        // Check for dependencies
        const dependencies = await this.checkDependencies(id);

        if (dependencies.length > 0) {
            throw new DependencyConflictException(
                'No se puede eliminar la ubicación porque está siendo utilizada',
                dependencies,
            );
        }

        await this.locationsRepository.remove(location);
    }

    async toggleActive(id: string): Promise<Location> {
        const location = await this.findOne(id);
        location.isActive = !location.isActive;
        return this.locationsRepository.save(location);
    }

    /**
     * Check if the location has any dependencies (memorandums)
     */
    private async checkDependencies(locationId: string): Promise<EntityDependency[]> {
        const dependencies: EntityDependency[] = [];

        // Check memorandums
        const memorandums = await this.memorandumsRepository.find({
            where: { locationId },
            take: 3,
            relations: ['contract', 'contract.employee'],
        });

        if (memorandums.length > 0) {
            const totalMemorandums = await this.memorandumsRepository.count({
                where: { locationId },
            });

            dependencies.push({
                entity: 'memorandums',
                count: totalMemorandums,
                examples: memorandums.map(m =>
                    m.contract?.employee
                        ? `Memorando de ${m.contract.employee.firstName} ${m.contract.employee.lastName}`
                        : `Memorando ${m.id}`
                ),
            });
        }

        return dependencies;
    }
}
