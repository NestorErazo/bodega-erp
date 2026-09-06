import { useEffect, useState } from 'react';
import { Building2, Palette, Users, Wallet, Barcode, Tag, Save, Store } from 'lucide-react';
import { Card, Button, Input, Select } from '../../components/ui';
import { api } from '../../api';

const tabs = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'catalogo', label: 'Catálogo', icon: Tag },
  { id: 'metodos', label: 'Métodos de pago', icon: Wallet },
  { id: 'documentos', label: 'Documentos', icon: Barcode },
  { id: 'usuarios', label: 'Usuarios y roles', icon: Users },
];

const defaultEmpresa = {
  nombre: 'Bodega de Ropa',
  nit: '901.234.567-1',
  direccion: 'Calle 5 # 4-23, Centro',
  telefono: '+57 300 111 2233',
  email: 'contacto@bodega.com',
  moneda: 'COP',
  iva: 19,
  ciudad: 'Cali',
};

const defaultNumeracion = {
  factura: 'FAC-1001',
  cotizacion: 'COT-0001',
  pedido: 'PED-0001',
  devolucion: 'NOT-0001',
};

function settingsToState(settings) {
  return {
    empresa: {
      nombre: settings['company.name'] || defaultEmpresa.nombre,
      nit: settings['company.nit'] || defaultEmpresa.nit,
      direccion: settings['company.address'] || defaultEmpresa.direccion,
      telefono: settings['company.phone'] || defaultEmpresa.telefono,
      email: settings['company.email'] || defaultEmpresa.email,
      ciudad: settings['company.city'] || defaultEmpresa.ciudad,
      moneda: settings['currency'] || defaultEmpresa.moneda,
      iva: Number(settings['iva']) || defaultEmpresa.iva,
    },
    numeracion: {
      factura: settings['document.factura'] || defaultNumeracion.factura,
      cotizacion: settings['document.cotizacion'] || defaultNumeracion.cotizacion,
      pedido: settings['document.pedido'] || defaultNumeracion.pedido,
      devolucion: settings['document.devolucion'] || defaultNumeracion.devolucion,
    },
  };
}

function stateToSettings(empresa, numeracion) {
  return {
    'company.name': empresa.nombre,
    'company.nit': empresa.nit,
    'company.address': empresa.direccion,
    'company.phone': empresa.telefono,
    'company.email': empresa.email,
    'company.city': empresa.ciudad,
    currency: empresa.moneda,
    iva: String(empresa.iva),
    'document.factura': numeracion.factura,
    'document.cotizacion': numeracion.cotizacion,
    'document.pedido': numeracion.pedido,
    'document.devolucion': numeracion.devolucion,
  };
}

