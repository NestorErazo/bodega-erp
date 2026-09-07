import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/products/Products';
import ProductForm from './pages/products/ProductForm';
import Movements from './pages/inventory/Movements';
import Kardex from './pages/inventory/Kardex';
import POS from './pages/ventas/POS';
import VentasHistorial from './pages/ventas/VentasHistorial';
import Devoluciones from './pages/ventas/Devoluciones';
import Vendedores from './pages/ventas/Vendedores';
import Proveedores from './pages/compras/Proveedores';
import Compras from './pages/compras/Compras';
import Clientes from './pages/clientes/Clientes';
import Cartera from './pages/clientes/Cartera';
import Caja from './pages/finanzas/Caja';
import Gastos from './pages/finanzas/Gastos';
import Bancos from './pages/finanzas/Bancos';
import Reportes from './pages/reportes/Reportes';
import Configuracion from './pages/config/Configuracion';
import Auditoria from './pages/config/Auditoria';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />

            {/* VENTAS */}
            <Route path="/ventas" element={<POS />} />
            <Route path="/ventas/historial" element={<VentasHistorial />} />
            <Route path="/ventas/devoluciones" element={<Devoluciones />} />
            <Route path="/ventas/vendedores" element={<Vendedores />} />

            {/* INVENTARIO */}
            <Route path="/inventario/productos" element={<Products />} />
            <Route path="/inventario/productos/nuevo" element={<ProductForm />} />
            <Route path="/inventario/productos/:id" element={<ProductForm />} />
            <Route path="/inventario/movimientos" element={<Movements />} />
            <Route path="/inventario/kardex" element={<Kardex />} />

            {/* COMPRAS */}
            <Route path="/compras" element={<Compras />} />
            <Route path="/compras/proveedores" element={<Proveedores />} />

            {/* CLIENTES */}
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/cartera" element={<Cartera />} />

            {/* FINANZAS */}
            <Route path="/finanzas/caja" element={<Caja />} />
            <Route path="/finanzas/gastos" element={<Gastos />} />
            <Route path="/finanzas/bancos" element={<Bancos />} />

            {/* REPORTES Y VENDEDORES */}
            <Route path="/reportes" element={<Reportes />} />

            {/* ADMINISTRACIÓN */}
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/auditoria" element={<Auditoria />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}