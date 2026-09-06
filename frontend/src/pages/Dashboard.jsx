import { useEffect, useState } from 'react';
import { Boxes, PackageX, AlertTriangle, DollarSign, TrendingUp, Activity, Truck } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { api, formatCOP } from '../api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';

const PIE_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#f97316', '#6366f1'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [charts, setCharts] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/dashboard'), api('/dashboard/charts'), api('/dashboard/alerts')])
      .then(([d, c, a]) => { setData(d); setCharts(c); setAlerts(a); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (!data || !charts) return <Spinner full />;

  const inv = data.inventory;
  const critical = alerts.filter((a) => a.severity === 'critical');
  const warning = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen ejecutivo de la bodega</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge color="blue">Fase 1 · Núcleo</Badge>
          <Badge color="green">{inv.totalProducts} productos</Badge>
        </div>
      </div>

      {/* KPIs Inventario */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Inventario</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Productos" value={inv.totalProducts} icon={Boxes} />
          <StatCard title="Unidades" value={inv.totalStock.toLocaleString('es-CO')} icon={Boxes} iconBg="bg-blue-50 text-blue-600" />
          <StatCard title="Agotados" value={inv.agotados} icon={PackageX} color={inv.agotados > 0 ? 'text-red-600' : 'text-gray-900'} iconBg="bg-red-50 text-red-600" />
          <StatCard title="Stock bajo" value={inv.stockBajo} icon={AlertTriangle} color={inv.stockBajo > 0 ? 'text-amber-600' : 'text-gray-900'} iconBg="bg-amber-50 text-amber-600" />
          <StatCard title="Valor (costo)" value={formatCOP(inv.valoreCosto)} icon={DollarSign} iconBg="bg-green-50 text-green-600" />
          <StatCard title="Valor potencial" value={formatCOP(inv.valorVenta)} icon={TrendingUp} iconBg="bg-violet-50 text-violet-600" />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Stock e inventario por categoría</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stock" name="Unidades" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="products" name="Productos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Distribución del inventario (valor)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.byCategory} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={90} label>
                {charts.byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCOP(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas + Últimos movimientos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Activity size={16} /> Alertas de inventario
            {alerts.length > 0 && <Badge color={critical.length ? 'red' : 'amber'}>{alerts.length}</Badge>}
          </h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-500">Sin alertas activas. Todo en orden.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {alerts.slice(0, 15).map((a, i) => (
                <li key={i} className="flex items-start justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{a.product}</p>
                    <p className="text-xs text-gray-500">{a.code}</p>
                  </div>
                  <Badge color={a.severity === 'critical' ? 'red' : a.severity === 'warning' ? 'amber' : 'blue'}>
                    {a.type.replace(/_/g, ' ')} · {a.stock ?? ''}{a.min ? ` / mín ${a.min}` : ''}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Truck size={16} /> Últimos movimientos
          </h3>
          {data.movimientos.length === 0 ? (
            <p className="text-sm text-gray-500">Sin movimientos registrados.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {data.movimientos.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{m.product}</p>
                    <p className="text-xs text-gray-500">{m.user} · {new Date(m.date).toLocaleString('es-CO')}</p>
                  </div>
                  <Badge color={m.type === 'SALIDA' ? 'red' : 'green'}>
                    {m.type} · {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Movimientos últimos 7 días */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Ventas · últimos 7 días</h3>
        <ResponsiveContainer width="100%" height={220}>
<AreaChart data={charts.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#0ea5e9" fill="#e0f2fe" />
            </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}