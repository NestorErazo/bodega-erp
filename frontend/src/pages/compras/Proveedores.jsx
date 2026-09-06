import { useState } from 'react';
import { Plus, Pencil, Search, Phone, Mail, MapPin } from 'lucide-react';
import { Card, Button, Modal, Table, Input, Select, StatusBar } from '../../components/ui';
import { useResource, fmt } from '../../hooks/useResource';
import { api } from '../../api';
import { mockProveedores } from '../../mockData';
import Badge from '../../components/Badge';

const emptyProv = { nombre: '', nit: '', telefono: '', email: '', ciudad: '', contacto: '', diasCredito: 30, estado: 'Activo' };

// Normaliza la API (campos en inglés: name/phone/city/contact/creditDays/active) y el mock (español)
const norm = (p) => ({
  id: p.id,
  nombre: p.nombre || p.name,
  nit: p.nit,
  telefono: p.telefono || p.phone,
  email: p.email,
  ciudad: p.ciudad || p.city,
  contacto: p.contacto || p.contact,
  diasCredito: p.diasCredito ?? p.creditDays,
  estado: p.estado || (p.active ? 'Activo' : 'Inactivo'),
  compras: p.compras || 0,
  deuda: p.deuda || 0,
});

export default function Proveedores() {
  const { data: proveedores } = useResource('/suppliers', mockProveedores);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProv);
  const [saving, setSaving] = useState(false);
  const [provErr, setProvErr] = useState('');

  const list = (proveedores || []).map(norm);
  const filtered = list.filter((p) => !q || p.nombre.toLowerCase().includes(q.toLowerCase()) || (p.nit || '').includes(q));
  const deudaTotal = list.reduce((s, p) => s + p.deuda, 0);

  const openNew = () => { setEditing('__new'); setForm(emptyProv); setProvErr(''); };
  const openEdit = (p) => { setEditing(p.id); setForm({ ...p }); setProvErr(''); };

  const guardar = async () => {
    setSaving(true);
    setProvErr('');
    try {
      const body = {
        nit: form.nit, name: form.nombre, phone: form.telefono, email: form.email,
        city: form.ciudad, contact: form.contacto, creditDays: Number(form.diasCredito) || 30,
        active: form.estado === 'Activo',
      };
      if (editing === '__new') await api('/suppliers', { method: 'POST', body });
      else await api(`/suppliers/${editing}`, { method: 'PUT', body });
      setEditing(null);
    } catch (e) {
      setProvErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500">Gestión de proveedores y deudas</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Nuevo proveedor</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatusBar title="Proveedores activos" value={list.filter((p) => p.estado === 'Activo').length} total={list.length || 1} sub="del catálogo" color="bg-brand-500" />
        <StatusBar title="Compras acumuladas" value={list.reduce((s, p) => s + p.compras, 0)} total={100} sub="órdenes históricas" color="bg-violet-500" />
        <StatusBar title="Deuda total a proveedores" value={fmt(deudaTotal)} total={12000000} sub="cuentas por pagar" color="bg-red-500" />
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o NIT…" className="input w-full pl-9" />
      </div>

      <Card>
        <Table
          headers={['Proveedor', 'NIT', 'Ciudad', 'Contacto', 'Días crédito', 'Compras', 'Deuda', 'Estado', '']}
          rows={filtered.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-semibold text-gray-800">{p.nombre}</p>
                <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-gray-500">
                  {p.telefono && <span className="flex items-center gap-1"><Phone size={11} />{p.telefono}</span>}
                  {p.email && <span className="flex items-center gap-1"><Mail size={11} />{p.email}</span>}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.nit}</td>
              <td className="px-4 py-3 text-gray-600"><span className="flex items-center gap-1"><MapPin size={12} />{p.ciudad}</span></td>
              <td className="px-4 py-3 text-gray-600">{p.contacto || '—'}</td>
              <td className="px-4 py-3 text-gray-600">{p.diasCredito}</td>
              <td className="px-4 py-3 text-right text-gray-600">{p.compras}</td>
              <td className={`px-4 py-3 text-right font-semibold ${p.deuda > 0 ? 'text-red-600' : 'text-green-600'}`}>{p.deuda ? fmt(p.deuda) : 'Sin deuda'}</td>
              <td className="px-4 py-3"><Badge color={p.estado === 'Activo' ? 'green' : 'gray'}>{p.estado}</Badge></td>
              <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil size={15} /></Button></td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === '__new' ? 'Nuevo proveedor' : 'Editar proveedor'}>
        <div className="space-y-4">
          <Input label="Nombre / razón social" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="NIT / documento" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
            <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
            <Input label="Contacto" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Días de crédito" type="number" value={form.diasCredito} onChange={(e) => setForm({ ...form, diasCredito: e.target.value })} />
            <Select label="Estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option>Activo</option><option>Inactivo</option>
            </Select>
          </div>
          {provErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{provErr}</div>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={saving || !form.nombre} onClick={guardar}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}