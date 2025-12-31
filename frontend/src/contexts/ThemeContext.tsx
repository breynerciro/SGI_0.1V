import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IBrandingConfig } from '@shared/types';

interface ThemeContextType {
    branding: IBrandingConfig | null;
    updateBranding: (config: Partial<IBrandingConfig>) => Promise<void>;
    loading: boolean;
    themeMode: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [branding, setBranding] = useState<IBrandingConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light';
    });

    useEffect(() => {
        loadBranding();
    }, []);

    useEffect(() => {
        if (branding) {
            applyTheme(branding);
        }
    }, [branding]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeMode);
        localStorage.setItem('themeMode', themeMode);
    }, [themeMode]);

    const loadBranding = async () => {
        try {
            const config = await (window as any).electronAPI.getBranding();
            setBranding(config);
        } catch (error) {
            console.error('Error loading branding:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (config: IBrandingConfig) => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', config.primaryColor);
        // Secondary color removed
        if (config.systemName) {
            document.title = config.systemName;
        }
    };

    const updateBranding = async (config: Partial<IBrandingConfig>) => {
        const updated = await (window as any).electronAPI.updateBranding(config);
        setBranding(updated);
    };

    const toggleTheme = () => {
        setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ branding, updateBranding, loading, themeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
