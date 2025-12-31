import { ipcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_FILE = 'branding-config.json';

function getConfigPath() {
    return path.join(app.getPath('userData'), CONFIG_FILE);
}

const DEFAULT_BRANDING = {
    systemName: 'Sistema de Inventarios',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981'
};

export function registerBrandingHandlers() {
    ipcMain.handle('branding:get', async () => {
        const configPath = getConfigPath();
        try {
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error reading branding config:', error);
        }
        return DEFAULT_BRANDING;
    });

    ipcMain.handle('branding:update', async (evt, data) => {
        const configPath = getConfigPath();
        const configDir = path.dirname(configPath);
        try {
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
            return data;
        } catch (error) {
            console.error('Error updating branding config:', error);
            throw error;
        }
    });
}
