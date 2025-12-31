import { CryptoService } from '../../backend/infrastructure/encryption/CryptoService';
import { License } from './LicenseValidator';
import * as fs from 'fs';

/**
 * License Generator - This tool should be kept separate and secure
 * Used only by authorized personnel to generate client licenses
 */
export class LicenseGenerator {
    private static readonly LICENSE_PASSWORD = process.env.LICENSE_PASSWORD || 'default-insecure-password-do-not-use-in-prod';
    private static readonly SIGNING_SECRET = process.env.SIGNING_SECRET || 'default-insecure-secret';

    /**
     * Generate a license file
     */
    static generate(params: {
        clientId: string;
        companyName: string;
        machineId?: string;
        validityDays: number;
        features?: string[];
        maxUsers?: number;
    }): Buffer {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + params.validityDays * 24 * 60 * 60 * 1000);

        const license: License = {
            clientId: params.clientId,
            companyName: params.companyName,
            machineId: params.machineId,
            issuedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            features: params.features || ['*'],
            maxUsers: params.maxUsers,
            signature: this.generateSignature(params.clientId, params.companyName, expiresAt.toISOString()),
        };

        return CryptoService.encryptJSON(license, this.LICENSE_PASSWORD);
    }

    /**
     * Generate signature for license
     */
    private static generateSignature(clientId: string, companyName: string, expiresAt: string): string {
        const data = `${clientId}:${companyName}:${expiresAt}:${this.SIGNING_SECRET}`;
        return CryptoService.hash(data);
    }

    /**
     * Save license to file
     */
    static saveToFile(licenseData: Buffer, outputPath: string): void {
        fs.writeFileSync(outputPath, licenseData);
    }
}

// CLI tool for generating licenses (run separately)
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log('Usage: node LicenseGenerator.js <clientId> <companyName> <validityDays> [machineId] [outputPath]');
        process.exit(1);
    }

    const [clientId, companyName, validityDays, machineId, outputPath] = args;

    const license = LicenseGenerator.generate({
        clientId,
        companyName,
        validityDays: parseInt(validityDays),
        machineId: machineId || undefined,
    });

    const output = outputPath || `license_${clientId}.lic`;
    LicenseGenerator.saveToFile(license, output);
    console.log(`License generated: ${output}`);
}
