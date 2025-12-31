import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loading...');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // License
    getLicenseStatus: () => ipcRenderer.invoke('license:getStatus'),
    importLicense: () => ipcRenderer.invoke('license:import'),
    onLicenseStatus: (callback: (status: any) => void) => {
        const subscription = (_event: any, status: any) => callback(status);
        ipcRenderer.on('license-status', subscription);
        return () => ipcRenderer.removeListener('license-status', subscription);
    },

    // Products
    getProducts: (filters?: any) => ipcRenderer.invoke('products:getAll', filters),
    getProduct: (id: string) => ipcRenderer.invoke('products:get', id),
    createProduct: (data: any) => ipcRenderer.invoke('products:create', data),
    updateProduct: (id: string, data: any) => ipcRenderer.invoke('products:update', id, data),
    deleteProduct: (id: string) => ipcRenderer.invoke('products:delete', id),
    softDeleteProduct: (id: string) => ipcRenderer.invoke('products:softDelete', id),

    // Warehouses
    getWarehouses: () => ipcRenderer.invoke('warehouses:getAll'),
    createWarehouse: (data: any) => ipcRenderer.invoke('warehouses:create', data),

    // Movements
    getMovements: (filters?: any) => ipcRenderer.invoke('movements:getAll', filters),
    createMovement: (data: any) => ipcRenderer.invoke('movements:create', data),

    // Dashboard
    getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),

    // Sync
    getSyncAuthUrl: (clientId: string, clientSecret: string) => ipcRenderer.invoke('sync:getAuthUrl', clientId, clientSecret),
    waitForAuth: () => ipcRenderer.invoke('sync:waitForAuth'),
    authenticateWithCode: (code: string) => ipcRenderer.invoke('sync:authenticateWithCode', code),
    syncNow: () => ipcRenderer.invoke('sync:now'),
    syncConfigure: (provider: string, config: any) => ipcRenderer.invoke('sync:configure', provider, config),
    getSyncStatus: () => ipcRenderer.invoke('sync:getStatus'),
    getSyncConfig: (provider: string) => ipcRenderer.invoke('sync:getConfig', provider),
    loadSavedCredentials: (provider: string) => ipcRenderer.invoke('sync:loadSavedCredentials', provider),
    syncDisconnect: (provider: string) => ipcRenderer.invoke('sync:disconnect', provider),
    listBackups: () => ipcRenderer.invoke('sync:listBackups'),
    restoreBackup: (filename: string) => ipcRenderer.invoke('sync:restore', filename),

    // Branding
    getBranding: () => ipcRenderer.invoke('branding:get'),
    updateBranding: (data: any) => ipcRenderer.invoke('branding:update', data),
});
