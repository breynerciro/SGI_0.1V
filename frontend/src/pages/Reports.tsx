import { useState, useEffect } from 'react';
import { movementsApi, productApi } from '../services/api';
import { IInventoryMovement, MovementType, IProduct } from '@shared/types';
import './Reports.css';

export default function Reports() {
    const [activeTab, setActiveTab] = useState<'sales' | 'purchases' | 'stock'>('sales');
    const [movements, setMovements] = useState<IInventoryMovement[]>([]);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [movs, prods] = await Promise.all([
                movementsApi.getAll(),
                productApi.getAll()
            ]);
            setMovements(movs);
            setProducts(prods);
        } catch (error) {
            console.error('Error loading report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const salesMovements = movements.filter(m => m.type === MovementType.OUT);
    const purchaseMovements = movements.filter(m => m.type === MovementType.IN);

    const calculateTotals = (movs: IInventoryMovement[]) => {
        let totalAmount = 0;
        let totalItems = 0;

        movs.forEach(m => {
            (m as any).items?.forEach((item: any) => {
                totalAmount += (m.type === MovementType.OUT ? item.price : item.cost) * item.quantity;
                totalItems += item.quantity;
            });
        });

        return { totalAmount, totalItems, transactionCount: movs.length };
    };

    const salesStats = calculateTotals(salesMovements);
    const purchaseStats = calculateTotals(purchaseMovements);

    const renderSalesTab = () => (
        <div className="report-content">
            <div className="stats-grid">
                <div className="stat-card">
                    <h4>Total Ventas</h4>
                    <p className="stat-value">${salesStats.totalAmount.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                    <h4>Items Vendidos</h4>
                    <p className="stat-value">{salesStats.totalItems}</p>
                </div>
                <div className="stat-card">
                    <h4>Transacciones</h4>
                    <p className="stat-value">{salesStats.transactionCount}</p>
                </div>
            </div>

            <table className="report-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Referencia</th>
                        <th>Productos</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {salesMovements.map(m => {
                        const total = (m as any).items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
                        return (
                            <tr key={m.id}>
                                <td>{new Date(m.date).toLocaleDateString()}</td>
                                <td>{m.reference || 'N/A'}</td>
                                <td>{(m as any).items?.length || 0} items</td>
                                <td style={{ fontWeight: 600 }}>${total.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const renderPurchasesTab = () => (
        <div className="report-content">
            <div className="stats-grid">
                <div className="stat-card">
                    <h4>Inversión en Compras</h4>
                    <p className="stat-value">${purchaseStats.totalAmount.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                    <h4>Items Comprados</h4>
                    <p className="stat-value">{purchaseStats.totalItems}</p>
                </div>
                <div className="stat-card">
                    <h4>Órdenes</h4>
                    <p className="stat-value">{purchaseStats.transactionCount}</p>
                </div>
            </div>

            <table className="report-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Referencia</th>
                        <th>Productos</th>
                        <th>Total Invertido</th>
                    </tr>
                </thead>
                <tbody>
                    {purchaseMovements.map(m => {
                        const total = (m as any).items?.reduce((sum: number, item: any) => sum + (item.cost * item.quantity), 0) || 0;
                        return (
                            <tr key={m.id}>
                                <td>{new Date(m.date).toLocaleDateString()}</td>
                                <td>{m.reference || 'N/A'}</td>
                                <td>{(m as any).items?.length || 0} items</td>
                                <td style={{ fontWeight: 600 }}>${total.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const renderStockTab = () => {
        const totalValue = products.reduce((sum, p) => {
            const stock = p.stock?.reduce((s, st) => s + st.quantity, 0) || 0;
            return sum + (stock * p.cost);
        }, 0);

        const lowStockCount = products.filter(p => {
            const stock = p.stock?.reduce((s, st) => s + st.quantity, 0) || 0;
            return stock < p.minStock;
        }).length;

        return (
            <div className="report-content">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h4>Valor Valorizado (Costo)</h4>
                        <p className="stat-value">${totalValue.toFixed(2)}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Productos con Bajo Stock</h4>
                        <p className="stat-value" style={{ color: 'var(--error)' }}>{lowStockCount}</p>
                    </div>
                </div>

                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Stock Actual</th>
                            <th>Min Requerido</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => {
                            const stock = p.stock?.reduce((s, st) => s + st.quantity, 0) || 0;
                            const isLow = stock < p.minStock;
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                        <div style={{ fontSize: '0.8rem' }}>{p.code}</div>
                                    </td>
                                    <td>{stock} {p.unit}</td>
                                    <td>{p.minStock}</td>
                                    <td>
                                        <span className={`status-badge ${isLow ? 'status-inactive' : 'status-active'}`}>
                                            {isLow ? 'BAJO' : 'OK'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="reports-page">
            <h1 className="page-title">Reportes e Historial</h1>

            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    Ventas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('purchases')}
                >
                    Compras
                </button>
                <button
                    className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stock')}
                >
                    Inventario
                </button>
            </div>

            {loading ? (
                <div className="loading-container">Cargando datos del reporte...</div>
            ) : (
                <>
                    {activeTab === 'sales' && renderSalesTab()}
                    {activeTab === 'purchases' && renderPurchasesTab()}
                    {activeTab === 'stock' && renderStockTab()}
                </>
            )}
        </div>
    );
}
