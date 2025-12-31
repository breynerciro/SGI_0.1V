import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { LicenseValidator } from './license/LicenseValidator';

// Initialize dotenv
dotenv.config();

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
    // Validate license
    const licenseValidation = await LicenseValidator.validate();

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false // Ensure preload has access if needed
        },
    });

    console.log('Preload path:', path.join(__dirname, 'preload.js'));

    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('App is packaged:', app.isPackaged);

    // Load the app
    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../frontend/index.html'));
    }

    // Send license status to renderer
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow?.webContents.send('license-status', licenseValidation);
    });
}

const { registerHandlers } = require('../backend/api');

app.whenReady().then(async () => {
    try {
        console.log('App ready. Initializing handlers...');
        registerHandlers();
    } catch (error) {
        console.error('Failed to register handlers on app ready:', error);
    }
    createWindow();
});
