import { ipcMain } from 'electron';
import { PrismaProductRepository } from '../infrastructure/database/repositories/PrismaProductRepository';

export function registerProductHandlers(productRepo: PrismaProductRepository) {
    ipcMain.handle('products:getAll', async (event, filters) => {
        return productRepo.findAll(filters);
    });

    ipcMain.handle('products:get', async (event, id) => {
        return productRepo.findById(id);
    });

    ipcMain.handle('products:create', async (event, data) => {
        return productRepo.create(data);
    });

    ipcMain.handle('products:update', async (event, id, data) => {
        return productRepo.update(id, data);
    });

    ipcMain.handle('products:delete', async (event, id) => {
        return productRepo.delete(id);
    });

    ipcMain.handle('products:softDelete', async (event, id) => {
        return productRepo.softDelete(id);
    });
}
