import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income } from './entities/income.entity';
import { CreateIncomeEventDto } from './dto/create-income-event.dto';
import { IncomeFrequency } from './enums/income-frequency.enum';

@Injectable()
export class IncomesService {
    private readonly logger = new Logger(IncomesService.name);

    constructor(
        @InjectRepository(Income)
        private readonly incomeRepository: Repository<Income>,
    ) { }

    async findAllByEmployee(employeeId: string): Promise<Income[]> {
        return this.incomeRepository.find({
            where: { employeeId, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }

    async calculateTotalIncome(employeeId: string): Promise<number> {
        const incomes = await this.findAllByEmployee(employeeId);
        // Basic calculation logic - this might need refinement based on frequency
        // For now, summing up monthly equivalent of active incomes
        // Assuming SALARY is monthly, others might vary. 
        // NOTE: This is a basic implementation as requested.
        return incomes.reduce((total, income) => {
            // For one-off, we might not want to include in a "monthly total" calculation
            // typically "Total Income" usually means recurring monthly income in HR context
            if (income.frequency === IncomeFrequency.ONE_OFF) return total;

            let monthlyAmount = Number(income.amount);
            if (income.frequency === IncomeFrequency.BIWEEKLY) {
                monthlyAmount *= 2;
            }

            return total + monthlyAmount;
        }, 0);
    }

    async handleIncomeUpdate(payload: CreateIncomeEventDto): Promise<void> {
        this.logger.log(`Processing income update for source: ${payload.sourceType} ${payload.sourceId}`);

        // Find existing income based on source
        const existingIncome = await this.findIncomeBySource(payload.sourceType, payload.sourceId, payload.employeeId);

        if (existingIncome) {
            // Update
            existingIncome.amount = payload.amount;
            existingIncome.concept = payload.concept;
            existingIncome.frequency = payload.frequency || IncomeFrequency.MONTHLY; // Default if not provided
            existingIncome.type = payload.type;
            existingIncome.isActive = true; // Reactivate if it was soft deleted

            await this.incomeRepository.save(existingIncome);
            this.logger.log(`Updated income for ${payload.sourceType} ${payload.sourceId}`);
        } else {
            // Create
            const newIncome = this.incomeRepository.create({
                employeeId: payload.employeeId,
                amount: payload.amount,
                concept: payload.concept,
                frequency: payload.frequency || IncomeFrequency.MONTHLY,
                type: payload.type,
                isActive: true,
            });

            // Set the correct source ID
            this.setSourceId(newIncome, payload.sourceType, payload.sourceId);

            await this.incomeRepository.save(newIncome);
            this.logger.log(`Created new income for ${payload.sourceType} ${payload.sourceId}`);
        }
    }

    async handleIncomeDeletion(sourceType: 'CONTRACT' | 'BONUS' | 'TICKET', sourceId: number, employeeId?: string): Promise<void> {
        // If employeeId is provided, we can be more specific, otherwise query by source
        // Ideally the event should contain enough info to identify the record

        let queryBuilder = this.incomeRepository.createQueryBuilder('income');

        if (sourceType === 'CONTRACT') {
            queryBuilder.where('income.sourceContractId = :sourceId', { sourceId });
        } else if (sourceType === 'BONUS') {
            queryBuilder.where('income.sourceBonusId = :sourceId', { sourceId });
        } else if (sourceType === 'TICKET') {
            queryBuilder.where('income.sourceTicketId = :sourceId', { sourceId });
        }

        if (employeeId) {
            queryBuilder.andWhere('income.employeeId = :employeeId', { employeeId });
        }

        const income = await queryBuilder.getOne();

        if (income) {
            income.isActive = false;
            await this.incomeRepository.save(income);
            this.logger.log(`Soft deleted income for ${sourceType} ${sourceId}`);
        } else {
            this.logger.warn(`Income not found for deletion: ${sourceType} ${sourceId}`);
        }
    }

    private async findIncomeBySource(sourceType: string, sourceId: number, employeeId: string): Promise<Income | null> {
        const where: any = { employeeId };

        if (sourceType === 'CONTRACT') {
            where.sourceContractId = sourceId;
        } else if (sourceType === 'BONUS') {
            where.sourceBonusId = sourceId;
        } else if (sourceType === 'TICKET') {
            where.sourceTicketId = sourceId;
        } else {
            return null;
        }

        return this.incomeRepository.findOne({ where });
    }

    private setSourceId(income: Income, sourceType: string, sourceId: number) {
        if (sourceType === 'CONTRACT') {
            income.sourceContractId = sourceId;
        } else if (sourceType === 'BONUS') {
            income.sourceBonusId = sourceId;
        } else if (sourceType === 'TICKET') {
            income.sourceTicketId = sourceId;
        }
    }
}
