import { AdditionalElement } from './additional-element.model';

export interface AllocationElement {
    id: string;
    allocationId: string;
    additionalElementId: string;
    additionalElement?: AdditionalElement;
    value: number;
    createdAt: string;
    updatedAt: string;
}
