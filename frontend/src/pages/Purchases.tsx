import { useState, useEffect, useCallback } from 'react';
import { productApi, movementsApi } from '../services/api';
import { IProduct, MovementType, CreateMovementRequest } from '@shared/types';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import './Transactions.css';

interface PurchaseItem extends IProduct {
    quantity: number;
    purchaseCost: number;
}

export default function Purchases() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<IProduct[]>([]);
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [saving, setSaving] = useState(false);

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
        const delaySearch = setTimeout(async () => {
            if (searchTerm.trim().length >= 2) {
                const results = await productApi.getAll({ search: searchTerm });
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const addToItems = useCallback((product: IProduct) => {
        setItems(prevItems => {
            const existing = prevItems.find(item => item.id === product.id);
            if (existing) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevItems, { ...product, quantity: 1, purchaseCost: product.cost }];
            }
        });
        setSearchTerm('');
        setSearchResults([]);
    }, []);

    const handleBarcodeScan = useCallback(async (code: string) => {
        try {
            const results = await productApi.getAll({ search: code });
            const exactMatch = results.find(p => p.code === code);
            if (exactMatch) {
                addToItems(exactMatch);
            } else if (results.length === 1) {
                addToItems(results[0]);
            }
        } catch (error) {
            console.error('Error scanning barcode:', error);
        }
    }, [addToItems]);

    useBarcodeScanner(handleBarcodeScan);

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        setItems(items.map(item => item.id === id ? { ...item, quantity: qty } : item));
    };

    const updateCost = (id: string, cost: number) => {
        if (cost < 0) return;
        setItems(items.map(item => item.id === id ? { ...item, purchaseCost: cost } : item));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.purchaseCost * item.quantity), 0);
    };

    const handleSavePurchase = async () => {
        if (items.length === 0) return;

        setConfirmDialog({
            isOpen: true,
            title: 'Confirmar Ingreso',
            message: `¿Estás seguro de registrar este ingreso por valor de $${calculateTotal().toFixed(2)}?\n\nSe actualizarán los costos y cantidades en inventario.`,
            variant: 'info',
            onConfirm: async () => {
                setSaving(true);
                setConfirmDialog(prev => ({ ...prev, isOpen: false })); // Close confirmation
                try {
                    const movementData: CreateMovementRequest = {
                        type: MovementType.IN,
                        notes: 'Compra de inventario registrada manualmente',
                        items: items.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            cost: item.purchaseCost,
                            price: item.price // Keep current price
                        }))
                    };

                    await movementsApi.create(movementData);
                    setItems([]);

                    setConfirmDialog({
                        isOpen: true,
                        title: 'Ingreso Exitoso',
                        message: 'Compra registrada con éxito. El inventario y los costos han sido actualizados.',
                        variant: 'success',
                        confirmText: 'Aceptar',
                        cancelText: null,
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                    });
                } catch (error: any) {
                    console.error('Error saving purchase:', error);
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Error',
                        message: 'Error al registrar compra: ' + error.message,
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

    return (
        <div className="transactions-page">
            <h1 className="page-title" style={{ marginBottom: '2rem' }}>Nueva Compra</h1>

            <div className="transaction-layout">
                <div className="main-panel">
                    <div className="card">
                        <div className="card-title">Registrar Ingreso de Productos</div>
                        <div className="search-section">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Buscar producto por nombre o código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="product-select-list">
                                {searchResults.map(product => (
                                    <div
                                        key={product.id}
                                        className="product-item"
                                        onClick={() => addToItems(product)}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{product.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {product.code} | Stock actual: {product.stock?.reduce((acc, s) => acc + s.quantity, 0) || 0}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                                            Costo: ${product.cost.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '2rem' }}>
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Costo Unitario</th>
                                        <th>Cantidad</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                No hay productos seleccionados
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.8rem' }}>{item.code}</div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="qty-input"
                                                        style={{ width: '100px' }}
                                                        value={item.purchaseCost}
                                                        onChange={(e) => updateCost(item.id, parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="qty-input"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                    />
                                                </td>
                                                <td style={{ fontWeight: 600 }}>
                                                    ${(item.purchaseCost * item.quantity).toFixed(2)}
                                                </td>
                                                <td>
                                                    <button className="remove-btn" onClick={() => removeItem(item.id)}>×</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="side-panel">
                    <div className="card">
                        <div className="card-title">Resumen de Compra</div>
                        <div className="summary-item">
                            <span>Monto Total</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                            * Al confirmar, se incrementará el stock de los productos seleccionados y se actualizará su costo unitario.
                        </p>

                        <button
                            className="btn-primary btn-full"
                            disabled={items.length === 0 || saving}
                            onClick={handleSavePurchase}
                        >
                            {saving ? 'Registrando...' : 'Confirmar Ingreso'}
                        </button>
                    </div>
                </div>
            </div>

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
        </div>
    );
}
