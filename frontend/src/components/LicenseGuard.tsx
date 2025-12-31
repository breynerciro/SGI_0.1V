import React from 'react';
import { useLicense } from '../contexts/LicenseContext';
import LicenseWarning from '../pages/LicenseWarning';

interface LicenseGuardProps {
    children: React.ReactNode;
}

export default function LicenseGuard({ children }: LicenseGuardProps) {
    const { licenseStatus, loading } = useLicense();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Verificando Licencia...</h2>
                </div>
            </div>
        );
    }

    if (!licenseStatus?.isValid) {
        return <LicenseWarning status={licenseStatus} />;
    }

    return <>{children}</>;
}
