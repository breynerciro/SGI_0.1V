import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLicense } from '../../contexts/LicenseContext';
import './Layout.css';

export default function Header() {
    const { branding, themeMode, toggleTheme } = useTheme();
    const { licenseStatus } = useLicense();

    return (
        <header className="app-header">
            <div className="header-brand">
                {branding?.systemName || 'Sistema de Inventarios'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    title={themeMode === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                >
                    {themeMode === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
                        </svg>
                    )}
                </button>
                <div className="license-info">
                    <span className="status-indicator"></span>
                    Software Licenciado a: <strong>{licenseStatus?.details?.companyName || 'Usuario Autorizado'}</strong>
                </div>
            </div>
        </header>
    );
}
