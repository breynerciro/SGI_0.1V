import { ipcMain, app } from 'electron';
import { PrismaClient } from '../../prisma/generated-client';
import * as path from 'path';
import * as fs from 'fs';

export function registerDashboardHandlers(prisma: PrismaClient) {
    ipcMain.handle('dashboard:getStats', async () => {
        try {
            const totalProducts = await prisma.product.count();
            const totalWarehouses = await prisma.warehouse.count();

            const productsWithStock = await prisma.product.findMany({
                include: { stock: true }
            });

            const lowStockItems = productsWithStock.filter((p: any) => {
                const totalStock = p.stock.reduce((sum: number, s: any) => sum + s.quantity, 0);
                return totalStock < p.minStock;
            }).length;

            const totalStockValue = productsWithStock.reduce((total: number, p: any) => {
                const totalQty = p.stock.reduce((sum: number, s: any) => sum + s.quantity, 0);
                return total + (totalQty * p.cost);
            }, 0);

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentMovements = await prisma.inventoryMovement.count({
                where: {
                    date: { gte: sevenDaysAgo }
                }
            });

            let lastSyncDate = undefined;
            try {
                const configPath = path.join(app.getPath('userData'), 'sync-config.json');
                if (fs.existsSync(configPath)) {
                    const stats = fs.statSync(configPath);
                    lastSyncDate = stats.mtime;
                }
            } catch (e) { }

            return {
                totalProducts,
                totalWarehouses,
                lowStockItems,
                recentMovements,
                totalStockValue,
                lastSyncDate
            };
        } catch (error) {
            console.error('Error calculating dashboard stats:', error);
            return {
                totalProducts: 0,
                totalWarehouses: 0,
                lowStockItems: 0,
                recentMovements: 0,
                totalStockValue: 0
            };
        }
    });
}
