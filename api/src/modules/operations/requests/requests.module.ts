import { DocumentStrategy } from "./strategies/document.strategy";
import { VacationStrategy } from "./strategies/vacation.strategy";
import { RequestStrategyFactory } from "./factories/request-strategy.factory";
import { RequestsService } from "./requests.service";
import { RequestsController } from "./requests.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Request } from "./entities/request.entity";
import { Module, forwardRef } from "@nestjs/common";
import { BenefitStrategy } from "./strategies/benefit.strategy";
import { HttpModule } from "@nestjs/axios";
import { BirthdayStrategy } from "./strategies/birthday.strategy";
import { OrdinaryPermissionStrategy } from "./strategies/ordinary-permission.strategy";
import { SickLeaveStrategy } from "./strategies/sick-leave.strategy";
import { MedicalAppointmentStrategy } from "./strategies/medical-appointment.strategy";
import { CompensatedTimeAccumulationStrategy } from "./strategies/compensated-time-accumulation.strategy";
import { CompensatedTimeUsageStrategy } from "./strategies/compensated-time-usage.strategy";
import { EnergyzeDayAccumulationStrategy } from "./strategies/energyze-day-accumulation.strategy";
import { EnergyzeDayUsageStrategy } from "./strategies/energyze-day-usage.strategy";
import { GiftedDayUsageStrategy } from "./strategies/gifted-day-usage.strategy";
import { VacationsModule } from "../vacations/vacations.module";
import { EmployeesModule } from "@modules/core/employees/employees.module";
import { BenefitsModule } from "@modules/core/benefits/benefits.module";
import { CompensatedTimeModule } from "../compensated-time/compensated-time.module";
import { EnergyzeDaysModule } from "../energyze-days/energyze-days.module";
import { GiftedDaysModule } from "../gifted-days/gifted-days.module";
import { SystemSettingsModule } from "@modules/system/system-settings/system-settings.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Request]),
    forwardRef(() => VacationsModule),
    forwardRef(() => CompensatedTimeModule),
    forwardRef(() => EnergyzeDaysModule),
    forwardRef(() => GiftedDaysModule),
    HttpModule,
    EmployeesModule,
    BenefitsModule,
    SystemSettingsModule
  ],
  controllers: [RequestsController],
  providers: [
    RequestsService,
    RequestStrategyFactory,
    // Registrar estrategias como providers
    VacationStrategy,
    DocumentStrategy,
    BenefitStrategy,
    BirthdayStrategy,
    OrdinaryPermissionStrategy,
    SickLeaveStrategy,
    MedicalAppointmentStrategy,
    CompensatedTimeAccumulationStrategy,
    CompensatedTimeUsageStrategy,
    EnergyzeDayAccumulationStrategy,
    EnergyzeDayUsageStrategy,
    GiftedDayUsageStrategy
  ],
  exports: [RequestsService, RequestStrategyFactory],
})
export class RequestsModule { }