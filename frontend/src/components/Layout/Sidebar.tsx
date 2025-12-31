import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import './Layout.css';

export default function Sidebar() {
    const { branding } = useTheme();

    const links = [
        { to: '/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/products', label: 'Productos', icon: '📦' },
        { to: '/sales', label: 'Ventas', icon: '💰' },
        { to: '/purchases', label: 'Compras', icon: '🛒' },
        { to: '/reports', label: 'Reportes', icon: '📈' },
        { to: '/settings', label: 'Configuración', icon: '⚙️' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">{branding?.systemName || 'Sistema de Inventarios'}</h2>
            </div>
            <nav className="nav-menu">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span style={{ marginRight: '0.75rem', fontSize: '1.1rem' }}>{link.icon}</span>
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
