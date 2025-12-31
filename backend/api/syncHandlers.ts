import { ipcMain, app, shell } from 'electron';
import { SyncService } from '../domain/services/SyncService';
import { GoogleDriveSyncAdapter } from '../infrastructure/sync/GoogleDriveSyncAdapter';
import { PrismaProductRepository } from '../infrastructure/database/repositories/PrismaProductRepository';
import * as path from 'path';
import * as fs from 'fs';

export function registerSyncHandlers(syncService: SyncService, googleDriveAdapter: GoogleDriveSyncAdapter, productRepo: PrismaProductRepository) {
    ipcMain.handle('sync:getAuthUrl', async (event, clientId, clientSecret) => {
        const url = googleDriveAdapter.getAuthUrl(clientId, clientSecret);
        // Automatically open the browser
        await shell.openExternal(url);
        return url;
    });

    ipcMain.handle('sync:waitForAuth', async () => {
        try {
            const code = await googleDriveAdapter.waitForCode();
            const tokens = await googleDriveAdapter.authenticateWithCode(code);
            return { success: true, tokens };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('sync:authenticateWithCode', async (event, code) => {
        try {
            const tokens = await googleDriveAdapter.authenticateWithCode(code);
            return { success: true, tokens };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('sync:now', async () => {
        try {
            // Pass the database file path instead of data
            const dbPath = path.join(process.cwd(), 'prisma', 'inventory.db');
            return await syncService.syncNow('Google Drive', dbPath);
        } catch (error) {
            console.error('Sync failed:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('sync:configure', async (event, provider, config) => {
        if (provider === 'Google Drive') {
            const authenticated = await googleDriveAdapter.authenticate(config);
            if (authenticated) {
                const configPath = path.join(app.getPath('userData'), 'sync-config.json');
                let currentConfig: any = {};
                try {
                    if (fs.existsSync(configPath)) {
                        currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    }
                } catch (e) { }
                currentConfig[provider] = config;
                fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
                return { success: true };
            }
            return { success: false, error: 'Autenticación fallida con Google' };
        }
        return { success: false, error: 'Proveedor no soportado' };
    });

    ipcMain.handle('sync:getStatus', async () => {
        return { status: 'IDLE', lastSync: null };
    });

    // Get saved configuration
    ipcMain.handle('sync:getConfig', async (event, provider) => {
        try {
            const configPath = path.join(app.getPath('userData'), 'sync-config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config[provider]) {
                    // Return config without sensitive data (just indicate it exists)
                    return {
                        connected: true,
                        hasCredentials: true
                    };
                }
            }
            return { connected: false, hasCredentials: false };
        } catch (error) {
            return { connected: false, hasCredentials: false };
        }
    });

    // Load saved credentials and authenticate
    ipcMain.handle('sync:loadSavedCredentials', async (event, provider) => {
        try {
            const configPath = path.join(app.getPath('userData'), 'sync-config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config[provider]) {
                    const authenticated = await googleDriveAdapter.authenticate(config[provider]);
                    return { success: authenticated, config: config[provider] };
                }
            }
            return { success: false };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Disconnect (remove saved credentials)
    ipcMain.handle('sync:disconnect', async (event, provider) => {
        try {
            const configPath = path.join(app.getPath('userData'), 'sync-config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                delete config[provider];
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // List available backups
    ipcMain.handle('sync:listBackups', async () => {
        try {
            const backups = await googleDriveAdapter.listBackups();
            return { success: true, backups };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Restore from backup
    ipcMain.handle('sync:restore', async (event, filename) => {
        try {
            // Download and decrypt backup from Google Drive
            const backupData = await syncService.restoreFromBackup('Google Drive', filename);

            // Get database path
            const dbPath = path.join(process.cwd(), 'prisma', 'inventory.db');

            // Create a backup of current database first
            const backupPath = path.join(app.getPath('userData'), 'backups');
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }
            const localBackupFile = path.join(backupPath, `pre-restore-${Date.now()}.db`);
            if (fs.existsSync(dbPath)) {
                fs.copyFileSync(dbPath, localBackupFile);
            }

            // Restore the downloaded backup (write Buffer directly)
            fs.writeFileSync(dbPath, backupData);

            return { success: true, message: 'Base de datos restaurada exitosamente' };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });
}
