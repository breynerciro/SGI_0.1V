import { ipcMain, dialog } from 'electron';
import { LicenseValidator } from '../../electron/license/LicenseValidator';
import { MachineIdGenerator } from '../../electron/license/MachineIdGenerator';
import * as fs from 'fs';

export function registerLicenseHandlers() {
    ipcMain.handle('license:getStatus', async () => {
        const validation = await LicenseValidator.validate();
        const machineId = MachineIdGenerator.generate();

        return {
            isValid: validation.valid,
            machineId,
            details: validation.license ? {
                companyName: validation.license.companyName,
                expiresAt: validation.license.expiresAt
            } : undefined,
            error: validation.error
        };
    });

    ipcMain.handle('license:import', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Licencia SGI', extensions: ['lic'] }
            ]
        });

        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, error: 'Importación cancelada' };
        }

        const filePath = result.filePaths[0];
        const licenseData = fs.readFileSync(filePath);
        return await LicenseValidator.install(licenseData);
    });
}
