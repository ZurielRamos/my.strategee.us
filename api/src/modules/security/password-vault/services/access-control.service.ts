import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Memorandum } from '@modules/core/contracts/entities/memorandum.entity';
import { Credential } from '../entities/credential.entity';
import { Vault } from '../entities/vault.entity';
import { VisibilityLevel } from '../enums/visibility-level.enum';

@Injectable()
export class AccessControlService {
    constructor(
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Memorandum)
        private readonly memorandumRepository: Repository<Memorandum>,
        @InjectRepository(Vault)
        private readonly vaultRepository: Repository<Vault>,
    ) {}

    /**
     * Determina si un empleado puede acceder a una credencial.
     *
     * Reglas:
     * - PRIVATE: solo el creador. Nadie más.
     * - INHERIT: hereda la visibilidad del vault (directorio). Sube recursivamente.
     * - Cualquier otro nivel (PUBLIC, BY_COMPANY, etc.): se evalúa directamente.
     *   Si tiene acceso, puede ver, editar y eliminar la credencial.
     */
    async canAccessCredential(
        employeeId: string,
        credential: Credential,
    ): Promise<boolean> {
        // Owner always has access
        if (credential.ownerId === employeeId) {
            return true;
        }

        // PRIVATE: solo el creador
        if (credential.visibilityLevel === VisibilityLevel.PRIVATE) {
            return false;
        }

        // Check if employee is active
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
        });
        if (!employee || !employee.isActive) {
            return false;
        }

        // INHERIT: hereda del vault
        if (credential.visibilityLevel === VisibilityLevel.INHERIT) {
            return await this.canAccessViaVault(employeeId, credential.vaultId);
        }

        // Visibilidad explícita en la credencial
        return await this.evaluateVisibility(
            employeeId,
            credential.visibilityLevel,
            {
                visibilityCompanies: credential.visibilityCompanies,
                visibilityAreas: credential.visibilityAreas,
                visibilityPositions: credential.visibilityPositions,
                visibilityEmployees: credential.visibilityEmployees,
            },
        );
    }

    /**
     * Determina si un empleado puede acceder a un vault (directorio).
     *
     * Reglas:
     * - PRIVATE: solo el creador.
     * - INHERIT: hereda del vault padre. Sube recursivamente.
     * - Cualquier otro nivel: se evalúa directamente.
     */
    async canAccessVault(
        employeeId: string,
        vaultId: string,
    ): Promise<boolean> {
        const vault = await this.vaultRepository.findOne({
            where: { id: vaultId },
            relations: [
                'visibilityCompanies',
                'visibilityAreas',
                'visibilityPositions',
                'visibilityEmployees',
            ],
        });

        if (!vault) {
            return false;
        }

        if (vault.ownerId === employeeId) {
            return true;
        }

        if (vault.visibilityLevel === VisibilityLevel.PRIVATE) {
            return false;
        }

        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
        });
        if (!employee || !employee.isActive) {
            return false;
        }

        if (vault.visibilityLevel === VisibilityLevel.INHERIT) {
            if (vault.parentId) {
                return await this.canAccessVault(employeeId, vault.parentId);
            }
            return false;
        }

        return await this.evaluateVisibility(
            employeeId,
            vault.visibilityLevel,
            {
                visibilityCompanies: vault.visibilityCompanies,
                visibilityAreas: vault.visibilityAreas,
                visibilityPositions: vault.visibilityPositions,
                visibilityEmployees: vault.visibilityEmployees,
            },
        );
    }

    /**
     * Sube por la jerarquía de vaults buscando el primer vault con visibilidad
     * explícita (no INHERIT) y evalúa si el empleado tiene acceso.
     */
    private async canAccessViaVault(
        employeeId: string,
        vaultId: string,
    ): Promise<boolean> {
        const vault = await this.vaultRepository.findOne({
            where: { id: vaultId },
            relations: [
                'visibilityCompanies',
                'visibilityAreas',
                'visibilityPositions',
                'visibilityEmployees',
            ],
        });

        if (!vault) {
            return false;
        }

        if (vault.ownerId === employeeId) {
            return true;
        }

        // PRIVATE en el vault: nadie más accede
        if (vault.visibilityLevel === VisibilityLevel.PRIVATE) {
            return false;
        }

        // INHERIT: subir al padre
        if (vault.visibilityLevel === VisibilityLevel.INHERIT) {
            if (vault.parentId) {
                return await this.canAccessViaVault(employeeId, vault.parentId);
            }
            return false;
        }

        // Visibilidad explícita en el vault
        return await this.evaluateVisibility(
            employeeId,
            vault.visibilityLevel,
            {
                visibilityCompanies: vault.visibilityCompanies,
                visibilityAreas: vault.visibilityAreas,
                visibilityPositions: vault.visibilityPositions,
                visibilityEmployees: vault.visibilityEmployees,
            },
        );
    }

    private async evaluateVisibility(
        employeeId: string,
        visibilityLevel: VisibilityLevel,
        visibilityRecords: {
            visibilityCompanies?: { companyId: string }[];
            visibilityAreas?: { areaId: string }[];
            visibilityPositions?: { positionId: string }[];
            visibilityEmployees?: { employeeId: string }[];
        },
    ): Promise<boolean> {
        switch (visibilityLevel) {
            case VisibilityLevel.PRIVATE:
                return false;

            case VisibilityLevel.INHERIT:
                return false; // No debería llegar aquí, pero por seguridad

            case VisibilityLevel.PUBLIC:
                return true;

            case VisibilityLevel.BY_COMPANY:
                return await this.hasCompanyAccess(employeeId, visibilityRecords.visibilityCompanies || []);

            case VisibilityLevel.BY_AREA:
                return await this.hasAreaAccess(employeeId, visibilityRecords.visibilityAreas || []);

            case VisibilityLevel.BY_POSITION:
                return await this.hasPositionAccess(employeeId, visibilityRecords.visibilityPositions || []);

            case VisibilityLevel.BY_EMPLOYEE_LIST:
                return this.hasEmployeeListAccess(employeeId, visibilityRecords.visibilityEmployees || []);

            default:
                return false;
        }
    }

    private async hasCompanyAccess(
        employeeId: string,
        visibilityCompanies: { companyId: string }[],
    ): Promise<boolean> {
        const memorandum = await this.memorandumRepository
            .createQueryBuilder('memorandum')
            .innerJoin('memorandum.contract', 'contract')
            .where('contract.employeeId = :employeeId', { employeeId })
            .andWhere('contract.status = :status', { status: 'active' })
            .andWhere('memorandum.startDate <= :now', { now: new Date() })
            .andWhere('(memorandum.endDate IS NULL OR memorandum.endDate >= :now)', { now: new Date() })
            .select('contract.companyId', 'companyId')
            .getRawOne();

        if (!memorandum) return false;
        return visibilityCompanies.some((vc) => vc.companyId === memorandum.companyId);
    }

    private async hasAreaAccess(
        employeeId: string,
        visibilityAreas: { areaId: string }[],
    ): Promise<boolean> {
        // TODO: Implementar cuando el esquema soporte relación empleado-área
        return false;
    }

    private async hasPositionAccess(
        employeeId: string,
        visibilityPositions: { positionId: string }[],
    ): Promise<boolean> {
        const memorandum = await this.memorandumRepository
            .createQueryBuilder('memorandum')
            .innerJoin('memorandum.contract', 'contract')
            .where('contract.employeeId = :employeeId', { employeeId })
            .andWhere('contract.status = :status', { status: 'active' })
            .andWhere('memorandum.startDate <= :now', { now: new Date() })
            .andWhere('(memorandum.endDate IS NULL OR memorandum.endDate >= :now)', { now: new Date() })
            .select('memorandum.positionId', 'positionId')
            .getRawOne();

        if (!memorandum) return false;
        return visibilityPositions.some((vp) => vp.positionId === memorandum.positionId);
    }

    private hasEmployeeListAccess(
        employeeId: string,
        visibilityEmployees: { employeeId: string }[],
    ): boolean {
        return visibilityEmployees.some((ve) => ve.employeeId === employeeId);
    }
}
