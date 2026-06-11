import { TypeInventory } from './type-inventory.model';
import { Supplier } from './supplier.model';
import { InventoryAllocation } from './inventory-allocation.model';
import { InventoryFeature } from './inventory-feature.model';
import { Maintenance } from './maintenance.model';

export interface Inventory {
    id: string;
    name: string;
    value: number;
    purchaseDate: string | null;
    observations: string | null;
    isActive: boolean;
    typeInventoryId: string;
    typeInventory?: TypeInventory;
    supplierId: string | null;
    supplier?: Supplier;
    allocation?: InventoryAllocation;
    features?: InventoryFeature[];
    maintenances?: Maintenance[];
    createdAt: string;
    updatedAt: string;
}
