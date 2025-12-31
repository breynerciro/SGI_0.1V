import { PrismaClient, Prisma } from '../../../../prisma/generated-client';
import { IMovementRepository } from '../../../domain/repositories/IMovementRepository';
import { IInventoryMovement, CreateMovementRequest, MovementType } from '../../../../shared/types';

export class PrismaMovementRepository implements IMovementRepository {
    constructor(private prisma: PrismaClient) { }

    async create(data: CreateMovementRequest, userId: string): Promise<IInventoryMovement> {
        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Resolve Warehouse
            // If Single Warehouse mode, finding the first one is finding The One.
            let warehouseId = data.warehouseFromId || data.warehouseToId;

            if (!warehouseId) {
                const defaultWarehouse = await tx.warehouse.findFirst();
                if (!defaultWarehouse) {
                    throw new Error('No configuration de almacén encontrada. Por favor cree un almacén primero.');
                }
                warehouseId = defaultWarehouse.id;
            }

            // Determine From/To based on Type
            // IN: To Warehouse
            // OUT: From Warehouse
            const warehouseFromId = data.type === MovementType.OUT ? warehouseId : null;
            const warehouseToId = data.type === MovementType.IN ? warehouseId : null;

            // 2. Create Movement Header
            const movement = await tx.inventoryMovement.create({
                data: {
                    type: data.type,
                    userId: userId,
                    date: new Date(),
                    warehouseFromId,
                    warehouseToId,
                    notes: data.notes,
                    reference: data.reference,
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            cost: item.cost,
                            price: item.price,
                            notes: item.notes
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            // 3. Update Stock Levels
            for (const item of data.items) {
                // Find existing stock record
                const stock = await tx.stock.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId: item.productId,
                            warehouseId: warehouseId!
                        }
                    }
                });

                let currentQty = stock ? stock.quantity : 0;
                let newQty = currentQty;

                if (data.type === MovementType.IN) {
                    newQty += item.quantity;
                    // Update product cost with the last purchase cost
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { cost: item.cost }
                    });
                } else if (data.type === MovementType.OUT) {
                    // Check stock logic could be strict or allow negative
                    // User usually wants strict for Sales
                    if (currentQty < item.quantity) {
                        throw new Error(`Stock insuficiente para el producto ID: ${item.productId}. Stock actual: ${currentQty} `);
                    }
                    newQty -= item.quantity;
                }

                // Upsert Stock
                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: { quantity: newQty }
                    });
                } else {
                    await tx.stock.create({
                        data: {
                            productId: item.productId,
                            warehouseId: warehouseId!,
                            quantity: newQty
                        }
                    });
                }
            }

            // Return casted result (Prisma types vs Shared types mismatch usually minor)
            return movement as any;
        });
    }

    async findAll(filters?: any): Promise<IInventoryMovement[]> {
        const where: any = {};
        // Add filters logic if needed

        const movements = await this.prisma.inventoryMovement.findMany({
            where,
            include: {
                items: {
                    include: { product: true }
                },
                user: true,
                warehouseFrom: true,
                warehouseTo: true
            },
            orderBy: { date: 'desc' }
        });

        return movements as any;
    }

    async findById(id: string): Promise<IInventoryMovement | null> {
        const movement = await this.prisma.inventoryMovement.findUnique({
            where: { id },
            include: {
                items: {
                    include: { product: true }
                },
                user: true,
                warehouseFrom: true,
                warehouseTo: true
            }
        });
        return movement as any;
    }
}
