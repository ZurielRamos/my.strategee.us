import { Module } from '@nestjs/common';
import { SystemSettingsModule } from './system-settings/system-settings.module';

@Module({
    imports: [SystemSettingsModule],
    exports: [SystemSettingsModule]
})
export class SystemModule {}
