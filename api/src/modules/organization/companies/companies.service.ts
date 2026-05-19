import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { Department } from '../departments/entities/department.entity';
import { Contract } from '../../core/contracts/entities/contract.entity';
import { DependencyConflictException, EntityDependency } from '@common/exceptions/dependency-conflict.exception';

@Injectable()
export class CompaniesService {
    constructor(
        @InjectRepository(Company)
        private readonly companiesRepository: Repository<Company>,
        @InjectRepository(Department)
        private readonly departmentsRepository: Repository<Department>,
        @InjectRepository(Contract)
        private readonly contractsRepository: Repository<Contract>,
    ) { }

    async create(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
        const existingCompany = await this.companiesRepository.findOne({
            where: { nit: createCompanyDto.nit },
        });

        if (existingCompany) {
            throw new ConflictException('Ya existe una empresa con este NIT');
        }

        const company = this.companiesRepository.create(createCompanyDto);
        const savedCompany = await this.companiesRepository.save(company);
        
        // Reload to get the logo relation if logoId was provided
        if (savedCompany.logoId) {
            return this.findOne(savedCompany.id);
        }
        
        return this.mapToResponseDto(savedCompany);
    }

    async findAll(): Promise<CompanyResponseDto[]> {
        const companies = await this.companiesRepository
            .createQueryBuilder('company')
            .leftJoinAndSelect('company.logo', 'logo')
            .select([
                'company.id',
                'company.name',
                'company.legalName',
                'company.nit',
                'company.address',
                'company.logoId',
                'company.createdAt',
                'company.updatedAt',
                'logo.variants'
            ])
            .getMany();

        return companies.map(company => this.mapToResponseDto(company));
    }

    async findOne(id: string): Promise<CompanyResponseDto> {
        const company = await this.companiesRepository
            .createQueryBuilder('company')
            .leftJoinAndSelect('company.logo', 'logo')
            .select([
                'company.id',
                'company.name',
                'company.legalName',
                'company.nit',
                'company.address',
                'company.logoId',
                'company.createdAt',
                'company.updatedAt',
                'logo.variants'
            ])
            .where('company.id = :id', { id })
            .getOne();
            
        if (!company) {
            throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
        }
        
        return this.mapToResponseDto(company);
    }

    async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyResponseDto> {
        const company = await this.companiesRepository.findOne({ where: { id } });
        
        if (!company) {
            throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
        }

        if (updateCompanyDto.nit && updateCompanyDto.nit !== company.nit) {
            const existingCompany = await this.companiesRepository.findOne({
                where: { nit: updateCompanyDto.nit },
            });
            if (existingCompany) {
                throw new ConflictException('Ya existe una empresa con este NIT');
            }
        }

        Object.assign(company, updateCompanyDto);
        await this.companiesRepository.save(company);
        
        // Reload to get the logo relation
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const company = await this.companiesRepository.findOne({ where: { id } });
        
        if (!company) {
            throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
        }

        // Check for dependencies
        const dependencies = await this.checkDependencies(id);

        if (dependencies.length > 0) {
            throw new DependencyConflictException(
                'No se puede eliminar la empresa porque está siendo utilizada',
                dependencies,
            );
        }

        await this.companiesRepository.remove(company);
    }

    private mapToResponseDto(company: Company): CompanyResponseDto {
        return {
            id: company.id,
            name: company.name,
            legalName: company.legalName,
            nit: company.nit,
            address: company.address,
            logoUrl: company.logo?.variants?.small || undefined,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
        };
    }

    /**
     * Check if the company has any dependencies (departments or contracts)
     */
    private async checkDependencies(companyId: string): Promise<EntityDependency[]> {
        const dependencies: EntityDependency[] = [];

        // Check departments
        const departments = await this.departmentsRepository.find({
            where: { companyId },
            take: 3,
        });

        if (departments.length > 0) {
            const totalDepartments = await this.departmentsRepository.count({
                where: { companyId },
            });

            dependencies.push({
                entity: 'departments',
                count: totalDepartments,
                examples: departments.map(d => d.name),
            });
        }

        // Check contracts
        const contracts = await this.contractsRepository.find({
            where: { companyId },
            take: 3,
            relations: ['employee'],
        });

        if (contracts.length > 0) {
            const totalContracts = await this.contractsRepository.count({
                where: { companyId },
            });

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
