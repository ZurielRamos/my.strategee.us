import { Inventory } from './inventory.model';
import { AllocationElement } from './allocation-element.model';
import { ReceptionFormat } from './reception-format.model';

export interface InventoryAllocation {
    id: string;
    inventoryId: string;
    inventory?: Inventory;
    employeeId: string;
    employee?: any;
    elements?: AllocationElement[];
    receptionFormat?: ReceptionFormat;
    createdAt: string;
    updatedAt: string;
}
