import { useState } from 'react';
import { Plus, Pencil, Search, User } from 'lucide-react';
import { Card, Button, Modal, Table, Input, Select } from '../../components/ui';
import { useResource, fmt, fmtDate } from '../../hooks/useResource';
import { api } from '../../api';
import { mockClientes } from '../../mockData';
import Badge from '../../components/Badge';

const emptyCli = { nombre: '', documento: '', telefono: '', email: '', ciudad: '', nacimiento: '', observaciones: '' };

// Normaliza las respuestas de la API (campos en inglés) y del mock (en español)
const norm = (c) => ({
  id: c.id,
  nombre: c.nombre || c.name,
  documento: c.documento || c.document,
  telefono: c.telefono || c.phone,
  email: c.email,
  ciudad: c.ciudad || c.city,
  compras: c.compras || c.sales || 0,
  total: c.total || 0,
  ultima: c.ultima,
  deuda: c.deuda || 0,
});

export default function Clientes() {
  const [q, setQ] = useState('');
  const { data: clientes } = useResource('/customers', mockClientes);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCli);
  const [saving, setSaving] = useState(false);
  const [cliErr, setCliErr] = useState('');

  const clientesList = (clientes || []).map(norm);
  const filtered = clientesList.filter((c) => !q || c.nombre.toLowerCase().includes(q.toLowerCase()) || (c.documento || '').includes(q));
  const top = [...clientesList].sort((a, b) => b.total - a.total).slice(0, 4);

  const guardar = async () => {
    setSaving(true);
    setCliErr('');
    try {
      const body = {
        name: form.nombre, document: form.documento, phone: form.telefono, email: form.email,
        city: form.ciudad, birthdate: form.nacimiento || null, observations: form.observaciones,
      };
      if (editing === '__new') await api('/customers', { method: 'POST', body });
      else await api(`/customers/${editing}`, { method: 'PUT', body });
      setEditing(null);
    } catch (e) {
      setCliErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Base de datos de clientes y su historial de compras</p>
        </div>
        <Button onClick={() => { setEditing('__new'); setForm(emptyCli); }}><Plus size={16} /> Nuevo cliente</Button>
      </div>

      {/* Clientes destacados */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {top.map((c, i) => (
          <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-600'}`}>
                {i === 0 ? '⭐' : c.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">{c.nombre}</p>
                <p className="text-xs text-gray-500">{fmt(c.total)} comprados</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">Última compra: {fmtDate(c.ultima)}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o documento…" className="input w-full pl-9" />
      </div>

      <Card>
        <Table
          headers={['Cliente', 'Documento', 'Ciudad', 'Compras', 'Total comprado', 'Última compra', 'Deuda', '']}
          rows={filtered.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 font-semibold text-gray-800"><User size={14} className="text-gray-400" />{c.nombre}</span>
                <p className="ml-6 text-xs text-gray-400">{c.telefono}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.documento}</td>
              <td className="px-4 py-3 text-gray-600">{c.ciudad}</td>
              <td className="px-4 py-3 text-right text-gray-600">{c.compras}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(c.total)}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDate(c.ultima)}</td>
              <td className="px-4 py-3 text-right"><span className={`font-semibold ${c.deuda > 0 ? 'text-red-600' : 'text-green-600'}`}>{c.deuda ? fmt(c.deuda) : '—'}</span></td>
              <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => { setEditing(c.id); setForm({ ...c }); }}><Pencil size={15} /></Button></td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === '__new' ? 'Nuevo cliente' : 'Editar cliente'}>
        <div className="space-y-4">
          <Input label="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Documento" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
            <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
            <Input label="Fecha de nacimiento" type="date" value={form.nacimiento} onChange={(e) => setForm({ ...form, nacimiento: e.target.value })} />
          </div>
          {cliErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{cliErr}</div>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={saving || !form.nombre} onClick={guardar}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}