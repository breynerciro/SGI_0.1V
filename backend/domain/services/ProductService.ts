import { IProductRepository } from '../repositories/IProductRepository';
import { Product } from '../entities/Product';
import { ProductStatus } from '../../../shared/types';

export class ProductService {
    constructor(private productRepository: IProductRepository) { }

    async getAll(filters?: { status?: ProductStatus; categoryId?: string; search?: string }): Promise<Product[]> {
        return this.productRepository.findAll(filters);
    }

    async getById(id: string): Promise<Product | null> {
        return this.productRepository.findById(id);
    }

    async create(data: {
        code: string;
        name: string;
        description?: string;
        categoryId?: string;
        unit: string;
        cost: number;
        price: number;
        minStock: number;
        maxStock?: number;
        barcode?: string;
    }): Promise<Product> {
        const existing = await this.productRepository.findByCode(data.code);
        if (existing) {
            throw new Error(`Ya existe un producto con el código ${data.code}`);
        }

        // Create entity to validate business rules
        // Note: ID is empty for validation, repo will generate it or we can generate uuid here
        // For this implementation repo will handle ID generation if we pass it Omit<Product, 'id'>

        // Simple validation (Product entity has complete validation)
        if (data.cost < 0) throw new Error('El costo no puede ser negativo');
        if (data.price < 0) throw new Error('El precio no puede ser negativo');

        const productData = {
            ...data,
            status: ProductStatus.ACTIVE
        };

        return this.productRepository.create(productData);
    }

    async update(id: string, data: Partial<Product>): Promise<Product> {
        const existing = await this.productRepository.findById(id);
        if (!existing) {
            throw new Error('Producto no encontrado');
        }

        if (data.code && data.code !== existing.code) {
            const duplicate = await this.productRepository.findByCode(data.code);
            if (duplicate) {
                throw new Error(`Ya existe un producto con el código ${data.code}`);
            }
        }

        return this.productRepository.update(id, data);
    }

    async delete(id: string): Promise<void> {
        // Soft delete usually, or check if it has movements
        // For now simple delete (prisma w/ cascade or check constraint)
        return this.productRepository.delete(id);
    }
}
