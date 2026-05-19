import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location } from './entities/location.entity';
import { Memorandum } from '../../core/contracts/entities/memorandum.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Location, Memorandum])],
    controllers: [LocationsController],
    providers: [LocationsService],
    exports: [LocationsService],
})
export class LocationsModule { }
