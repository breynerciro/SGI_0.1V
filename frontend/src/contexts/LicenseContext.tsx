import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LicenseStatus {
    isValid: boolean;
    machineId: string;
    details?: {
        companyName: string;
        expiresAt: string;
    };
    error?: string;
}

interface LicenseContextType {
    licenseStatus: LicenseStatus | null;
    loading: boolean;
    checkLicense: () => Promise<void>;
    importLicense: () => Promise<{ success: boolean; error?: string }>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const checkLicense = async () => {
        setLoading(true);
        try {
            // We use the onLicenseStatus or a direct invoke if we add it
            // For simplicity, let's assume we add a getLicenseStatus to electronAPI
            const status = await (window as any).electronAPI.getLicenseStatus();
            setLicenseStatus(status);
        } catch (error) {
            console.error('Error checking license:', error);
            setLicenseStatus({ isValid: false, machineId: 'UNKNOWN', error: 'Error de comunicación' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkLicense();

        // Listen for status updates from main process
        const unsubscribe = (window as any).electronAPI.onLicenseStatus((status: any) => {
            setLicenseStatus(status);
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const importLicense = async () => {
        try {
            const result = await (window as any).electronAPI.importLicense();
            if (result.success) {
                await checkLicense();
            }
            return result;
        } catch (error) {
            console.error('Error importing license:', error);
            return { success: false, error: 'Error al importar archivo' };
        }
    };

    return (
        <LicenseContext.Provider value={{ licenseStatus, loading, checkLicense, importLicense }}>
            {children}
        </LicenseContext.Provider>
    );
}

export function useLicense() {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
}
