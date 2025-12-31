import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import './Settings.css';

export default function Settings() {
    const { branding: themeBranding, updateBranding } = useTheme();
    const [activeTab, setActiveTab] = useState<'branding' | 'sync' | 'license' | 'about'>('branding');
    const [branding, setBranding] = useState({
        systemName: themeBranding?.systemName || 'Sistema de Inventarios',
        primaryColor: themeBranding?.primaryColor || '#3B82F6'
    });
    const [syncConfig, setSyncConfig] = useState({
        clientId: '',
        clientSecret: ''
    });
    const [saving, setSaving] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);
    const [showBackups, setShowBackups] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'danger' | 'warning' | 'info' | 'success';
        confirmText?: string;
        cancelText?: string | null;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info',
        onConfirm: () => { }
    });

    useEffect(() => {
        if (themeBranding) {
            setBranding({
                systemName: themeBranding.systemName,
                primaryColor: themeBranding.primaryColor
            });
        }
    }, [themeBranding]);

    // Load saved credentials on mount
    useEffect(() => {
        const loadSavedConfig = async () => {
            const config = await (window as any).electronAPI.getSyncConfig('Google Drive');
            if (config.connected) {
                setIsConnected(true);
                // Try to load and authenticate with saved credentials
                const result = await (window as any).electronAPI.loadSavedCredentials('Google Drive');
                if (result.success && result.config) {
                    setSyncConfig({
                        clientId: result.config.clientId || '',
                        clientSecret: result.config.clientSecret || ''
                    });
                }
            }
        };
        loadSavedConfig();
    }, []);

    const handleSaveBranding = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateBranding(branding);
            setConfirmDialog({
                isOpen: true,
                title: 'Configuración Guardada',
                message: 'Configuración de marca guardada con éxito.',
                variant: 'success',
                confirmText: 'Aceptar',
                cancelText: null,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
        } catch (error) {
            setConfirmDialog({
                isOpen: true,
                title: 'Error',
                message: 'Error al guardar marca',
                variant: 'danger',
                confirmText: 'Aceptar',
                cancelText: null,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSaving(false);
        }
    };

    const handleConnectGoogleDrive = async () => {
        if (!syncConfig.clientId || !syncConfig.clientSecret) {
            setConfirmDialog({
                isOpen: true,
                title: 'Credenciales Faltantes',
                message: 'Por favor ingresa el Client ID y Client Secret de tu proyecto de Google Cloud.',
                variant: 'warning',
                confirmText: 'Aceptar',
                cancelText: null,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setSaving(true);
        try {
            // Get auth URL and automatically open browser
            await (window as any).electronAPI.getSyncAuthUrl(syncConfig.clientId, syncConfig.clientSecret);

            // Replaced Alert with nothing or a toast would be better, but user said native alerts lock up.
            // I'll skip the intermediate alert "Se ha abierto el navegador" as it's self-evident or add a small non-blocking text if possible.
            // But since I only have modals, showing a modal saying "Browser opened" is also blocking interaction until dismissed.
            // I will use a modal but make it clearer.
            setConfirmDialog({
                isOpen: true,
                title: 'Autenticación',
                message: 'Se ha abierto el navegador. Por favor autoriza la aplicación y luego regresa aquí.',
                variant: 'info',
                confirmText: 'Entendido',
                cancelText: null,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });

            // Wait for the OAuth callback
            const authResult = await (window as any).electronAPI.waitForAuth();
            if (authResult.success) {
                const configToSave = {
                    clientId: syncConfig.clientId,
                    clientSecret: syncConfig.clientSecret,
                    refreshToken: authResult.tokens.refresh_token
                };
                const result = await (window as any).electronAPI.syncConfigure('Google Drive', configToSave);
                if (result.success) {
                    setIsConnected(true);
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Conexión Exitosa',
                        message: '¡El sistema ahora está sincronizado con Google Drive!',
                        variant: 'success',
                        confirmText: 'Aceptar',
                        cancelText: null,
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                    });
                } else {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Error de Configuración',
                        message: 'Error al guardar la configuración: ' + result.error,
                        variant: 'danger',
                        confirmText: 'Aceptar',
                        cancelText: null,
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                    });
                }
            } else {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Error de Autenticación',
                    message: 'La autenticación no se completó: ' + authResult.error,
                    variant: 'danger',
                    confirmText: 'Aceptar',
                    cancelText: null,
                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            setConfirmDialog({
                isOpen: true,
                title: 'Error',
                message: 'Error al conectar con Google Drive',
                variant: 'danger',
                confirmText: 'Aceptar',
                cancelText: null,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnect = async () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Desconectar Google Drive',
            message: '¿Estás seguro de que deseas desconectar Google Drive?',
            variant: 'warning',
            onConfirm: async () => {
                setSaving(true);
                try {
                    const result = await (window as any).electronAPI.syncDisconnect('Google Drive');
                    if (result.success) {
                        setIsConnected(false);
                        setSyncConfig({ clientId: '', clientSecret: '' });
                        setConfirmDialog({
                            isOpen: true,
                            title: 'Desconectado',
                            message: 'Desconectado de Google Drive exitosamente.',
                            variant: 'info',
                            confirmText: 'Aceptar',
                            cancelText: null,
                            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                        });
                    } else {
                        setConfirmDialog({
                            isOpen: true,
                            title: 'Error',
                            message: 'Error al desconectar: ' + result.error,
                            variant: 'danger',
                            confirmText: 'Aceptar',
                            cancelText: null,
                            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Error',
                        message: 'Error al desconectar',
                        variant: 'danger',
                        confirmText: 'Aceptar',
                        cancelText: null,
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const handleLoadBackups = async () => {
        setSaving(true);
        try {
            const result = await (window as any).electronAPI.listBackups();
            if (result.success) {
                setBackups(result.backups);
                setShowBackups(true);
            } else {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Error',
                    message: 'Error al cargar backups: ' + result.error,
                    variant: 'danger',
                    confirmText: 'Aceptar',
                    cancelText: null,
                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            setConfirmDialog({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar backups',
                variant: 'danger',
                confirmText: 'Aceptar',
                cancelText: null,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSaving(false);
        }
    };

    const handleRestoreBackup = async (filename: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Restaurar Base de Datos',
            message: `¿Estás seguro de que deseas restaurar el backup "${filename}"?\nEsto reemplazará la base de datos actual.`,
            variant: 'warning',
            onConfirm: async () => {
                setSaving(true);
                try {
                    const result = await (window as any).electronAPI.restoreBackup(filename);
                    if (result.success) {
                        setConfirmDialog({
                            isOpen: true,
                            title: 'Restauración Exitosa',
                            message: 'Base de datos restaurada exitosamente. Por favor reinicia la aplicación para ver los cambios.',
                            variant: 'success',
                            confirmText: 'Aceptar',
                            cancelText: null,
                            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                        });
                        setShowBackups(false);
                    } else {
                        setConfirmDialog({
                            isOpen: true,
                            title: 'Error',
                            message: 'Error al restaurar: ' + result.error,
                            variant: 'danger',
                            confirmText: 'Aceptar',
                            cancelText: null,
                            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Error',
                        message: 'Error al restaurar backup',
                        variant: 'danger',
                        confirmText: 'Aceptar',
                        cancelText: null,
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const runSyncNow = async () => {
        setSaving(true);
        try {
            const result = await (window as any).electronAPI.syncNow();
            if (result.success) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Sincronización',
                    message: 'Sincronización completada con éxito.',
                    variant: 'success',
                    confirmText: 'Aceptar',
                    cancelText: null,
                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                });
            } else {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Error',
                    message: 'Error en sincronización: ' + result.error,
                    variant: 'danger',
                    confirmText: 'Aceptar',
                    cancelText: null,
                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            setConfirmDialog({
                isOpen: true,
                title: 'Error',
                message: 'Error al ejecutar sincronización',
                variant: 'danger',
                confirmText: 'Aceptar',
                cancelText: null,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSaving(false);
        }
    };

    const handleImportLicense = async () => {
        setSaving(true);
        try {
            const result = await (window as any).electronAPI.importLicense();
            if (result.success) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Licencia Importada',
                    message: 'Licencia importada exitosamente. Por favor reinicia la aplicación.',
                    variant: 'success',
                    confirmText: 'Aceptar',
                    cancelText: null,
                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                });
            } else {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Error',
                    message: 'Error al importar licencia: ' + result.error,
                    variant: 'danger',
                    confirmText: 'Aceptar',
                    cancelText: null,
                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            setConfirmDialog({
                isOpen: true,
                title: 'Error',
                message: 'Error al importar licencia',
                variant: 'danger',
                confirmText: 'Aceptar',
                cancelText: null,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-page">
            <h1 className="page-title">Configuración del Sistema</h1>

            <div className="settings-container">
                <div className="settings-sidebar">
                    <button
                        className={`settings-nav-item ${activeTab === 'branding' ? 'active' : ''}`}
                        onClick={() => setActiveTab('branding')}
                    >
                        Branding y Marca
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'sync' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sync')}
                    >
                        Sincronización Nube
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'license' ? 'active' : ''}`}
                        onClick={() => setActiveTab('license')}
                    >
                        Licencia
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
                        onClick={() => setActiveTab('about')}
                    >
                        Acerca de
                    </button>
                </div>

                <div className="settings-content">
                    {activeTab === 'branding' && (
                        <form onSubmit={handleSaveBranding}>
                            <h2 className="section-title">Identidad del Sistema</h2>
                            <div className="form-group">
                                <label>Nombre del Sistema</label>
                                <input
                                    className="form-input"
                                    value={branding.systemName}
                                    onChange={e => setBranding({ ...branding, systemName: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Color de Acento</label>
                                    <div className="color-picker-wrapper">
                                        <input
                                            type="color"
                                            value={branding.primaryColor}
                                            onChange={e => setBranding({ ...branding, primaryColor: e.target.value })}
                                        />
                                        <span>{branding.primaryColor}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="action-button" type="submit" disabled={saving}>
                                Guardar Preferencias
                            </button>
                        </form>
                    )}

                    {activeTab === 'sync' && (
                        <div>
                            <h2 className="section-title">Google Drive Sync</h2>

                            {isConnected ? (
                                <div>
                                    <div style={{
                                        background: '#f0fdf4',
                                        border: '1px solid #10b981',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <p style={{ margin: '0', fontWeight: 'bold', color: '#047857' }}>
                                            ✅ Conectado a Google Drive
                                        </p>
                                    </div>

                                    <div className="sync-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <button
                                            className="action-button"
                                            type="button"
                                            onClick={runSyncNow}
                                            disabled={saving}
                                        >
                                            Sincronizar Ahora
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            type="button"
                                            onClick={handleLoadBackups}
                                            disabled={saving}
                                        >
                                            Ver Backups Disponibles
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            type="button"
                                            onClick={handleDisconnect}
                                            disabled={saving}
                                            style={{ background: '#ef4444', color: 'white' }}
                                        >
                                            Desconectar
                                        </button>
                                    </div>

                                    {showBackups && (
                                        <div style={{ marginTop: '2rem' }}>
                                            <h3 style={{ marginBottom: '1rem' }}>Backups Disponibles</h3>
                                            {backups.length === 0 ? (
                                                <p>No hay backups disponibles en Google Drive.</p>
                                            ) : (
                                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                    {backups.map((backup: any, index: number) => (
                                                        <div key={index} style={{
                                                            background: '#f9fafb',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '6px',
                                                            padding: '1rem',
                                                            marginBottom: '0.5rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <div>
                                                                <p style={{ margin: '0', fontWeight: 'bold' }}>{backup.filename}</p>
                                                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                                                                    {new Date(backup.timestamp).toLocaleString('es-ES')} - {(backup.size / 1024).toFixed(2)} KB
                                                                </p>
                                                            </div>
                                                            <button
                                                                className="btn-secondary"
                                                                onClick={() => handleRestoreBackup(backup.filename)}
                                                                disabled={saving}
                                                                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                                            >
                                                                Restaurar
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                className="btn-secondary"
                                                onClick={() => setShowBackups(false)}
                                                style={{ marginTop: '1rem' }}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="section-desc">
                                        Para sincronizar con Google Drive, necesitas crear un proyecto gratuito en Google Cloud Console y obtener tus credenciales OAuth.
                                    </p>
                                    <div className="sync-form" style={{ marginTop: '1.5rem' }}>
                                        <div style={{
                                            background: '#f0f9ff',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            marginBottom: '1.5rem'
                                        }}>
                                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#1e40af' }}>
                                                📋 Cómo obtener tus credenciales:
                                            </p>
                                            <ol style={{ margin: '0', paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#1e3a8a' }}>
                                                <li>Ve a <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Google Cloud Console</a></li>
                                                <li>Crea un nuevo proyecto (es gratis)</li>
                                                <li>Habilita la API de Google Drive</li>
                                                <li>Crea credenciales OAuth 2.0 (tipo "Aplicación de escritorio")</li>
                                                <li>Copia el Client ID y Client Secret aquí abajo</li>
                                            </ol>
                                        </div>

                                        <div className="form-group">
                                            <label>Client ID</label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={syncConfig.clientId}
                                                onChange={e => setSyncConfig({ ...syncConfig, clientId: e.target.value })}
                                                placeholder="Tu Client ID de Google Cloud"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Client Secret</label>
                                            <input
                                                className="form-input"
                                                type="password"
                                                value={syncConfig.clientSecret}
                                                onChange={e => setSyncConfig({ ...syncConfig, clientSecret: e.target.value })}
                                                placeholder="Tu Client Secret de Google Cloud"
                                            />
                                        </div>
                                        <div>
                                            <button
                                                type="button"
                                                className="action-button"
                                                onClick={handleConnectGoogleDrive}
                                                disabled={saving}
                                                style={{ width: '100%', marginTop: '1rem' }}
                                            >
                                                {saving ? 'Esperando autorización...' : 'Conectar con Google Drive'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'license' && (
                        <div>
                            <h2 className="section-title">Gestión de Licencia</h2>
                            <p className="section-desc">
                                Importa un archivo de licencia (.lic) generado por el activador portable.
                            </p>

                            <div style={{ marginTop: '2rem' }}>
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #10b981',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    marginBottom: '2rem'
                                }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#047857' }}>
                                        ✅ Licencia Activa
                                    </p>
                                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#065f46' }}>
                                        <strong>Empresa:</strong> {themeBranding?.systemName || 'Sistema de Inventarios'}
                                    </p>
                                </div>

                                <button
                                    className="action-button"
                                    onClick={handleImportLicense}
                                    disabled={saving}
                                    style={{ width: '100%' }}
                                >
                                    {saving ? 'Importando...' : '📁 Importar Nueva Licencia'}
                                </button>

                                <div style={{
                                    background: '#f0f9ff',
                                    border: '1px solid #3b82f6',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginTop: '2rem'
                                }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#1e40af' }}>
                                        ℹ️ Instrucciones:
                                    </p>
                                    <ol style={{ margin: '0', paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#1e3a8a' }}>
                                        <li>Obtén el archivo .lic del administrador</li>
                                        <li>Haz clic en "Importar Nueva Licencia"</li>
                                        <li>Selecciona el archivo .lic</li>
                                        <li>Reinicia la aplicación</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="about-section">
                            <h2 className="section-title">Sobre el Sistema</h2>
                            <div className="about-info">
                                <p><strong>Versión:</strong> 0.1V - Beta</p>
                                <p><strong>Motor:</strong> SQLite 3 (Prisma)</p>
                                <p><strong>Frontend:</strong> React + Vite</p>
                                <p><strong>Seguridad:</strong> Cifrado AES-256-GCM + Argon2</p>
                                <hr />
                                <p><strong>Desarrollado por:</strong> Breyner Ciro</p>
                                <p><strong>Celular:</strong> 3183420438</p>
                                <p><strong>Email:</strong> breynerismael@gmail.com</p>
                            </div>
                        </div>
                    )}
                </div>
            </div >

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div >
    );
}
