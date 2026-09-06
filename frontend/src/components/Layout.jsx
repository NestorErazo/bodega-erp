import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Boxes, Truck, Users, Wallet,
  BarChart3, Settings, Menu, X, LogOut, Search, UserCog, Gift,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const sections = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  {
    title: 'VENTAS', icon: ShoppingCart, items: [
      { to: '/ventas', label: 'Punto de venta' },
      { to: '/ventas/historial', label: 'Ventas' },
      { to: '/ventas/devoluciones', label: 'Devoluciones' },
      { to: '/ventas/vendedores', label: 'Vendedores' },
    ],
  },
  {
    title: 'INVENTARIO', icon: Boxes, items: [
      { to: '/inventario/productos', label: 'Productos' },
      { to: '/inventario/kardex', label: 'Kardex' },
      { to: '/inventario/movimientos', label: 'Movimientos' },
    ],
  },
  {
    title: 'COMPRAS', icon: Truck, items: [
      { to: '/compras/proveedores', label: 'Proveedores' },
      { to: '/compras', label: 'Órdenes de compra' },
    ],
  },
  {
    title: 'CLIENTES', icon: Users, items: [
      { to: '/clientes', label: 'Clientes' },
      { to: '/clientes/cartera', label: 'Cartera' },
    ],
  },
  {
    title: 'FINANZAS', icon: Wallet, items: [
      { to: '/finanzas/caja', label: 'Caja' },
      { to: '/finanzas/gastos', label: 'Gastos' },
      { to: '/finanzas/bancos', label: 'Bancos' },
    ],
  },
  {
    title: 'REPORTES', icon: BarChart3, items: [
      { to: '/reportes', label: 'Analítica' },
    ],
  },
  {
    title: 'ADMINISTRACIÓN', icon: Settings, items: [
      { to: '/configuracion', label: 'Configuración' },
      { to: '/auditoria', label: 'Auditoría' },
    ],
  },
];

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold">B</span>
        <div>
          <p className="text-sm font-semibold leading-tight">Bodega de Ropa</p>
          <p className="text-[11px] text-slate-400">ERP · POS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {sections.map((sec, i) => {
          if (sec.to) {
            return (
              <NavLink
                key={sec.to}
                to={sec.to}
                end={sec.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <sec.icon size={18} />
                {sec.label}
              </NavLink>
            );
          }
          return (
            <div key={i} className="mt-4 mb-1">
              <p className="flex items-center gap-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <sec.icon size={14} /> {sec.title}
              </p>
              <div className="mt-1 space-y-0.5">
                {sec.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg py-1.5 pr-3 pl-4 text-sm ${
                        isActive ? 'bg-slate-800 text-brand-400 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold uppercase">{user?.name?.charAt(0)}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="text-[11px] text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Sidebar móvil */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">
            <SidebarContent onNavigate={() => setOpen(false)} />
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 rounded p-1 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-1.5 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="relative hidden md:block">
              <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Buscar producto, cliente…"
                className="w-72 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pr-3 pl-9 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-gray-500 sm:block">Hoy</span>
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 font-medium">
              {new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}