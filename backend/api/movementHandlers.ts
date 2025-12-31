import { ipcMain } from 'electron';
import { PrismaMovementRepository } from '../infrastructure/database/repositories/PrismaMovementRepository';
import { PrismaClient } from '../../prisma/generated-client';

export function registerMovementHandlers(movementRepo: PrismaMovementRepository, prisma: PrismaClient) {
    ipcMain.handle('movements:getAll', async (event, filters) => {
        return movementRepo.findAll(filters);
    });

    ipcMain.handle('movements:create', async (event, data) => {
        try {
            // In license-only mode, we use a single system user
            let user = await prisma.user.findFirst();
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: 'system@local.com',
                        name: 'Sistema',
                        passwordHash: 'NOT_NEEDED',
                        role: 'ADMIN',
                        status: 'ACTIVE'
                    }
                });
            }
            return await movementRepo.create(data, user.id);
        } catch (error) {
            console.error('Error creating movement:', error);
            throw error;
        }
    });
}
