import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Memorandum } from '../../core/contracts/entities/memorandum.entity';
import { DependencyConflictException, EntityDependency } from '@common/exceptions/dependency-conflict.exception';

@Injectable()
export class SchedulesService {
    constructor(
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,
        @InjectRepository(Memorandum)
        private readonly memorandumsRepository: Repository<Memorandum>,
    ) { }

    async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
        // Check if a schedule with the same name exists
        const existingSchedule = await this.schedulesRepository.findOne({
            where: { name: createScheduleDto.name },
        });

        if (existingSchedule) {
            throw new ConflictException('Ya existe un horario con este nombre');
        }

        // Validate no duplicate days
        const days = createScheduleDto.dailySchedules.map(d => d.day);
        const uniqueDays = new Set(days);
        if (days.length !== uniqueDays.size) {
            throw new ConflictException('No se pueden tener días duplicados en la configuración');
        }

        const schedule = this.schedulesRepository.create(createScheduleDto);
        return this.schedulesRepository.save(schedule);
    }

    async findAll(): Promise<Schedule[]> {
        return this.schedulesRepository.find({
            order: { name: 'ASC' },
        });
    }

    async findAllActive(): Promise<Schedule[]> {
        return this.schedulesRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Schedule> {
        const schedule = await this.schedulesRepository.findOne({
            where: { id },
        });

        if (!schedule) {
            throw new NotFoundException(`Horario con ID ${id} no encontrado`);
        }

        return schedule;
    }

    async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
        const schedule = await this.findOne(id);

        // Check for name conflict if name is being updated
        if (updateScheduleDto.name && updateScheduleDto.name !== schedule.name) {
            const existingSchedule = await this.schedulesRepository.findOne({
                where: { name: updateScheduleDto.name },
            });

            if (existingSchedule) {
                throw new ConflictException('Ya existe un horario con este nombre');
            }
        }

        // Validate no duplicate days if dailySchedules is being updated
        if (updateScheduleDto.dailySchedules) {
            const days = updateScheduleDto.dailySchedules.map(d => d.day);
            const uniqueDays = new Set(days);
            if (days.length !== uniqueDays.size) {
                throw new ConflictException('No se pueden tener días duplicados en la configuración');
            }
        }

        Object.assign(schedule, updateScheduleDto);
        return this.schedulesRepository.save(schedule);
    }

    async remove(id: string): Promise<void> {
        const schedule = await this.findOne(id);

        // Check for dependencies
        const dependencies = await this.checkDependencies(id);

        if (dependencies.length > 0) {
            throw new DependencyConflictException(
                'No se puede eliminar el horario porque está siendo utilizado',
                dependencies,
            );
        }

        await this.schedulesRepository.remove(schedule);
    }

    async toggleActive(id: string): Promise<Schedule> {
        const schedule = await this.findOne(id);
        schedule.isActive = !schedule.isActive;
        return this.schedulesRepository.save(schedule);
    }

    /**
     * Check if the schedule has any dependencies (memorandums)
     */
    private async checkDependencies(scheduleId: string): Promise<EntityDependency[]> {
        const dependencies: EntityDependency[] = [];

        // Check memorandums
        const memorandums = await this.memorandumsRepository.find({
            where: { scheduleId },
            take: 3,
            relations: ['contract', 'contract.employee'],
        });

        if (memorandums.length > 0) {
            const totalMemorandums = await this.memorandumsRepository.count({
                where: { scheduleId },
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
