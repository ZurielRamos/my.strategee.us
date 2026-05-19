import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IncomesService } from './incomes.service';
import { CreateIncomeEventDto } from './dto/create-income-event.dto';

@Injectable()
export class IncomesListener {
    private readonly logger = new Logger(IncomesListener.name);

    constructor(private readonly incomesService: IncomesService) { }

    @OnEvent('income.source.created')
    @OnEvent('income.source.updated')
    async handleIncomeUpsert(payload: CreateIncomeEventDto) {
        this.logger.log(`Received income upsert event: ${JSON.stringify(payload)}`);
        try {
            await this.incomesService.handleIncomeUpdate(payload);
        } catch (error) {
            this.logger.error(`Error processing income upsert: ${error.message}`, error.stack);
        }
    }

    @OnEvent('income.source.deleted')
    async handleIncomeDeletion(payload: { sourceType: 'CONTRACT' | 'BONUS' | 'TICKET', sourceId: number, employeeId?: string }) {
        this.logger.log(`Received income deletion event: ${JSON.stringify(payload)}`);
        try {
            await this.incomesService.handleIncomeDeletion(payload.sourceType, payload.sourceId, payload.employeeId);
        } catch (error) {
            this.logger.error(`Error processing income deletion: ${error.message}`, error.stack);
        }
    }
}
