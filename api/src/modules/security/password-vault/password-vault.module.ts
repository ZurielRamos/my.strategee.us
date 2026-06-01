import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordVaultController } from './password-vault.controller';
import { PasswordVaultService } from './password-vault.service';
import { EncryptionService } from './services/encryption.service';
import { AccessControlService } from './services/access-control.service';
import { Vault } from './entities/vault.entity';
import { Credential } from './entities/credential.entity';
import { CredentialAccessLog } from './entities/credential-access-log.entity';
import { CredentialVisibilityCompany } from './entities/credential-visibility-company.entity';
import { CredentialVisibilityArea } from './entities/credential-visibility-area.entity';
import { CredentialVisibilityPosition } from './entities/credential-visibility-position.entity';
import { CredentialVisibilityEmployee } from './entities/credential-visibility-employee.entity';
import { VaultVisibilityCompany } from './entities/vault-visibility-company.entity';
import { VaultVisibilityArea } from './entities/vault-visibility-area.entity';
import { VaultVisibilityPosition } from './entities/vault-visibility-position.entity';
import { VaultVisibilityEmployee } from './entities/vault-visibility-employee.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Company } from '@modules/organization/companies/entities/company.entity';
import { Area } from '@modules/organization/areas/entities/area.entity';
import { Position } from '@modules/organization/positions/entities/position.entity';
import { Contract } from '@modules/core/contracts/entities/contract.entity';
import { Memorandum } from '@modules/core/contracts/entities/memorandum.entity';
import { EmployeesModule } from '@modules/core/employees/employees.module';
import { CompaniesModule } from '@modules/organization/companies/companies.module';
import { PositionsModule } from '@modules/organization/positions/positions.module';
import { ContractsModule } from '@modules/core/contracts/contracts.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Vault,
            Credential,
            CredentialAccessLog,
            CredentialVisibilityCompany,
            CredentialVisibilityArea,
            CredentialVisibilityPosition,
            CredentialVisibilityEmployee,
            VaultVisibilityCompany,
            VaultVisibilityArea,
            VaultVisibilityPosition,
            VaultVisibilityEmployee,
            Employee,
            Company,
            Area,
            Position,
            Contract,
            Memorandum,
        ]),
        EmployeesModule,
        CompaniesModule,
        PositionsModule,
        ContractsModule,
    ],
    controllers: [PasswordVaultController],
    providers: [
        PasswordVaultService,
        EncryptionService,
        AccessControlService,
    ],
    exports: [PasswordVaultService],
})
export class PasswordVaultModule {}
