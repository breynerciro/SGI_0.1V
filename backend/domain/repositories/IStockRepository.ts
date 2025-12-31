import { IStock, StockLevel } from '../../../shared/types';

export interface IStockRepository {
    getStock(productId: string, warehouseId: string): Promise<number>;
    getStockByProduct(productId: string): Promise<IStock[]>;
    getStockByWarehouse(warehouseId: string): Promise<IStock[]>;
    getAllStockLevels(): Promise<StockLevel[]>;
    getLowStockItems(): Promise<StockLevel[]>;
    updateStock(productId: string, warehouseId: string, quantity: number): Promise<void>;
    adjustStock(productId: string, warehouseId: string, delta: number): Promise<void>;
    getTotalStockValue(): Promise<number>;
}
