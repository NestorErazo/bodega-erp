import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell, ComposedChart, Area,
} from 'recharts';
import { Download, Printer, TrendingUp, Target, CalendarRange } from 'lucide-react';
import { Card, Button, Select, Table, StatusBar } from '../../components/ui';
import { api } from '../../api';
import { mockSerieVentas, mockMetodosPago, mockProductosTop, mockRentabilidad, mockMetas } from '../../mockData';

const PIE_COLORS = ['#10b981', '#0ea5e9', '#f43f5e', '#6366f1', '#f59e0b', '#8b5cf6', '#14b8a6'];

const PERIODO_MAP = {
  '7d': 'week',
  '15d': 'biweek',
  '30d': 'month',
  '3m': 'quarter',
  '6m': 'semester',
  '12m': 'year',
};

const mesLabel = (f) => {
  const d = new Date(f);
  return isNaN(d.getTime()) ? f : d.toLocaleDateString('es-CO', { month: 'short' });
};

export default function Reportes() {
  const [periodo, setPeriodo] = useState('12m');
  const [resumen, setResumen] = useState(null);
  const [serie, setSerie] = useState([]);
  const [top, setTop] = useState([]);
  const [rentabilidad, setRentabilidad] = useState(null);
  const [metas, setMetas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setError('');
    const p = PERIODO_MAP[periodo] || 'year';
    Promise.all([
      api(`/reports/resumen?period=${p}`),
      api(`/reports/serie?period=${p}`),
      api(`/reports/top?period=${p}&limit=10`),
      api(`/reports/categories?period=${p}`),
      api('/reports/goals'),
    ])
      .then(([r, s, t, cat, g]) => {
        if (!alive) return;
        setResumen(r);
        setSerie(Array.isArray(s) ? s : []);
        setTop(Array.isArray(t) ? t : []);
        setRentabilidad(cat);
        setMetas(g);
      })
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [periodo]);

  // Fallback a mocks si falla la API
  const ventasBase = serie.length
    ? serie.map((s) => ({ mes: mesLabel(s.fecha), ventas: s.ventas, utilidad: s.utilidad, unidades: s.unidades }))
    : mockSerieVentas;
  const metodosPago = resumen?.metodosPago?.length ? resumen.metodosPago : mockMetodosPago;
  const productosTop = top.length ? top : mockProductosTop;
  const rentabilidadData = rentabilidad?.porCategoria?.length ? rentabilidad.porCategoria : mockRentabilidad.porCategoria;
  const metasData = metas || mockMetas;

  const totalVentas = resumen?.ventas?.brutas ?? ventasBase.reduce((s, v) => s + v.ventas, 0);
  const totalUnidades = (resumen?.ventas?.unidades ?? ventasBase.reduce((s, v) => s + (v.unidades || 0), 0)) || 0;
  const totalUtilidad = resumen?.utilidad?.bruta ?? ventasBase.reduce((s, v) => s + (v.utilidad || 0), 0);
  const margenBruto = resumen?.utilidad?.margenBruto ?? ((totalVentas > 0 ? (totalUtilidad / totalVentas) * 100 : 0));
  const promedioMes = ventasBase.length ? totalVentas / ventasBase.length : 0;
  const proyeccion = promedioMes * 12;
  const metaMensual = metasData.mensual.meta;
  const cumple = (metasData.mensual.vendido || 0) / metaMensual;

  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reportes y analítica</h1>
          <p className="text-sm text-gray-500">Ventas, rentabilidad, proyecciones y cumplimiento de metas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary"><Download size={16} /> Excel</Button>
          <Button variant="secondary"><Printer size={16} /> PDF</Button>
          <Button variant="secondary"><Printer size={16} /> Imprimir</Button>
        </div>
      </div>

      {/* Filtros globales */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Select label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="!w-44">
          <option value="7d">7 días</option><option value="15d">15 días</option><option value="30d">30 días</option>
          <option value="3m">3 meses</option><option value="6m">6 meses</option><option value="12m">12 meses</option>
        </Select>
        <Select label="Bodega"><option>Todas</option><option>Principal</option></Select>
        <Select label="Vendedor"><option>Todos</option><option>Natalia</option><option>Pedro</option></Select>
        <Select label="Categoría"><option>Todas</option><option>Camisetas</option><option>Pantalones</option><option>Chaquetas</option></Select>
        <Select label="Método de pago" className="!w-44"><option>Todos</option><option>Efectivo</option><option>Nequi</option><option>Tarjeta</option></Select>
        <Button variant="secondary"><CalendarRange size={16} /> Personalizado</Button>
        <Button>Analizar</Button>
      </div>

      {/* KPIs del período */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Ventas del período', value: fmt(totalVentas) },
          { label: 'Unidades vendidas', value: Number(totalUnidades || 0).toLocaleString('es-CO') },
          { label: 'Ticket promedio', value: fmt(totalVentas / (resumen?.ventas?.tickets || 1)) },
          { label: 'Utilidad bruta', value: fmt(totalUtilidad) },
          { label: 'Margen bruto', value: `${Math.round(margenBruto)}%` },
        ].map((k) => (
          <Card key={k.label}>
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Serie de ventas */}
      <Card title="Ventas por período" subtitle="Valor vendido, unidades y utilidad por mes">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={ventasBase}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Legend />
            <Bar yAxisId="l" dataKey="ventas" name="Ventas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Line yAxisId="l" type="monotone" dataKey="utilidad" name="Utilidad" stroke="#f59e0b" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Métodos de pago */}
        <Card title="Métodos de pago" subtitle="Distribución del recaudo">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={metodosPago} dataKey="valor" nameKey="metodo" cx="50%" cy="50%" outerRadius={95} label={(e) => e.metodo}>
                {metodosPago.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Productos top */}
        <Card title="Productos más vendidos" subtitle="Ranking por unidades, ventas y utilidad">
          <Table
            headers={['#', 'Producto', 'Unidades', 'Ventas', 'Utilidad']}
            rows={productosTop.map((p, i) => (
              <tr key={p.producto}>
                <td className="px-4 py-2.5">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{i + 1}</span>
                </td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{p.producto}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{p.unidades}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{fmt(p.ventas)}</td>
                <td className="px-4 py-2.5 text-right text-green-700">{fmt(p.utilidad)}</td>
              </tr>
            ))}
          />
        </Card>

        {/* Rentabilidad por categoría */}
        <Card title="Rentabilidad por categoría" subtitle="Ganancia y margen bruto">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rentabilidadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="categoria" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
              <Bar dataKey="ventas" name="Ventas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ganancia" name="Ganancia" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Proyecciones */}
        <Card title="Metas y proyecciones" subtitle="Cumplimiento mensual y proyección anual">
          <div className="space-y-4">
            <StatusBar title="Meta mensual" value={fmt(metasData.mensual.vendido)} sub={`meta ${fmt(metaMensual)} · ${Math.round(cumple * 100)}%`} total={metaMensual} color="bg-brand-600" />
            <StatusBar title="Meta diaria" value={fmt(metasData.diaria.vendido)} sub={`meta ${fmt(metasData.diaria.meta)} · ${Math.round((metasData.diaria.vendido / metasData.diaria.meta) * 100)}%`} total={metasData.diaria.meta} color="bg-green-500" />
            <div className="mt-4 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 p-4 text-white">
              <div className="flex items-center gap-2"><Target size={18} /><span className="text-sm font-semibold">Proyección de ventas anual</span></div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">{fmt(proyeccion)}</p>
                  <p className="text-xs opacity-80">vs meta {fmt(metasData.anual.meta)}</p>
                </div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">{Math.round((proyeccion / metasData.anual.meta) * 100)}%</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (proyeccion / metasData.anual.meta) * 100)}%` }} />
              </div>
            </div>
            <TrendingUp className="mr-1 inline text-brand-600" size={16} />
            <span className="text-xs text-gray-500">Promedio mensual del período: <b>{fmt(promedioMes)}</b></span>
          </div>
        </Card>
      </div>
    </div>
  );
}
