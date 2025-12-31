import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { CryptoService } from '../../backend/infrastructure/encryption/CryptoService';
import { MachineIdGenerator } from './MachineIdGenerator';

export interface License {
    clientId: string;
    companyName: string;
    machineId?: string; // Optional for floating licenses
    issuedAt: string;
    expiresAt: string;
    features: string[];
    maxUsers?: number;
    signature: string;
}

export class LicenseValidator {
    private static readonly LICENSE_FILE = 'license.lic';
    private static readonly LICENSE_PASSWORD = process.env.LICENSE_PASSWORD || 'default-insecure-password-do-not-use-in-prod';

    /**
     * Get possible license paths (Project root is now prioritized)
     */
    private static getLicensePaths(): string[] {
        const paths = [
            // User data directory (Hidden system fallback - Prioritized for imports)
            path.join(app.getPath('userData'), this.LICENSE_FILE),
            // Root of the project (Easy to find and drop file)
            path.join(process.cwd(), this.LICENSE_FILE),
        ];

        // In production, also check beside the executable
        if (app.isPackaged) {
            paths.push(path.join(path.dirname(app.getPath('exe')), this.LICENSE_FILE));
        }

        return paths;
    }

    /**
     * Validate the license file
     */
    static async validate(): Promise<{ valid: boolean; license?: License; error?: string }> {
        try {
            const possiblePaths = this.getLicensePaths();
            let licensePath = '';

            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    licensePath = p;
                    break;
                }
            }

            if (!licensePath) {
                return { valid: false, error: 'No se encontró archivo de licencia (Copia license.lic a la carpeta del programa)' };
            }

            // Read and decrypt license
            const encryptedData = fs.readFileSync(licensePath);
            const license = CryptoService.decryptJSON<License>(encryptedData, this.LICENSE_PASSWORD);

            // Validate expiration
            const now = new Date();
            const expiresAt = new Date(license.expiresAt);

            if (now > expiresAt) {
                return { valid: false, error: 'La licencia ha expirado', license };
            }

            // Validate machine ID if specified
            if (license.machineId) {
                const currentMachineId = MachineIdGenerator.generate();
                if (license.machineId !== currentMachineId) {
                    return {
                        valid: false,
                        error: 'Esta licencia no es válida para este equipo',
                        license
                    };
                }
            }

            return { valid: true, license };
        } catch (error) {
            return {
                valid: false,
                error: `Error al validar licencia: ${error instanceof Error ? error.message : 'desconocido'}`
            };
        }
    }

    /**
     * Install a license file (Saves to the most accessible path)
     */
    static async install(licenseData: Buffer): Promise<{ success: boolean; error?: string }> {
        try {
            // Save to userData directory by default (More reliable in packaged apps)
            const licensePath = path.join(app.getPath('userData'), this.LICENSE_FILE);
            fs.writeFileSync(licensePath, licenseData);

            const validation = await this.validate();
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: `Error al instalar licencia: ${error instanceof Error ? error.message : 'desconocido'}`
            };
        }
    }

    static async getLicenseInfo(): Promise<License | null> {
        const validation = await this.validate();
        return validation.license || null;
    }

    static async hasFeature(feature: string): Promise<boolean> {
        const validation = await this.validate();
        if (!validation.valid || !validation.license) return false;
        return validation.license.features.includes(feature) || validation.license.features.includes('*');
    }
}
