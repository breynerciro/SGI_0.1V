export interface BackupMetadata {
    filename: string;
    timestamp: Date;
    size: number;
    checksum?: string;
}

export interface ISyncAdapter {
    name: string;

    /**
     * Authenticate with the cloud provider
     */
    authenticate(credentials: Record<string, any>): Promise<boolean>;

    /**
     * Upload a backup file
     */
    uploadBackup(data: Buffer, filename: string): Promise<string>;

    /**
     * Download a backup file
     */
    downloadBackup(filename: string): Promise<Buffer>;

    /**
     * List available backups
     */
    listBackups(): Promise<BackupMetadata[]>;

    /**
     * Delete a backup file
     */
    deleteBackup(filename: string): Promise<void>;

    /**
     * Test connection
     */
    testConnection(): Promise<boolean>;
}
