import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '@shared/types';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await dashboardApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-screen">Cargando resumen del sistema...</div>;
    if (!stats) return <div className="error-screen">Error al cargar estadísticas</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Panel de Control</h1>
                    <p className="subtitle">Bienvenido al Sistema de Gestión de Inventarios</p>
                </div>
                <div className="sync-status">
                    <span>Último Respaldo:</span>
                    <strong>{stats.lastSyncDate ? new Date(stats.lastSyncDate).toLocaleString() : 'Nunca'}</strong>
                </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="stat-card primary">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3>Total Productos</h3>
                        <p>{stats.totalProducts}</p>
                    </div>
                </div>

                {/* Note: Warehouses card removed per user request for single-warehouse default */}

                <div className="stat-card warning">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <h3>Bajo Stock</h3>
                        <p>{stats.lowStockItems}</p>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3>Valor Inventario</h3>
                        <p>${stats.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-details">
                <div className="recent-activity card">
                    <div className="card-header">
                        <h2>Actividad Reciente</h2>
                        <span className="badge">{stats.recentMovements} en los últimos 7 días</span>
                    </div>
                    <div className="activity-placeholder">
                        <p>Las últimas transacciones de ventas y compras aparecerán aquí.</p>
                        <button className="btn-link" onClick={() => navigate('/reports')}>Ver reportes detallados →</button>
                    </div>
                </div>

                <div className="quick-actions card">
                    <h2 className="card-header">Acciones Rápidas</h2>
                    <div className="action-buttons">
                        <button className="quick-btn" onClick={() => navigate('/sales')}>
                            <span>🛒</span> Nueva Venta
                        </button>
                        <button className="quick-btn" onClick={() => navigate('/purchases')}>
                            <span>📥</span> Registrar Compra
                        </button>
                        <button className="quick-btn" onClick={() => navigate('/products')}>
                            <span>➕</span> Añadir Producto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
