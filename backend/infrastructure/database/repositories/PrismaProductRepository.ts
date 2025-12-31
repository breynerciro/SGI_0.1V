import { PrismaClient } from '../../../../prisma/generated-client';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { Product } from '../../../domain/entities/Product';
import { ProductStatus, IProduct } from '../../../../shared/types';

export class PrismaProductRepository implements IProductRepository {
    constructor(private prisma: PrismaClient) { }

    private toEntity(data: any): Product {
        return new Product(
            data.id,
            data.code,
            data.name,
            data.unit,
            data.cost,
            data.price,
            data.minStock,
            data.status as ProductStatus,
            data.description || undefined,
            data.categoryId || undefined,
            data.maxStock || undefined,
            data.barcode || undefined,
            data.stock // Pass stock relation
        );
    }

    async findById(id: string): Promise<Product | null> {
        const data = await this.prisma.product.findUnique({
            where: { id },
            include: { stock: true } // Include stock
        });
        return data ? this.toEntity(data) : null;
    }

    async findByCode(code: string): Promise<Product | null> {
        const data = await this.prisma.product.findUnique({
            where: { code },
            include: { stock: true }
        });
        return data ? this.toEntity(data) : null;
    }

    async findAll(filters?: { status?: ProductStatus; categoryId?: string; search?: string }): Promise<Product[]> {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { code: { contains: filters.search } }
            ];
        }

        const data = await this.prisma.product.findMany({
            where,
            include: { stock: true } // Include stock
        });
        return data.map(this.toEntity);
    }

    async create(data: Omit<IProduct, 'id'>): Promise<Product> {
        // Validate that we don't pass 'id' to create user input type, but Product entity has it.
        // We construct the input for Prisma
        const input = {
            code: data.code,
            name: data.name,
            description: data.description,
            categoryId: data.categoryId,
            unit: data.unit,
            cost: data.cost,
            price: data.price,
            minStock: data.minStock,
            maxStock: data.maxStock,
            barcode: data.barcode,
            status: data.status
        };

        const created = await this.prisma.product.create({ data: input });
        return this.toEntity(created);
    }

    async update(id: string, data: Partial<IProduct>): Promise<Product> {
        // We need to strip standard class methods and undefined values if we passed a full entity
        // But since arguments are Partial<Product>, we can just map the properties we care about
        // Or simpler: just try to update defined props.
        // For type safety, it's better to act on an interface, but here we iterate manual props or use an object

        // Simplification for the example:
        const { id: _, ...updateData } = data as any; // remove ID if present

        const updated = await this.prisma.product.update({
            where: { id },
            data: updateData
        });
        return this.toEntity(updated);
    }

    /**
     * Soft delete: Mark product as INACTIVE instead of deleting
     * This preserves historical data and movement records
     */
    async softDelete(id: string): Promise<void> {
        await this.prisma.product.update({
            where: { id },
            data: { status: 'INACTIVE' }
        });
    }

    /**
     * Hard delete: Permanently remove product and all related data
     * Use with caution - this cannot be undone
     */
    async delete(id: string): Promise<void> {
        // Delete in a transaction to ensure data consistency
        await this.prisma.$transaction(async (tx) => {
            // First, delete all movement items that reference this product
            await tx.movementItem.deleteMany({
                where: { productId: id }
            });

            // Then delete all stock records for this product
            await tx.stock.deleteMany({
                where: { productId: id }
            });

            // Finally, delete the product itself
            await tx.product.delete({
                where: { id }
            });
        });
    }

    async count(filters?: { status?: ProductStatus }): Promise<number> {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        return this.prisma.product.count({ where });
    }
}
