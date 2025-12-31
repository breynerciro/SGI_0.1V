import { PrismaClient } from '../../prisma/generated-client';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import { PrismaProductRepository } from '../infrastructure/database/repositories/PrismaProductRepository';
import { PrismaMovementRepository } from '../infrastructure/database/repositories/PrismaMovementRepository';
import { SyncService } from '../domain/services/SyncService';
import { GoogleDriveSyncAdapter } from '../infrastructure/sync/GoogleDriveSyncAdapter';

import { registerProductHandlers } from './productHandlers';
import { registerMovementHandlers } from './movementHandlers';
import { registerLicenseHandlers } from './licenseHandlers';
import { registerDashboardHandlers } from './dashboardHandlers';
import { registerSyncHandlers } from './syncHandlers';
import { registerBrandingHandlers } from './brandingHandlers';

export function registerHandlers() {
    console.log('Registering IPC handlers...');
    try {
        const isPackaged = app.isPackaged;
        const dbPath = isPackaged
            ? path.join(app.getPath('userData'), 'inventory.db')
            : path.join(__dirname, '../../../prisma/inventory.db');

        console.log('Database path:', dbPath);

        // Ensure database exists in packaged app
        let shouldCopy = false;

        if (isPackaged) {
            if (!fs.existsSync(dbPath)) {
                shouldCopy = true;
                console.log('Database does not exist.');
            } else {
                const stats = fs.statSync(dbPath);
                if (stats.size === 0) {
                    shouldCopy = true;
                    console.log('Database exists but is empty (0 bytes).');
                }
            }
        }

        if (shouldCopy) {
            const templateDbPath = path.join(process.resourcesPath, 'inventory.db');
            console.log('Copying template database from:', templateDbPath);
            if (fs.existsSync(templateDbPath)) {
                fs.copyFileSync(templateDbPath, dbPath);
                console.log('Database copied successfully.');
            } else {
                console.error('Template database not found in resources!');
            }
        }

        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: `file:${dbPath}`
                }
            }
        });
        const productRepo = new PrismaProductRepository(prisma);
        const movementRepo = new PrismaMovementRepository(prisma);

        // Initialize Sync Service
        const ENCRYPTION_KEY = 'change-this-to-a-secure-key-32-chars';
        const syncService = new SyncService(ENCRYPTION_KEY);
        const googleDriveAdapter = new GoogleDriveSyncAdapter();
        syncService.registerAdapter(googleDriveAdapter);

        console.log('Registering individual handlers...');
        registerLicenseHandlers();
        registerProductHandlers(productRepo);
        registerMovementHandlers(movementRepo, prisma);
        registerDashboardHandlers(prisma);
        registerBrandingHandlers();
        registerSyncHandlers(syncService, googleDriveAdapter, productRepo);

        // Initial configuration loaders
        loadInitialConfigs(googleDriveAdapter);
        console.log('All IPC handlers registered successfully.');
    } catch (error) {
        console.error('CRITICAL ERROR during IPC registration:', error);
    }
}

function loadInitialConfigs(googleDriveAdapter: GoogleDriveSyncAdapter) {
    try {
        const configPath = path.join(app.getPath('userData'), 'sync-config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config['Google Drive']) {
                googleDriveAdapter.authenticate(config['Google Drive'])
                    .catch(err => console.error('Failed to auto-authenticate Google Drive:', err));
            }
        }
    } catch (e) {
        console.error('Error loading sync config:', e);
    }
}
