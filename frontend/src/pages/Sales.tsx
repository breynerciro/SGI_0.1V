import { useState, useEffect, useCallback } from 'react';
import { productApi, movementsApi } from '../services/api';
import { IProduct, MovementType, CreateMovementRequest } from '@shared/types';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import './Transactions.css';

interface CartItem extends IProduct {
    quantity: number;
    salePrice: number;
}

export default function Sales() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<IProduct[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
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
                const results = await productApi.getAll({ search: searchTerm, status: 'ACTIVE' });
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const addToCart = useCallback((product: IProduct) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === product.id);
            if (existing) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1, salePrice: product.price }];
            }
        });
        setSearchTerm('');
        setSearchResults([]);
    }, []);

    const handleBarcodeScan = useCallback(async (code: string) => {
        try {
            const results = await productApi.getAll({ search: code, status: 'ACTIVE' });
            const exactMatch = results.find(p => p.code === code);
            if (exactMatch) {
                addToCart(exactMatch);
            } else if (results.length === 1) {
                addToCart(results[0]);
            }
        } catch (error) {
            console.error('Error scanning barcode:', error);
        }
    }, [addToCart]);

    useBarcodeScanner(handleBarcodeScan);

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        setCart(cart.map(item => item.id === id ? { ...item, quantity: qty } : item));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
    };

    const handleSaveSale = async () => {
        if (cart.length === 0) return;

        setConfirmDialog({
            isOpen: true,
            title: 'Confirmar Venta',
            message: `¿Estás seguro de procesar esta venta por $${calculateTotal().toFixed(2)}?`,
            variant: 'info',
            onConfirm: async () => {
                setSaving(true);
                setConfirmDialog(prev => ({ ...prev, isOpen: false })); // Close confirmation
                try {
                    const movementData: CreateMovementRequest = {
                        type: MovementType.OUT,
                        notes: 'Venta realizada desde el punto de venta',
                        items: cart.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            cost: item.cost,
                            price: item.salePrice
                        }))
                    };

                    await movementsApi.create(movementData);
                    setCart([]);

                    setConfirmDialog({
                        isOpen: true,
                        title: 'Venta Exitosa',
                        message: 'Venta registrada con éxito',
                        variant: 'success',
                        confirmText: 'Aceptar',
                        cancelText: null,
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                    });
                } catch (error: any) {
                    console.error('Error saving sale:', error);
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Error',
                        message: 'Error al registrar venta: ' + error.message,
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
            <h1 className="page-title" style={{ marginBottom: '2rem' }}>Nueva Venta</h1>

            <div className="transaction-layout">
                <div className="main-panel">
                    <div className="card">
                        <div className="card-title">Seleccionar Productos</div>
                        <div className="search-section">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Escribe nombre o código del producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="product-select-list">
                                {searchResults.map(product => (
                                    <div
                                        key={product.id}
                                        className="product-item"
                                        onClick={() => addToCart(product)}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{product.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {product.code} | Stock: {product.stock?.reduce((acc, s) => acc + s.quantity, 0) || 0}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                                            ${product.price.toFixed(2)}
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
                                        <th>Precio</th>
                                        <th>Cantidad</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                No hay productos en la venta
                                            </td>
                                        </tr>
                                    ) : (
                                        cart.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.8rem' }}>{item.code}</div>
                                                </td>
                                                <td>${item.salePrice.toFixed(2)}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="qty-input"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                    />
                                                </td>
                                                <td style={{ fontWeight: 600 }}>
                                                    ${(item.salePrice * item.quantity).toFixed(2)}
                                                </td>
                                                <td>
                                                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>×</button>
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
                        <div className="card-title">Resumen</div>
                        <div className="summary-item">
                            <span>Subtotal</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="summary-item">
                            <span>Impuestos (0%)</span>
                            <span>$0.00</span>
                        </div>
                        <div className="summary-total">
                            <span>TOTAL</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>

                        <button
                            className="btn-primary btn-full"
                            disabled={cart.length === 0 || saving}
                            onClick={handleSaveSale}
                        >
                            {saving ? 'Procesando...' : 'Completar Venta'}
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
