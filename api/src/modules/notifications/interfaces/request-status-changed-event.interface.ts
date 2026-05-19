import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestStatus } from '@modules/operations/requests/enums/request-status.enum';

export interface RequestStatusChangedEvent {
  request: Request;
  previousStatus: RequestStatus;
  newStatus: RequestStatus;
}
