import { ISyncAdapter, BackupMetadata } from '../../infrastructure/sync/ISyncAdapter';
import { CryptoService } from '../../infrastructure/encryption/CryptoService';
import { IBrandingConfig } from '../../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export class SyncService {
    private adapters: Map<string, ISyncAdapter> = new Map();
    private isSyncing: boolean = false;

    constructor(
        private encryptionKey: string
    ) { }

    registerAdapter(adapter: ISyncAdapter) {
        this.adapters.set(adapter.name, adapter);
    }

    async createBackup(dbPath: string): Promise<{ filePath: string; filename: string }> {
        const backupDir = path.join(app.getPath('userData'), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.inv`;
        const filePath = path.join(backupDir, filename);

        // Read the database file
        const dbData = fs.readFileSync(dbPath);

        // Encrypt the entire database file
        const encryptedData = CryptoService.encrypt(dbData, this.encryptionKey);

        // Write encrypted backup
        fs.writeFileSync(filePath, encryptedData);

        return { filePath, filename };
    }

    async syncNow(providerName: string, dbPath: string): Promise<{ success: boolean; error?: string }> {
        if (this.isSyncing) {
            return { success: false, error: 'Sincronización ya en curso' };
        }

        const adapter = this.adapters.get(providerName);
        if (!adapter) {
            return { success: false, error: 'Proveedor de sincronización no encontrado' };
        }

        this.isSyncing = true;

        try {
            // 1. Create encrypted local backup
            const { filePath, filename } = await this.createBackup(dbPath);
            const backupData = fs.readFileSync(filePath);

            // 2. Upload to cloud
            await adapter.uploadBackup(backupData, filename);

            // 3. Cleanup old local backups (keep last 5)
            this.cleanupLocalBackups();

            return { success: true };
        } catch (error) {
            console.error('Sync error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
        } finally {
            this.isSyncing = false;
        }
    }

    async restoreFromBackup(providerName: string, filename: string): Promise<Buffer> {
        const adapter = this.adapters.get(providerName);
        if (!adapter) {
            throw new Error('Proveedor no encontrado');
        }

        // Download encrypted backup
        const encryptedData = await adapter.downloadBackup(filename);

        // Decrypt and return the database file
        return CryptoService.decrypt(encryptedData, this.encryptionKey);
    }

    private cleanupLocalBackups() {
        const backupDir = path.join(app.getPath('userData'), 'backups');
        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith('.inv'))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Newest first

        // Keep top 5, delete rest
        if (files.length > 5) {
            files.slice(5).forEach(file => {
                fs.unlinkSync(path.join(backupDir, file.name));
            });
        }
    }
}
