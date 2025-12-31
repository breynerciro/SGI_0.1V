import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LicenseProvider } from './contexts/LicenseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout/Layout';
import LicenseGuard from './components/LicenseGuard';

function App() {
    return (
        <LicenseProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <LicenseGuard>
                                    <Layout />
                                </LicenseGuard>
                            }
                        >
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="products" element={<Products />} />
                            <Route path="sales" element={<Sales />} />
                            <Route path="purchases" element={<Purchases />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="settings/*" element={<Settings />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </LicenseProvider>
    );
}

export default App;
