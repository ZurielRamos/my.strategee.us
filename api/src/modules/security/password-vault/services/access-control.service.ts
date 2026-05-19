import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Memorandum } from '@modules/core/contracts/entities/memorandum.entity';
import { Credential } from '../entities/credential.entity';
import { VisibilityLevel } from '../enums/visibility-level.enum';

@Injectable()
export class AccessControlService {
    constructor(
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Memorandum)
        private readonly memorandumRepository: Repository<Memorandum>,
    ) {}

    async canAccessCredential(
        employeeId: string,
        credential: Credential,
    ): Promise<boolean> {
        // Owner always has access
        if (credential.ownerId === employeeId) {
            return true;
        }

        // Check if employee is active
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
        });

        if (!employee || !employee.isActive) {
            return false;
        }

        // Check visibility level
        switch (credential.visibilityLevel) {
            case VisibilityLevel.PRIVATE:
                return false;

            case VisibilityLevel.PUBLIC:
                return true;

            case VisibilityLevel.BY_COMPANY:
                return await this.hasCompanyAccess(employeeId, credential);

            case VisibilityLevel.BY_AREA:
                return await this.hasAreaAccess(employeeId, credential);

            case VisibilityLevel.BY_POSITION:
                return await this.hasPositionAccess(employeeId, credential);

            case VisibilityLevel.BY_EMPLOYEE_LIST:
                return await this.hasEmployeeListAccess(employeeId, credential);

            default:
                return false;
        }
    }

    private async hasCompanyAccess(
        employeeId: string,
        credential: Credential,
    ): Promise<boolean> {
        const memorandum = await this.memorandumRepository
            .createQueryBuilder('memorandum')
            .innerJoin('memorandum.contract', 'contract')
            .innerJoin('memorandum.position', 'position')
            .innerJoin('position.department', 'department')
            .innerJoin('department.company', 'company')
            .where('contract.employeeId = :employeeId', { employeeId })
            .andWhere('contract.status = :status', { status: 'active' })
            .andWhere('memorandum.startDate <= :now', { now: new Date() })
            .andWhere(
                '(memorandum.endDate IS NULL OR memorandum.endDate >= :now)',
                { now: new Date() },
            )
            .select('company.id', 'companyId')
            .getRawOne();

        if (!memorandum) {
            return false;
        }

        return credential.visibilityCompanies.some(
            (vc) => vc.companyId === memorandum.companyId,
        );
    }

    private async hasAreaAccess(
        employeeId: string,
        credential: Credential,
    ): Promise<boolean> {
        // TODO: The current schema doesn't have a direct area relationship in contracts/memorandums
        // This implementation would need to be updated once the schema includes area assignments
        // Expected query would be similar to:
        // SELECT area.id FROM memorandums
        // INNER JOIN contracts ON memorandums.contractId = contracts.id
        // INNER JOIN areas ON memorandums.areaId = areas.id  -- This field doesn't exist yet
        // WHERE contracts.employeeId = :employeeId
        // AND contracts.status = 'active'
        // AND memorandums.startDate <= NOW()
        // AND (memorandums.endDate IS NULL OR memorandums.endDate >= NOW())
        
        // For now, return false until the schema is updated to support employee-area relationships
        return false;
    }

    private async hasPositionAccess(
        employeeId: string,
        credential: Credential,
    ): Promise<boolean> {
        const memorandum = await this.memorandumRepository
            .createQueryBuilder('memorandum')
            .innerJoin('memorandum.contract', 'contract')
            .where('contract.employeeId = :employeeId', { employeeId })
            .andWhere('contract.status = :status', { status: 'active' })
            .andWhere('memorandum.startDate <= :now', { now: new Date() })
            .andWhere(
                '(memorandum.endDate IS NULL OR memorandum.endDate >= :now)',
                { now: new Date() },
            )
            .select('memorandum.positionId', 'positionId')
            .getRawOne();

        if (!memorandum) {
            return false;
        }

        return credential.visibilityPositions.some(
            (vp) => vp.positionId === memorandum.positionId,
        );
    }

    private async hasEmployeeListAccess(
        employeeId: string,
        credential: Credential,
    ): Promise<boolean> {
        return credential.visibilityEmployees.some(
            (ve) => ve.employeeId === employeeId,
        );
    }
}
