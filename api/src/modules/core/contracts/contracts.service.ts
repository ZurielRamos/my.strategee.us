import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { Memorandum } from './entities/memorandum.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateMemorandumDto } from './dto/create-memorandum.dto';
import { SalaryType } from './enums/salary-type.enum';
import { GlobalParametersService } from '@modules/finance/global-parameters/global-parameters.service';
import { GlobalParameterKey } from '@modules/finance/global-parameters/enums/global-parameter-key.enum';
import { ContractStatus } from './enums/contract-status.enum';
import { ContractType } from './enums/contract-type.enum';
import { Employee } from '../employees/entities/employee.entity';

export interface EmploymentInfo {
    type: ContractType | null;
    startDate: Date | null;
    companyId: string | null;
    positionId: string | null;
    departmentId: string | null;
    source: 'contract' | 'employee';
}

@Injectable()
export class ContractsService {
    constructor(
        @InjectRepository(Contract)
        private readonly contractsRepository: Repository<Contract>,
        @InjectRepository(Memorandum)
        private readonly memorandumsRepository: Repository<Memorandum>,
        @InjectRepository(Employee)
        private readonly employeesRepository: Repository<Employee>,
        private readonly globalParametersService: GlobalParametersService,
    ) { }

    async create(createContractDto: CreateContractDto): Promise<Contract> {
        const { initialMemorandum, ...contractData } = createContractDto;

        // Validation: Check for existing active contract if the new one is ACTIVE
        if (contractData.status === ContractStatus.ACTIVE) {
            const existingActiveContract = await this.findActiveByEmployee(contractData.employeeId);
            if (existingActiveContract) {
                // Auto-liquidate existing active contract to allow new one
                existingActiveContract.status = ContractStatus.LIQUIDATED;
                // Set endDate to yesterday if not present
                if (!existingActiveContract.endDate) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    existingActiveContract.endDate = yesterday;
                }
                await this.contractsRepository.save(existingActiveContract);
            }
        }

        const contract = this.contractsRepository.create(contractData);
        const savedContract = await this.contractsRepository.save(contract);

        await this.addMemorandum(savedContract.id, initialMemorandum);

