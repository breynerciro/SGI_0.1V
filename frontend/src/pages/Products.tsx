
import React, { useEffect, useState, useCallback } from 'react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { productApi } from '../services/api';
import { IProduct, ProductStatus } from '@shared/types';
import './Products.css';
import { ConfirmDialog } from '../components/ConfirmDialog';

// Inline Modal Component
interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    product?: IProduct | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        unit: 'unidad',
        cost: 0,
        price: 0,
        minStock: 0,
        maxStock: 0,
        barcode: '',
        status: ProductStatus.ACTIVE
    });

    useEffect(() => {
        if (product) {
            setFormData({
                code: product.code,
                name: product.name,
                description: product.description || '',
                unit: product.unit,
                cost: product.cost,
                price: product.price,
                minStock: product.minStock,
                maxStock: product.maxStock || 0,
                barcode: product.barcode || '',
                status: product.status as ProductStatus
            });
        } else {
            setFormData({
                code: '',
                name: '',
                description: '',
                unit: 'unidad',
                cost: 0,
                price: 0,
                minStock: 0,
                maxStock: 0,
                barcode: '',
                status: ProductStatus.ACTIVE
            });
        }
    }, [product, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Código</label>
                            <input
                                className="form-input"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Código de Barras</label>
                            <input
                                className="form-input"
                                value={formData.barcode}
                                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input
                            className="form-input"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea
                            className="form-input"
                            rows={2}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Unidad</label>
                            <select
                                className="form-input"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="unidad">Unidad</option>
                                <option value="kg">Kg</option>
                                <option value="litro">Litro</option>
                                <option value="metro">Metro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Costo</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.cost}
                                onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Precio</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Stock Mínimo</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.minStock}
                                onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stock Máximo</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.maxStock}
                                onChange={e => setFormData({ ...formData, maxStock: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="action-button">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function Products() {
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'danger' | 'warning' | 'info' | 'success';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info',
        onConfirm: () => { }
    });

    const handleBarcodeScan = useCallback((code: string) => {
        setSearchTerm(code);
    }, []);

    useBarcodeScanner(handleBarcodeScan);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await productApi.getAll({ search: searchTerm });
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [searchTerm]);

    // Filter products by status
    const filteredProducts = products.filter(product => {
        if (statusFilter === '') return true;
        return product.status === statusFilter;
    });

    const handleCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: IProduct) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Desactivar Producto',
            message: '¿Deseas desactivar este producto?\nSe marcará como inactivo pero se mantendrá el historial.',
            variant: 'warning',
            onConfirm: async () => {
                try {
                    await (window as any).electronAPI.softDeleteProduct(id);
                    await loadProducts();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error('Error deleting product:', error);
                }
            }
        });
    };

    const handleReactivate = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Reactivar Producto',
            message: '¿Deseas reactivar este producto?',
            variant: 'success',
            onConfirm: async () => {
                try {
                    await productApi.update(id, { status: 'ACTIVE' });
                    await loadProducts();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error('Error reactivating product:', error);
                }
            }
        });
    };

    const handleHardDelete = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Definitivamente',
            message: '⚠️ ¿Estás seguro de ELIMINAR PERMANENTEMENTE este producto?\n\nEsta acción borrará:\n1. El producto\n2. Todo su historial de stock\n3. Todos los movimientos asociados\n\nEsta acción NO se puede deshacer.',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await productApi.delete(id);
                    await loadProducts();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error('Error hard deleting product:', error);
                }
            }
        });
    };

    const handleSave = async (data: any) => {
        try {
            if (editingProduct) {
                await productApi.update(editingProduct.id, data);
            } else {
                await productApi.create(data);
            }
            setIsModalOpen(false);
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar producto: ' + (error as any).message);
        }
    };

    return (
        <div className="products-page">
            <div className="page-header">
                <h1 className="page-title">Gestión de Productos</h1>
                <button className="action-button" onClick={handleCreate}>
                    <span>+</span> Nuevo Producto
                </button>
            </div>

            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Buscar producto por nombre o código..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="">Todos los Estados</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="INACTIVE">Inactivos</option>
                </select>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Costo</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center' }}>Cargando...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center' }}>No hay productos encontrados</td></tr>
                        ) : (
                            filteredProducts.map(product => (
                                <tr key={product.id} style={{ opacity: product.status === 'INACTIVE' ? 0.6 : 1 }}>
                                    <td>{product.code}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{product.name}</div>
                                        <div style={{ fontSize: '0.8em', color: '#6B7280' }}>{product.barcode}</div>
                                    </td>
                                    <td>${product.price.toFixed(2)}</td>
                                    <td>${product.cost.toFixed(2)}</td>
                                    <td>
                                        {product.stock?.reduce((acc, s) => acc + s.quantity, 0) || 0}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${product.status.toLowerCase()}`}>
                                            {product.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button className="icon-button" onClick={() => handleEdit(product)} title="Editar">
                                            ✏️
                                        </button>
                                        {product.status === 'ACTIVE' ? (
                                            <button className="icon-button" onClick={() => handleDelete(product.id)} title="Desactivar">
                                                🗑️
                                            </button>
                                        ) : (
                                            <>
                                                <button className="icon-button" onClick={() => handleReactivate(product.id)} title="Reactivar" style={{ color: '#10b981' }}>
                                                    ♻️
                                                </button>
                                                <button className="icon-button" onClick={() => handleHardDelete(product.id)} title="Eliminar Definitivamente" style={{ color: '#ef4444' }}>
                                                    ❌
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                product={editingProduct}
            />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
