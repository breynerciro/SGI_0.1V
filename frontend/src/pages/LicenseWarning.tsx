import React, { useState } from 'react';

interface LicenseWarningProps {
    status: {
        machineId: string;
        error?: string;
    } | null;
}

export default function LicenseWarning({ status }: LicenseWarningProps) {
    const [importing, setImporting] = useState(false);

    const handleImportLicense = async () => {
        setImporting(true);
        try {
            const result = await (window as any).electronAPI.importLicense();
            if (result.success) {
                alert('Licencia importada exitosamente. La aplicación se recargará.');
                window.location.reload();
            } else {
                alert('Error al importar licencia: ' + result.error);
            }
        } catch (error) {
            alert('Error al importar licencia');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f3f4f6',
            padding: '2rem',
            textAlign: 'center',
            color: '#1f2937'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                maxWidth: '600px',
                width: '100%'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Licencia Requerida
                </h1>
                <p style={{ color: '#4b5563', marginBottom: '2rem', fontSize: '1.125rem' }}>
                    Esta copia del software no ha sido activada o la licencia ha expirado.
                    Por favor, contacte con el proveedor para obtener su clave de activación.
                </p>

                <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    marginBottom: '2rem'
                }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ID de Máquina (Hardware ID)
                    </p>
                    <code style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', wordBreak: 'break-all' }}>
                        {status?.machineId || 'Generando ID...'}
                    </code>
                </div>

                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    Envie este identificador a su proveedor para generar su licencia personalizada.
                </div>

                {status?.error && (
                    <div style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.9rem' }}>
                        Error: {status.error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        onClick={handleImportLicense}
                        disabled={importing}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            cursor: importing ? 'not-allowed' : 'pointer',
                            opacity: importing ? 0.6 : 1
                        }}
                    >
                        {importing ? 'Importando...' : '📁 Importar Licencia'}
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Reintentar Verificación
                    </button>
                </div>
            </div>
        </div>
    );
}
