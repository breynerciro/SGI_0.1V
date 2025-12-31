import { Product } from '../entities/Product';
import { ProductStatus, IProduct } from '../../../shared/types';

export interface IProductRepository {
    findById(id: string): Promise<Product | null>;
    findByCode(code: string): Promise<Product | null>;
    findAll(filters?: {
        status?: ProductStatus;
        categoryId?: string;
        search?: string;
    }): Promise<Product[]>;
    create(data: Omit<IProduct, 'id'>): Promise<Product>;
    update(id: string, data: Partial<IProduct>): Promise<Product>;
    delete(id: string): Promise<void>;
    count(filters?: { status?: ProductStatus }): Promise<number>;
}
