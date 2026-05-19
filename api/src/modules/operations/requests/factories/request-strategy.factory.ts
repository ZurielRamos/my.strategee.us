import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { IRequestStrategy } from '../strategies/request-strategy.interface';
import { VacationStrategy } from '../strategies/vacation.strategy';
import { DocumentStrategy } from '../strategies/document.strategy';
import { RequestType } from '../enums/request-type.enum';
import { BenefitStrategy } from '../strategies/benefit.strategy';
import { BirthdayStrategy } from '../strategies/birthday.strategy';
import { OrdinaryPermissionStrategy } from '../strategies/ordinary-permission.strategy';
import { SickLeaveStrategy } from '../strategies/sick-leave.strategy';
import { MedicalAppointmentStrategy } from '../strategies/medical-appointment.strategy';
import { CompensatedTimeAccumulationStrategy } from '../strategies/compensated-time-accumulation.strategy';
import { CompensatedTimeUsageStrategy } from '../strategies/compensated-time-usage.strategy';
import { EnergyzeDayAccumulationStrategy } from '../strategies/energyze-day-accumulation.strategy';
import { EnergyzeDayUsageStrategy } from '../strategies/energyze-day-usage.strategy';
import { GiftedDayUsageStrategy } from '../strategies/gifted-day-usage.strategy';

@Injectable()
export class RequestStrategyFactory {
    // Mapa de estrategias
    private strategies: Map<string, IRequestStrategy> = new Map();

    constructor(
        // Inyectamos las estrategias concretas
        @Inject(forwardRef(() => VacationStrategy))
        private readonly vacationStrategy: VacationStrategy,
        private readonly documentStrategy: DocumentStrategy,
        private readonly benefitStrategy: BenefitStrategy,
        private readonly birthdayStrategy: BirthdayStrategy,
        private readonly ordinaryPermissionStrategy: OrdinaryPermissionStrategy,
        private readonly sickLeaveStrategy: SickLeaveStrategy,
        private readonly medicalAppointmentStrategy: MedicalAppointmentStrategy,
        @Inject(forwardRef(() => CompensatedTimeAccumulationStrategy))
        private readonly compensatedTimeAccumulationStrategy: CompensatedTimeAccumulationStrategy,
        @Inject(forwardRef(() => CompensatedTimeUsageStrategy))
        private readonly compensatedTimeUsageStrategy: CompensatedTimeUsageStrategy,
        @Inject(forwardRef(() => EnergyzeDayAccumulationStrategy))
        private readonly energyzeDayAccumulationStrategy: EnergyzeDayAccumulationStrategy,
        @Inject(forwardRef(() => EnergyzeDayUsageStrategy))
        private readonly energyzeDayUsageStrategy: EnergyzeDayUsageStrategy,
        @Inject(forwardRef(() => GiftedDayUsageStrategy))
        private readonly giftedDayUsageStrategy: GiftedDayUsageStrategy,
    ) {
        // Registramos las estrategias
        this.registerStrategy(RequestType.VACATION, vacationStrategy);
        this.registerStrategy(RequestType.DOCUMENT, documentStrategy);
        this.registerStrategy(RequestType.BENEFIT, benefitStrategy);
        this.registerStrategy(RequestType.BIRTHDAY, birthdayStrategy);
        this.registerStrategy(RequestType.ORDINARY_PERMISSION, ordinaryPermissionStrategy);
        this.registerStrategy(RequestType.SICK_LEAVE, sickLeaveStrategy);
        this.registerStrategy(RequestType.MEDICAL_APPOINTMENT, medicalAppointmentStrategy);
        this.registerStrategy(RequestType.COMPENSATED_TIME_ACCUMULATION, compensatedTimeAccumulationStrategy);
        this.registerStrategy(RequestType.COMPENSATED_TIME_USAGE, compensatedTimeUsageStrategy);
        this.registerStrategy(RequestType.ENERGYZE_DAY_ACCUMULATION, energyzeDayAccumulationStrategy);
        this.registerStrategy(RequestType.ENERGYZE_DAY_USAGE, energyzeDayUsageStrategy);
        this.registerStrategy(RequestType.GIFTED_DAY_USAGE, giftedDayUsageStrategy);
    }

    private registerStrategy(type: RequestType, strategy: IRequestStrategy) {
        this.strategies.set(type, strategy);
    }

    getStrategy(type: RequestType): IRequestStrategy {
        const strategy = this.strategies.get(type);
        if (!strategy) {
            throw new BadRequestException(`No hay una estrategia definida para el tipo de solicitud: ${type}`);
        }
        return strategy;
    }
}
