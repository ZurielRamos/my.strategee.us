import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RegistrationLink } from './entities/registration-link.entity';
import { SubmitRegistrationDto } from './dto/submit-registration.dto';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { EmergencyContact } from '@modules/core/employees/entities/emergency-contact.entity';
import { EmployeeParafiscales } from '@modules/core/parafiscales/entities/employee-parafiscales.entity';
import { EmployeeStatus } from '@modules/core/employees/enums/employee-status.enum';
import { ContractType } from '@modules/core/contracts/enums/contract-type.enum';
import { Company } from '@modules/organization/companies/entities/company.entity';
import { Position } from '@modules/organization/positions/entities/position.entity';
import { Department } from '@modules/organization/departments/entities/department.entity';

@Injectable()
export class EmployeeRegistrationsService {
    constructor(
        @InjectRepository(RegistrationLink)
        private readonly linksRepository: Repository<RegistrationLink>,
        @InjectRepository(Employee)
        private readonly employeesRepository: Repository<Employee>,
        @InjectRepository(Company)
        private readonly companiesRepository: Repository<Company>,
        @InjectRepository(Position)
        private readonly positionsRepository: Repository<Position>,
        @InjectRepository(Department)
        private readonly departmentsRepository: Repository<Department>,
        private readonly dataSource: DataSource,
    ) { }

    // ---------------------------------------------------------------- admin

    async getActiveLink(): Promise<RegistrationLink | null> {
        return this.linksRepository.findOne({ where: { isActive: true }, order: { createdAt: 'DESC' } });
    }

    /** Genera un enlace nuevo e invalida los anteriores. */
    async generateLink(): Promise<RegistrationLink> {
        await this.linksRepository.update({ isActive: true }, { isActive: false });
        const link = this.linksRepository.create({
            token: crypto.randomBytes(24).toString('hex'),
            isActive: true,
        });
        return this.linksRepository.save(link);
    }

    async disableLink(): Promise<void> {
        await this.linksRepository.update({ isActive: true }, { isActive: false });
    }

    // --------------------------------------------------------------- público

    private async assertValidToken(token: string): Promise<void> {
        const link = await this.linksRepository.findOne({ where: { token, isActive: true } });
        if (!link) {
            throw new NotFoundException('El enlace de registro no es válido o ya no está disponible');
        }
    }

    async getOptions(token: string) {
        await this.assertValidToken(token);
        const [companies, positions, departments] = await Promise.all([
            this.companiesRepository.find({ select: { id: true, name: true }, order: { name: 'ASC' } }),
            this.positionsRepository.find({ select: { id: true, name: true }, order: { name: 'ASC' } }),
            this.departmentsRepository.find({ select: { id: true, name: true }, order: { name: 'ASC' } }),
        ]);
        return { companies, positions, departments, contractTypes: Object.values(ContractType) };
    }

    async submit(token: string, dto: SubmitRegistrationDto, ip: string | null = null): Promise<{ success: true }> {
        await this.assertValidToken(token);

        // Campo trampa: si viene lleno es un bot; se responde igual que un éxito.
        if (dto.website) {
            return { success: true };
        }

        const [company, position, department] = await Promise.all([
            this.companiesRepository.findOne({ where: { id: dto.companyId } }),
            this.positionsRepository.findOne({ where: { id: dto.positionId } }),
            this.departmentsRepository.findOne({ where: { id: dto.departmentId } }),
        ]);
        if (!company || !position || !department) {
            throw new BadRequestException('La empresa, el puesto o el departamento seleccionado no es válido');
        }

        const personalEmail = dto.personalEmail.trim().toLowerCase();
        const corporateEmail = dto.corporateEmail.trim().toLowerCase();
        const duplicated = await this.employeesRepository.findOne({
            where: [
                { documentNumber: dto.documentNumber.trim() },
                { personalEmail },
                { personalEmail: corporateEmail },
                { corporateEmail },
                { corporateEmail: personalEmail },
            ],
        });
        if (duplicated) {
            // Mensaje genérico para no revelar si un documento o correo ya existe
            throw new ConflictException(
                'Ya existe un registro con estos datos. Si crees que es un error, comunícate con Recursos Humanos.',
            );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const employee = queryRunner.manager.create(Employee, {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                documentType: dto.documentType,
                documentNumber: dto.documentNumber.trim(),
                birthDate: dto.birthDate as any,
                gender: dto.gender,
                address: dto.address.trim(),
                personalPhone: dto.personalPhone.trim(),
                personalEmail,
                corporateEmail,
                hireDate: dto.hireDate as any,
                contractType: dto.contractType,
                companyId: dto.companyId,
                positionId: dto.positionId,
                departmentId: dto.departmentId,
                isActive: false,
                status: EmployeeStatus.PENDING,
                termsAcceptedAt: new Date(),
                termsVersion: dto.termsVersion,
                termsAcceptedIp: ip ? ip.slice(0, 45) : null,
            });
            const saved = await queryRunner.manager.save(employee);

            await queryRunner.manager.save(
                dto.emergencyContacts.map((c) =>
                    queryRunner.manager.create(EmergencyContact, {
                        employeeId: saved.id,
                        name: c.name.trim(),
                        relationship: c.relationship.trim(),
                        phone: c.phone.trim(),
                        email: c.email?.trim() || null,
                    }),
                ),
            );

            await queryRunner.manager.save(
                queryRunner.manager.create(EmployeeParafiscales, {
                    employeeId: saved.id,
                    eps: dto.parafiscales.eps?.trim() || null,
                    arl: dto.parafiscales.arl?.trim() || null,
                    fondoPension: dto.parafiscales.fondoPension?.trim() || null,
                    cajaCompensacion: dto.parafiscales.cajaCompensacion?.trim() || null,
                }),
            );

            await queryRunner.commitTransaction();
            return { success: true };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
