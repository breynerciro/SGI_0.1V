import { google } from 'googleapis';
import { ISyncAdapter, BackupMetadata } from './ISyncAdapter';
import { Readable } from 'stream';
import * as http from 'http';
import * as url from 'url';

export class GoogleDriveSyncAdapter implements ISyncAdapter {
    name = 'Google Drive';
    private drive: any;
    private folderId?: string;

    private oauth2Client: any;
    private readonly REDIRECT_URI = 'http://localhost:8888';

    constructor() {
        // OAuth client will be initialized when credentials are provided
    }

    getAuthUrl(clientId: string, clientSecret: string): string {
        this.oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            this.REDIRECT_URI
        );

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.file'],
            prompt: 'consent'
        });
    }

    private callbackServer: any = null;

    async waitForCode(): Promise<string> {
        return new Promise((resolve, reject) => {
            // Close any existing server first
            if (this.callbackServer) {
                this.callbackServer.close();
                this.callbackServer = null;
            }

            this.callbackServer = http.createServer(async (req, res) => {
                try {
                    const urlParts = url.parse(req.url || '', true);
                    const code = urlParts.query.code as string;

                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>✅ Autenticación exitosa</h1><p>Puedes cerrar esta ventana y volver a la aplicación.</p>');

                        // Close server before resolving
                        if (this.callbackServer) {
                            this.callbackServer.close(() => {
                                this.callbackServer = null;
                                resolve(code);
                            });
                        } else {
                            resolve(code);
                        }
                    } else {
                        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>❌ Error</h1><p>Falta el código de autorización</p>');
                    }
                } catch (e) {
                    if (this.callbackServer) {
                        this.callbackServer.close(() => {
                            this.callbackServer = null;
                            reject(e);
                        });
                    } else {
                        reject(e);
                    }
                }
            });

            // Handle server errors
            this.callbackServer.on('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    reject(new Error('El puerto 8888 ya está en uso. Por favor cierra la aplicación y vuelve a intentarlo.'));
                } else {
                    reject(err);
                }
            });

            this.callbackServer.listen(8888);
        });
    }

    async authenticateWithCode(code: string): Promise<any> {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        await this.ensureBackupFolder();
        return tokens;
    }

    async authenticate(credentials: { clientId: string; clientSecret: string; refreshToken: string }): Promise<boolean> {
        try {
            this.oauth2Client = new google.auth.OAuth2(
                credentials.clientId,
                credentials.clientSecret,
                this.REDIRECT_URI
            );

            this.oauth2Client.setCredentials({
                refresh_token: credentials.refreshToken,
            });

            this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

            // Create backup folder if it doesn't exist
            await this.ensureBackupFolder();

            return true;
        } catch (error) {
            console.error('Google Drive authentication error:', error);
            return false;
        }
    }

    private async ensureBackupFolder(): Promise<void> {
        const folderName = 'InventoryBackups';

        const response = await this.drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
        });

        if (response.data.files.length > 0) {
            this.folderId = response.data.files[0].id;
        } else {
            const folder = await this.drive.files.create({
                resource: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                },
                fields: 'id',
            });
            this.folderId = folder.data.id;
        }
    }

    async uploadBackup(data: Buffer, filename: string): Promise<string> {
        const media = {
            mimeType: 'application/octet-stream',
            body: Readable.from(data),
        };

        const response = await this.drive.files.create({
            resource: {
                name: filename,
                parents: [this.folderId],
            },
            media,
            fields: 'id',
        });

        return response.data.id;
    }

    async downloadBackup(filename: string): Promise<Buffer> {
        const response = await this.drive.files.list({
            q: `name='${filename}' and '${this.folderId}' in parents and trashed=false`,
            fields: 'files(id)',
        });

        if (response.data.files.length === 0) {
            throw new Error(`Backup file not found: ${filename}`);
        }

        const fileId = response.data.files[0].id;
        const file = await this.drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        return Buffer.from(file.data);
    }

    async listBackups(): Promise<BackupMetadata[]> {
        const response = await this.drive.files.list({
            q: `'${this.folderId}' in parents and trashed=false`,
            fields: 'files(id, name, size, createdTime)',
            orderBy: 'createdTime desc',
        });

        return response.data.files.map((file: any) => ({
            filename: file.name,
            timestamp: new Date(file.createdTime),
            size: parseInt(file.size),
        }));
    }

    async deleteBackup(filename: string): Promise<void> {
        const response = await this.drive.files.list({
            q: `name='${filename}' and '${this.folderId}' in parents`,
            fields: 'files(id)',
        });

        if (response.data.files.length > 0) {
            await this.drive.files.delete({ fileId: response.data.files[0].id });
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.drive.files.list({ pageSize: 1 });
            return true;
        } catch {
            return false;
        }
    }
}
