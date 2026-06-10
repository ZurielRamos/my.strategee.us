import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { Contract } from '../../core/contracts/entities/contract.entity';
import { Attachment } from '../../infrastructure/attachments/entities/attachment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Company, Contract, Attachment])],
    controllers: [CompaniesController],
    providers: [CompaniesService],
    exports: [CompaniesService],
})
export class CompaniesModule { }
