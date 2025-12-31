import { IInventoryMovement, MovementType, IMovementItem } from '../../../shared/types';

export class InventoryMovement implements IInventoryMovement {
    constructor(
        public id: string,
        public type: MovementType,
        public date: Date,
        public userId: string,
        public warehouseFromId?: string,
        public warehouseToId?: string,
        public notes?: string,
        public reference?: string
    ) { }

    validate(): string[] {
        const errors: string[] = [];

        switch (this.type) {
            case MovementType.IN:
                if (!this.warehouseToId) {
                    errors.push('La entrada requiere un almacén de destino');
                }
                if (this.warehouseFromId) {
                    errors.push('La entrada no debe tener almacén de origen');
                }
                break;

            case MovementType.OUT:
                if (!this.warehouseFromId) {
                    errors.push('La salida requiere un almacén de origen');
                }
                if (this.warehouseToId) {
                    errors.push('La salida no debe tener almacén de destino');
                }
                break;

            case MovementType.TRANSFER:
                if (!this.warehouseFromId) {
                    errors.push('El traslado requiere un almacén de origen');
                }
                if (!this.warehouseToId) {
                    errors.push('El traslado requiere un almacén de destino');
                }
                if (this.warehouseFromId === this.warehouseToId) {
                    errors.push('El almacén de origen y destino deben ser diferentes');
                }
                break;

            case MovementType.ADJUSTMENT:
                if (!this.warehouseToId) {
                    errors.push('El ajuste requiere un almacén');
                }
                break;
        }

        return errors;
    }

    getMovementTypeLabel(): string {
        const labels: Record<MovementType, string> = {
            [MovementType.IN]: 'Entrada',
            [MovementType.OUT]: 'Salida',
            [MovementType.TRANSFER]: 'Traslado',
            [MovementType.ADJUSTMENT]: 'Ajuste',
        };
        return labels[this.type];
    }
}

export class MovementItem implements IMovementItem {
    constructor(
        public id: string,
        public movementId: string,
        public productId: string,
        public quantity: number,
        public cost: number,
        public price: number,
        public notes?: string
    ) { }

    validate(): string[] {
        const errors: string[] = [];

        if (!this.productId) {
            errors.push('El producto es requerido');
        }

        if (this.quantity === 0) {
            errors.push('La cantidad no puede ser cero');
        }

        if (this.cost < 0) {
            errors.push('El costo no puede ser negativo');
        }

        if (this.price < 0) {
            errors.push('El precio no puede ser negativo');
        }

        return errors;
    }

    getTotalCost(): number {
        return Math.abs(this.quantity) * this.cost;
    }

    getTotalPrice(): number {
        return Math.abs(this.quantity) * this.price;
    }
}
