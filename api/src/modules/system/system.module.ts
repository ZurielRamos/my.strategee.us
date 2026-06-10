import { Module } from '@nestjs/common';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { BahamasModule } from './bahamas/bahamas.module';

@Module({
    imports: [SystemSettingsModule, ApiKeysModule, BahamasModule],
    exports: [SystemSettingsModule, ApiKeysModule, BahamasModule]
})
export class SystemModule {}
