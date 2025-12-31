
import React from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string | null;
    variant?: 'danger' | 'warning' | 'info' | 'success';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'info'
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-content" onClick={e => e.stopPropagation()}>
                <div className="confirm-header">
                    <h3 className="confirm-title">{title}</h3>
                </div>
                <div className="confirm-body">
                    {message.split('\n').map((line, index) => (
                        <p key={index} className="confirm-text">{line}</p>
                    ))}
                </div>
                <div className="confirm-actions">
                    {cancelText && (
                        <button className="btn-cancel" onClick={onCancel}>{cancelText}</button>
                    )}
                    <button className={`btn-confirm btn-${variant}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
