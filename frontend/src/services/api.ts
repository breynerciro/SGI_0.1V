import { IProduct, IWarehouse, IInventoryMovement, DashboardStats } from '@shared/types';

// Type definition for window.electronAPI
declare global {
    interface Window {
        electronAPI: {
            // License
            getLicenseStatus: () => Promise<any>;
            onLicenseStatus: (callback: (status: any) => void) => () => void;

            // Products
            getProducts: (filters?: any) => Promise<IProduct[]>;
            getProduct: (id: string) => Promise<IProduct | null>;
            createProduct: (data: any) => Promise<IProduct>;
            updateProduct: (id: string, data: any) => Promise<IProduct>;
            deleteProduct: (id: string) => Promise<void>;

            // Warehouses
            getWarehouses: () => Promise<IWarehouse[]>;
            createWarehouse: (data: any) => Promise<IWarehouse>;

            // Movements
            getMovements: (filters?: any) => Promise<IInventoryMovement[]>;
            createMovement: (data: any) => Promise<IInventoryMovement>;

            // Dashboard
            getDashboardStats: () => Promise<DashboardStats>;

            // Sync
            syncNow: () => Promise<{ success: boolean; error?: string }>;
            syncConfigure: (provider: string, config: any) => Promise<{ success: boolean; error?: string }>;
            getSyncStatus: () => Promise<any>;

            // Branding
            getBranding: () => Promise<any>;
            updateBranding: (data: any) => Promise<any>;
        };
    }
}

export const licenseApi = {
    getStatus: () => window.electronAPI.getLicenseStatus(),
};

export const productApi = {
    getAll: (filters?: any) => window.electronAPI.getProducts(filters),
    getById: (id: string) => window.electronAPI.getProduct(id),
    create: (data: any) => window.electronAPI.createProduct(data),
    update: (id: string, data: any) => window.electronAPI.updateProduct(id, data),
    delete: (id: string) => window.electronAPI.deleteProduct(id),
};

export const movementsApi = {
    getAll: (filters?: any) => window.electronAPI.getMovements(filters),
    create: (data: any) => window.electronAPI.createMovement(data),
};

export const dashboardApi = {
    getStats: () => window.electronAPI.getDashboardStats(),
};

export const syncApi = {
    syncNow: () => window.electronAPI.syncNow(),
    configure: (provider: string, config: any) => window.electronAPI.syncConfigure(provider, config),
    getStatus: () => window.electronAPI.getSyncStatus(),
};

export const brandingApi = {
    get: () => window.electronAPI.getBranding(),
    update: (data: any) => window.electronAPI.updateBranding(data),
};
