import { IProduct, ProductStatus, IStock } from '../../../shared/types';

export class Product implements IProduct {
    constructor(
        public id: string,
        public code: string,
        public name: string,
        public unit: string,
        public cost: number,
        public price: number,
        public minStock: number,
        public status: ProductStatus,
        public description?: string,
        public categoryId?: string,
        public maxStock?: number,
        public barcode?: string,
        public stock: IStock[] = []
    ) { }

    isActive(): boolean {
        return this.status === ProductStatus.ACTIVE;
    }

    getProfitMargin(): number {
        if (this.cost === 0) return 0;
        return ((this.price - this.cost) / this.cost) * 100;
    }

    isStockLow(currentStock: number): boolean {
        return currentStock <= this.minStock;
    }

    isStockCritical(currentStock: number): boolean {
        return currentStock <= this.minStock * 0.5;
    }

    isStockExcess(currentStock: number): boolean {
        if (!this.maxStock) return false;
        return currentStock >= this.maxStock;
    }

    getStockStatus(currentStock: number): 'OK' | 'LOW' | 'CRITICAL' | 'EXCESS' {
        if (this.isStockCritical(currentStock)) return 'CRITICAL';
        if (this.isStockLow(currentStock)) return 'LOW';
        if (this.isStockExcess(currentStock)) return 'EXCESS';
        return 'OK';
    }

    validate(): string[] {
        const errors: string[] = [];

        if (!this.code || this.code.trim() === '') {
            errors.push('El código del producto es requerido');
        }

        if (!this.name || this.name.trim() === '') {
            errors.push('El nombre del producto es requerido');
        }

        if (!this.unit || this.unit.trim() === '') {
            errors.push('La unidad de medida es requerida');
        }

        if (this.cost < 0) {
            errors.push('El costo no puede ser negativo');
        }

        if (this.price < 0) {
            errors.push('El precio no puede ser negativo');
        }

        if (this.minStock < 0) {
            errors.push('El stock mínimo no puede ser negativo');
        }

        if (this.maxStock !== undefined && this.maxStock < this.minStock) {
            errors.push('El stock máximo debe ser mayor o igual al stock mínimo');
        }

        return errors;
    }
}
