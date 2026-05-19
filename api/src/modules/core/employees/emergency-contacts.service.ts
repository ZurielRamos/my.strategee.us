import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';

@Injectable()
export class EmergencyContactsService {
    constructor(
        @InjectRepository(EmergencyContact)
        private readonly repo: Repository<EmergencyContact>,
    ) {}

    async findByEmployee(employeeId: string): Promise<EmergencyContact[]> {
        return this.repo.find({
            where: { employeeId },
            order: { createdAt: 'ASC' },
        });
    }

    async create(employeeId: string, dto: CreateEmergencyContactDto): Promise<EmergencyContact> {
        const contact = this.repo.create({ ...dto, employeeId });
        return this.repo.save(contact);
    }

    async remove(id: number, employeeId: string): Promise<void> {
        const contact = await this.repo.findOne({ where: { id } });
        if (!contact) {
            throw new NotFoundException(`Contacto de emergencia con ID ${id} no encontrado`);
        }
        if (contact.employeeId !== employeeId) {
            throw new ForbiddenException('No tienes permiso para eliminar este contacto');
        }
        await this.repo.remove(contact);
    }

    async removeAsAdmin(id: number): Promise<void> {
        const contact = await this.repo.findOne({ where: { id } });
        if (!contact) {
            throw new NotFoundException(`Contacto de emergencia con ID ${id} no encontrado`);
        }
        await this.repo.remove(contact);
    }
}
