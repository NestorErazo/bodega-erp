import { useState } from 'react';
import { Wallet, Search, HandCoins } from 'lucide-react';
import { Card, Button, Modal, Table, Input } from '../../components/ui';
import { useResource, fmt, fmtDate } from '../../hooks/useResource';
import { api } from '../../api';
import { mockCartera } from '../../mockData';
import Badge from '../../components/Badge';

export default function Cartera() {
  const { data: cartera } = useResource('/accounts-receivable', mockCartera);
  const [q, setQ] = useState('');
  const [abono, setAbono] = useState(null);
  const [monto, setMonto] = useState('');
  const [savingA, setSavingA] = useState(false);
  const [aErr, setAErr] = useState('');

  const filtered = (cartera || []).filter((c) => !q || c.cliente.toLowerCase().includes(q.toLowerCase()));
  const totalSaldo = filtered.reduce((s, c) => s + c.saldo, 0);
  const vencida = filtered.filter((c) => c.estado === 'Vencido').reduce((s, c) => s + c.saldo, 0);

  const estadoColor = (e) => ({ Pendiente: 'amber', Parcial: 'blue', Pagado: 'green', Vencido: 'red' }[e] || 'gray');

  const registrarAbono = async () => {
    setSavingA(true);
    setAErr('');
    try {
      await api(`/accounts-receivable/${abono.id}/payments`, { method: 'POST', body: { monto: Number(monto) } });
      setAbono(null);
      setMonto('');
    } catch (e) {
      setAErr(e.message);
    } finally {
      setSavingA(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cartera · Cuentas por cobrar</h1>
        <p className="text-sm text-gray-500">Ventas a crédito y abonos de clientes</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Wallet size={20} /></span>
          <p className="text-xs text-gray-500">Total por cobrar</p>
          <p className="text-xl font-bold text-gray-900">{fmt(totalSaldo)}</p>
        </Card>
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><Wallet size={20} /></span>
          <p className="text-xs text-gray-500">Cartera vencida</p>
          <p className="text-xl font-bold text-red-600">{fmt(vencida)}</p>
        </Card>
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><Wallet size={20} /></span>
          <p className="text-xs text-gray-500">Por vencer</p>
          <p className="text-xl font-bold text-gray-900">{fmt(totalSaldo - vencida)}</p>
        </Card>
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente…" className="input w-full pl-9" />
      </div>

      <Card>
        <Table
          headers={['Cliente', 'Documento', 'Vencimiento', 'Valor', 'Abonado', 'Saldo', 'Estado', '']}
          rows={filtered.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{c.cliente}</td>
              <td className="px-4 py-3 font-mono text-xs text-brand-600">{c.documento}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDate(c.vencimiento)}</td>
              <td className="px-4 py-3 text-right text-gray-800">{fmt(c.valor)}</td>
              <td className="px-4 py-3 text-right text-gray-600">{c.abonado ? fmt(c.abonado) : '—'}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(c.saldo)}</td>
              <td className="px-4 py-3"><Badge color={estadoColor(c.estado)}>{c.estado}</Badge></td>
              <td className="px-4 py-3 text-right"><Button variant="secondary" size="sm" onClick={() => { setAbono(c); setMonto(''); }}><HandCoins size={14} /> Abonar</Button></td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={!!abono} onClose={() => setAbono(null)} title={`Abono · ${abono?.cliente}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Documento: <b>{abono?.documento}</b> · Saldo actual: <b>{fmt(abono?.saldo)}</b></p>
          <Input label="Valor del abono" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            El abono se registra en caja/banco según el método, actualiza el saldo de cartera y genera auditoría.
          </p>
          {aErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{aErr}</div>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAbono(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={!monto || Number(monto) <= 0 || Number(monto) > abono?.saldo || savingA} onClick={registrarAbono}>{savingA ? 'Registrando…' : 'Registrar abono'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}