import { Hardware } from './hardware.model';
import { Software } from './software.model';

export interface InventoryFeature {
    id: string;
    inventoryId: string;
    hardwareId: string | null;
    hardware?: Hardware;
    softwareId: string | null;
    software?: Software;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}