export default function Configuracion() {
  const [tab, setTab] = useState('empresa');
  const [empresa, setEmpresa] = useState(defaultEmpresa);
  const [numeracion, setNumeracion] = useState(defaultNumeracion);
  const [cats, setCats] = useState(['Camisetas', 'Pantalones', 'Chaquetas', 'Vestidos', 'Ropa deportiva', 'Accesorios']);
  const [marcas, setMarcas] = useState(['Básico', 'Nike', 'Adidas', 'Lévi\'s', 'Colombina']);
  const [tallas, setTallas] = useState(['XS', 'S', 'M', 'L', 'XL']);
  const [colores] = useState(['Negro', 'Blanco', 'Rojo', 'Azul']);
  const [metodos, setMetodos] = useState(['Efectivo', 'Transferencia', 'Nequi', 'Bancolombia', 'Daviplata', 'Tarjeta débito', 'Tarjeta crédito', 'Crédito']);
  const [roles] = useState([
    { name: 'Administrador', count: 1, desc: 'Acceso completo' },
    { name: 'Gerente', count: 0, desc: 'Dashboard, ventas, inventario, compras, reportes' },
    { name: 'Vendedor', count: 1, desc: 'POS, clientes, ventas' },
    { name: 'Bodega', count: 0, desc: 'Inventario, entradas, salidas, compras' },
    { name: 'Contabilidad', count: 0, desc: 'Finanzas, gastos, cuentas, reportes' },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api('/settings')
      .then((settings) => {
        if (!alive) return;
        const { empresa: e, numeracion: n } = settingsToState(settings || {});
        setEmpresa(e);
        setNumeracion(n);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const guardar = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api('/settings', {
        method: 'PUT',
        body: stateToSettings(empresa, numeracion),
      });
      setMessage('Cambios guardados correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Parámetros generales del sistema</p>
        </div>
        <Button onClick={guardar} disabled={saving || loading}>
          <Save size={16} /> {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando configuración…</p>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
      {message && <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === t.id ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'empresa' && (
        <Card title="Datos de la empresa" subtitle="Aparecen en facturas y comprobantes">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Nombre de empresa" value={empresa.nombre} onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })} />
            <Input label="NIT" value={empresa.nit} onChange={(e) => setEmpresa({ ...empresa, nit: e.target.value })} />
            <Input label="Ciudad" value={empresa.ciudad} onChange={(e) => setEmpresa({ ...empresa, ciudad: e.target.value })} />
            <Input label="Dirección" value={empresa.direccion} onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })} />
            <Input label="Teléfono" value={empresa.telefono} onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })} />
            <Input label="Email" value={empresa.email} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} />
            <Select label="Moneda" value={empresa.moneda} onChange={(e) => setEmpresa({ ...empresa, moneda: e.target.value })}>
              <option>COP</option><option>USD</option>
            </Select>
            <Input label="IVA por defecto (%)" type="number" value={empresa.iva} onChange={(e) => setEmpresa({ ...empresa, iva: Number(e.target.value) || 0 })} />
            <div className="flex items-end">
              <Button variant="secondary"><Store size={16} /> Subir logo</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === 'catalogo' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Categorías" subtitle="Agregue, edite o elimine">
            <ul className="space-y-2">{cats.map((c) => <li key={c} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"><span>{c}</span><button className="text-red-400 hover:text-red-600">Eliminar</button></li>)}</ul>
            <div className="mt-3 flex gap-2"><Input placeholder="Nueva categoría" /><Button variant="secondary">Agregar</Button></div>
          </Card>
          <Card title="Marcas">
            <ul className="space-y-2">{marcas.map((m) => <li key={m} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"><span>{m}</span><button className="text-red-400 hover:text-red-600">Eliminar</button></li>)}</ul>
            <div className="mt-3 flex gap-2"><Input placeholder="Nueva marca" /><Button variant="secondary">Agregar</Button></div>
          </Card>
          <Card title="Tallas">
            <div className="flex flex-wrap gap-2">{tallas.map((t) => <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">{t}</span>)}</div>
            <div className="mt-3 flex gap-2"><Input placeholder="Nueva talla (Ej: XXL)" /><Button variant="secondary">Agregar</Button></div>
          </Card>
          <Card title="Colores">
            <div className="flex flex-wrap gap-2">{colores.map((c) => <span key={c} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"><span className="inline-block h-3 w-3 rounded-full border border-gray-300" style={{ background: c.toLowerCase() }} />{c}</span>)}</div>
            <div className="mt-3 flex gap-2"><Input placeholder="Nuevo color" /><Button variant="secondary">Agregar</Button></div>
          </Card>
        </div>
      )}

      {tab === 'metodos' && (
        <Card title="Métodos de pago" subtitle="Habilitados en el punto de venta">
          <div className="flex flex-wrap gap-2">{metodos.map((m) => <span key={m} className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">{m} ✓</span>)}</div>
        </Card>
      )}

      {tab === 'documentos' && (
        <Card title="Numeración de documentos" subtitle="Siguiente número por tipo de documento">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(numeracion).map(([k, v]) => (
              <div key={k}>
                <label className="mb-1 block text-sm capitalize font-medium text-gray-700">{k.replace('_', ' ')}</label>
                <input value={v} onChange={(e) => setNumeracion({ ...numeracion, [k]: e.target.value })} className="input w-full font-mono" />
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Arquitectura lista para la integración con facturación electrónica DIAN: resoluciones, prefijos y validación de documentos.
          </p>
        </Card>
      )}

      {tab === 'usuarios' && (
        <Card title="Roles y permisos" subtitle="Niveles de acceso configurables">
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-gray-400" />
                  <div><p className="text-sm font-semibold text-gray-800">{r.name}</p><p className="text-xs text-gray-500">{r.desc}</p></div>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{r.count} usuario{r.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
