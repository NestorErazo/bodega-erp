import { useState } from 'react';
import { Search, ShieldCheck, History } from 'lucide-react';
import { Card, Table, Select } from '../../components/ui';
import { useResource, fmtDate } from '../../hooks/useResource';
import { mockAuditoria } from '../../mockData';
import Badge from '../../components/Badge';

// Normaliza la respuesta de la API (user.name/action/entity/details/date) y del mock (usuario/accion/modulo/detalle/fecha)
const norm = (l) => ({
  id: l.id,
  usuario: l.usuario || l.user?.name,
  accion: l.accion || l.action,
  modulo: l.modulo || l.entity,
  detalle: l.detalle || (typeof l.details === 'string' ? l.details : JSON.stringify(l.details || '')),
  fecha: l.fecha || l.date,
});

export default function Auditoria() {
  const { data: logs } = useResource('/audit', mockAuditoria);
  const [q, setQ] = useState('');
  const [modulo, setModulo] = useState('');

  const list = (logs || []).map(norm);
  const filtered = list.filter((l) =>
    (!modulo || l.modulo === modulo) && (!q || l.usuario.toLowerCase().includes(q.toLowerCase()) || l.accion.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Auditoría</h1>
          <p className="text-sm text-gray-500">Registro de acciones de los usuarios sobre la información</p>
        </div>
        <Badge color="blue"><ShieldCheck size={13} className="mr-1 inline" /> Registro histórico protegido</Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por usuario o acción…" className="input w-full pl-9" />
        </div>
        <Select value={modulo} onChange={(e) => setModulo(e.target.value)} className="!w-auto">
          <option value="">Todos los módulos</option>
          {['Productos', 'Ventas', 'Inventario', 'Compras', 'Gastos', 'Usuarios', 'Configuración'].map((m) => <option key={m}>{m}</option>)}
        </Select>
      </div>

      <Card>
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500"><History size={14} /> {filtered.length} eventos registrados</div>
        <Table
          headers={['Fecha', 'Usuario', 'Acción', 'Módulo', 'Detalle']}
          rows={filtered.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(l.fecha)} · {l.fecha ? new Date(l.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{l.usuario}</td>
              <td className="px-4 py-3 text-gray-700">{l.accion}</td>
              <td className="px-4 py-3"><Badge color="gray">{l.modulo}</Badge></td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.detalle}</td>
            </tr>
          ))}
        />
      </Card>
    </div>
  );
}