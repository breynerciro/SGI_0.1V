import { IInventoryMovement, CreateMovementRequest } from '../../../shared/types';

export interface IMovementRepository {
    create(data: CreateMovementRequest, userId: string): Promise<IInventoryMovement>;
    findAll(filters?: any): Promise<IInventoryMovement[]>;
    findById(id: string): Promise<IInventoryMovement | null>;
}
