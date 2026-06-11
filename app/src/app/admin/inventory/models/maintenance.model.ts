import { Inventory } from './inventory.model';

export interface Maintenance {
    id: string;
    inventoryId: string;
    inventory?: Inventory;
    maintenanceDate: string;
    observations: string;
    createdAt: string;
    updatedAt: string;
}