        return this.findOne(savedContract.id);
    }

    async findAll(): Promise<Contract[]> {
        return this.contractsRepository.find({
            relations: ['employee', 'company', 'memorandums', 'memorandums.position', 'memorandums.department'],
        });
    }

    async findOne(id: string): Promise<Contract> {
        const contract = await this.contractsRepository.findOne({
            where: { id },
            relations: ['employee', 'company', 'memorandums', 'memorandums.position', 'memorandums.department'],
        });

        if (!contract) {
            throw new NotFoundException(`Contrato con ID ${id} no encontrado`);
        }

        // Identify current memorandum (latest startDate among active ones based on dates)
        const currentMemorandum = this.getCurrentMemorandum(contract.memorandums);

        // Inject parameter salary if applicable
        if (currentMemorandum && currentMemorandum.salaryType === SalaryType.PARAMETER && currentMemorandum.parameterKey) {
            try {
                // Fetch current value of the parameter
                const parameterValue = await this.globalParametersService.getValue(currentMemorandum.parameterKey);
                currentMemorandum.salaryAmount = parameterValue;
            } catch (error) {
                // If parameter not found, keep original salaryAmount or log error
            }
        }

        // Attach virtual property for current memorandum
        (contract as any).currentMemorandum = currentMemorandum;

        return contract;
    }

    async update(id: string, updateContractDto: UpdateContractDto): Promise<Contract> {
        const contract = await this.findOne(id);

        if (updateContractDto.status === ContractStatus.ACTIVE && contract.status !== ContractStatus.ACTIVE) {
            // Check if user is trying to activate this contract
            const existingActiveContract = await this.findActiveByEmployee(contract.employeeId);
            if (existingActiveContract && existingActiveContract.id !== id) {
                // Auto-liquidate existing active contract
                existingActiveContract.status = ContractStatus.LIQUIDATED;
                if (!existingActiveContract.endDate) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    existingActiveContract.endDate = yesterday;
                }
                await this.contractsRepository.save(existingActiveContract);
            }
        }

        Object.assign(contract, updateContractDto);
        return this.contractsRepository.save(contract);
    }

    async addMemorandum(contractId: string, createMemorandumDto: CreateMemorandumDto): Promise<Memorandum> {
        const contract = await this.contractsRepository.findOne({
            where: { id: contractId },
            relations: ['memorandums']
        });
        if (!contract) {
            throw new NotFoundException(`Contrato con ID ${contractId} no encontrado`);
        }

        const memorandum = this.memorandumsRepository.create({
            ...createMemorandumDto,
            contractId,
        });

        if (memorandum.salaryType === SalaryType.PARAMETER && memorandum.parameterKey) {
            // Optionally fetch current value to store as initial snapshot, or keep as 0/null
            // Let's store the current value as a snapshot
            try {
                const currentValue = await this.globalParametersService.getValue(memorandum.parameterKey, new Date(memorandum.startDate));
                memorandum.salaryAmount = currentValue;
            } catch (e) {
                memorandum.salaryAmount = 0;
            }
        }

        const savedMemorandum = await this.memorandumsRepository.save(memorandum);

        return savedMemorandum;
    }

    /**
     * Elimina un memorandum pendiente
     */
    async deleteMemorandum(memorandumId: string): Promise<void> {
        const memorandum = await this.memorandumsRepository.findOne({
            where: { id: memorandumId }
        });

        if (!memorandum) {
            throw new NotFoundException(`Memorando con ID ${memorandumId} no encontrado`);
        }

        // Verificar que el memorando esté pendiente (startDate > now)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startDate = new Date(memorandum.startDate);
        startDate.setHours(0, 0, 0, 0);

        if (startDate <= now) {
            throw new BadRequestException('Solo se pueden eliminar memorandos pendientes (que aún no han iniciado)');
        }

        await this.memorandumsRepository.remove(memorandum);
    }

    /**
     * Helper method to get the current active memorandum based on dates
     */
    private getCurrentMemorandum(memorandums: Memorandum[]): Memorandum | undefined {
        if (!memorandums || memorandums.length === 0) return undefined;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Filter memorandums that are currently active (startDate <= now && (!endDate || endDate >= now))
        const activeMemorandums = memorandums.filter(m => {
            const start = new Date(m.startDate);
            start.setHours(0, 0, 0, 0);
            const end = m.endDate ? new Date(m.endDate) : null;
            if (end) end.setHours(0, 0, 0, 0);

            return start <= now && (!end || end >= now);
        });

        // Sort by startDate descending and return the most recent one
        const sortedMemorandums = activeMemorandums.sort((a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        return sortedMemorandums[0];
    }

    async remove(id: string): Promise<void> {
        const contract = await this.findOne(id);
        await this.contractsRepository.remove(contract);
    }

    /**
     * Obtiene todos los contratos de un empleado (historial completo)
     */
    async findAllByEmployee(employeeId: string): Promise<Contract[]> {
        const contracts = await this.contractsRepository.find({
            where: { employeeId },
            relations: ['employee', 'company', 'memorandums', 'memorandums.position', 'memorandums.department'],
            order: { createdAt: 'DESC' }
        });

        // Process each contract to inject current memorandum data
        for (const contract of contracts) {
            const currentMemorandum = this.getCurrentMemorandum(contract.memorandums);

            if (currentMemorandum && currentMemorandum.salaryType === SalaryType.PARAMETER && currentMemorandum.parameterKey) {
                try {
                    const parameterValue = await this.globalParametersService.getValue(currentMemorandum.parameterKey);
                    currentMemorandum.salaryAmount = parameterValue;
                } catch (error) {
                    // Fallback
                }
            }

            (contract as any).currentMemorandum = currentMemorandum;
        }

        return contracts;
    }

    /**
     * Cancela/Liquida un contrato cambiando su estado a LIQUIDATED
     */
    async cancel(id: string): Promise<Contract> {
        const contract = await this.findOne(id);
        contract.status = ContractStatus.LIQUIDATED;
        
        // Set endDate to today if not present
        if (!contract.endDate) {
            contract.endDate = new Date();
        }
        
        return this.contractsRepository.save(contract);
    }

    /**
     * Activa un contrato (liquida el contrato activo previo si existe)
     */
    async activate(id: string): Promise<Contract> {
        const contract = await this.findOne(id);
        
        // Verificar que el contrato no esté ya activo
        if (contract.status === ContractStatus.ACTIVE) {
            return contract;
        }

        // Buscar y liquidar el contrato activo previo del mismo empleado
        const existingActiveContract = await this.findActiveByEmployee(contract.employeeId);
        if (existingActiveContract && existingActiveContract.id !== id) {
            existingActiveContract.status = ContractStatus.LIQUIDATED;
            if (!existingActiveContract.endDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                existingActiveContract.endDate = yesterday;
            }
            await this.contractsRepository.save(existingActiveContract);
        }

        // Activar el contrato
        contract.status = ContractStatus.ACTIVE;
        return this.contractsRepository.save(contract);
    }

    /**
     * Suspende un contrato activo
     */
    async suspend(id: string): Promise<Contract> {
        const contract = await this.findOne(id);
        
        // Verificar que el contrato esté activo
        if (contract.status !== ContractStatus.ACTIVE) {
            throw new BadRequestException('Solo se pueden suspender contratos activos');
        }

        contract.status = ContractStatus.SUSPENDED;
        return this.contractsRepository.save(contract);
    }

    async findActiveByEmployee(employeeId: string): Promise<Contract | null> {
        const contract = await this.contractsRepository.findOne({
            where: {
                employeeId: employeeId,
                status: ContractStatus.ACTIVE
            },
            relations: ['employee', 'company', 'memorandums', 'memorandums.position', 'memorandums.department'],
        });

        if (contract) {
            const currentMemorandum = this.getCurrentMemorandum(contract.memorandums);

            if (currentMemorandum && currentMemorandum.salaryType === SalaryType.PARAMETER && currentMemorandum.parameterKey) {
                try {
                    const parameterValue = await this.globalParametersService.getValue(currentMemorandum.parameterKey);
                    currentMemorandum.salaryAmount = parameterValue;
                } catch (error) {
                    // Fallback or ignore
                }
            }

            (contract as any).currentMemorandum = currentMemorandum;
        }

        return contract;
    }

    /**
     * Datos laborales vigentes de un empleado (tipo de contrato, fecha de ingreso,
     * empresa, puesto y departamento/área).
     * Si tiene contrato activo se usan los del contrato (y su memorando vigente);
     * si no, los guardados en su información personal.
     * Devuelve null si el empleado no existe.
     */
    async findEmploymentInfo(employeeId: string): Promise<EmploymentInfo | null> {
        const contract = await this.findActiveByEmployee(employeeId);
        if (contract) {
            const memo = (contract as any).currentMemorandum as Memorandum | undefined;
            return {
                type: contract.type,
                startDate: contract.startDate,
                companyId: contract.companyId ?? null,
                positionId: memo?.positionId ?? null,
                departmentId: memo?.departmentId ?? null,
                source: 'contract',
            };
        }
        const employee = await this.employeesRepository.findOne({ where: { id: employeeId } });
        if (!employee) {
            return null;
        }
        return {
            type: employee.contractType ?? null,
            startDate: employee.hireDate ?? null,
            companyId: employee.companyId ?? null,
            positionId: employee.positionId ?? null,
            departmentId: employee.departmentId ?? null,
            source: 'employee',
        };
    }
}
