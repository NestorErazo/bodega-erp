import { useState, useEffect, useRef } from 'react';
import { Search, Trash2, Minus, Plus, Smartphone, Landmark, CreditCard, HandCoins, Banknote, CheckCircle2, Printer } from 'lucide-react';
import { api, formatCOP } from '../../api';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { printTicket } from '../../utils/print';

const methods = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'transferencia', label: 'Transferencia', icon: Landmark },
  { id: 'nequi', label: 'Nequi', icon: Smartphone, color: '#f43f5e' },
  { id: 'bancolombia', label: 'Bancolombia', icon: Landmark },
  { id: 'daviplata', label: 'Daviplata', icon: Smartphone },
  { id: 'tarjeta_debito', label: 'Tarjeta débito', icon: CreditCard },
  { id: 'tarjeta_credito', label: 'Tarjeta crédito', icon: CreditCard },
  { id: 'credito', label: 'Crédito', icon: HandCoins },
];

function VariantPicker({ variant, showTallas, showColores, onSelect }) {
  const [talla, setTalla] = useState('');
  const [color, setColor] = useState('');
  useEffect(() => { setTalla(''); setColor(''); }, [variant?.id]);
  if (!variant) return <div className="p-3 text-sm text-slate-400">Elija un producto para ver sus combinaciones.</div>;

  const tallas = [...new Set(variant.variantFull.map((v) => v.size).filter(Boolean))];
  const colores = [...new Set(variant.variantFull.map((v) => v.color).filter(Boolean))];

  const selected = variant.variantFull.find((v) =>
    (!talla || v.size === talla) && (!color || v.color === color)) ||
    (talla ? variant.variantFull.find((v) => v.size === talla) : null) ||
    (color ? variant.variantFull.find((v) => v.color === color) : null) ||
    variant.variantFull[0] || null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-semibold text-slate-400">TallA</p>
        <div className="flex flex-wrap gap-2">
          {tallas.map((t) => (
            <button key={t} onClick={() => setTalla(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${talla === t ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-slate-400">Color</p>
        <div className="flex flex-wrap gap-2">
          {colores.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${color === c ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <div className="rounded-lg bg-slate-800 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">{selected.label}</span>
            <span className={`font-bold ${selected.stock <= 0 ? 'text-red-400' : selected.stock <= 5 ? 'text-amber-400' : 'text-green-400'}`}>
              {selected.stock} und
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-slate-400">{selected.sku}</span>
            <button onClick={() => onSelect(selected)}
              className="mt-2 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
              + Agregar {formatCOP(selected.price)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildTicketHTML(done, user) {
  const itemsHTML = done.items.map((i) => `
    <tr>
      <td>${i.name}<br/><small>${i.color || 'U'} · ${i.size || 'Única'}</small></td>
      <td class="right">${i.qty}</td>
      <td class="right">${formatCOP(i.price * i.qty)}</td>
    </tr>
  `).join('');

  const pagosHTML = Object.entries(done.pagos)
    .filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => `<p>${k}: ${formatCOP(v)}</p>`)
    .join('');

  return `
    <h2>BODEGA DE ROPA</h2>
    <p class="center">NIT 901.234.567-1</p>
    <p class="center">Cali, Colombia</p>
    <div class="line"></div>
    <p>Comprobante: <b>${done.nro}</b></p>
    <p>Fecha: ${done.fecha}</p>
    <p>Vendedor: ${user?.name || ''}</p>
    <div class="line"></div>
    <table>
      <tr><th>Producto</th><th class="right">Cant</th><th class="right">Total</th></tr>
      ${itemsHTML}
    </table>
    <div class="line"></div>
    <p class="right bold">TOTAL: ${formatCOP(done.total)}</p>
    <div class="line"></div>
    ${pagosHTML}
    <p class="center">¡Gracias por su compra!</p>
  `;
}

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [payments, setPayments] = useState({ efectivo: '' });
  const [activeMethod, setActiveMethod] = useState('efectivo');
  const [showPay, setShowPay] = useState(false);
  const [done, setDone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payError, setPayError] = useState('');
  const searchRef = useRef(null);

  // Recarga el catálogo sin alterar carrito ni selección (solo actualiza el listado disponible)
  const loadProducts = () => {
    api('/products').then((ps) => {
      setProducts(ps.map((p) => ({
        ...p,
        variantFull: p.variants.map((v) => ({ ...v, productId: p.id, productName: p.name, salePrice: p.salePrice, label: `${v.color || 'U'} · ${v.size || 'Única'}` })),
      })));
    }).catch(() => {});
  };

  useEffect(() => {
    loadProducts();
    const timer = setInterval(loadProducts, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = query
    ? products.filter((p) =>
        [p.name, p.reference, p.code, p.barcode, p.sku].some((f) => f && f.toLowerCase().includes(query.toLowerCase())))
    : products.filter((p) => p.totalStock > 0);

  const total = cart.reduce((s, item) => s + item.price * (1 - (item.discount || 0) / 100) * item.qty, 0);
  const totalDiscount = cart.reduce((s, item) => s + item.price * (item.discount || 0) / 100 * item.qty, 0);
  const payTotal = Object.values(payments).reduce((s, v) => s + (Number(v) || 0), 0);
  const change = payTotal - total;

  const addToCart = (v) => {
    if (v.stock <= 0) return;
    setCart((c) => {
      const exist = c.find((i) => i.variantId === v.id);
      if (exist) return c.map((i) => (i.variantId === v.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { productId: v.productId, variantId: v.id, name: v.productName || '', color: v.color, size: v.size, sku: v.sku, price: v.price, qty: 1, discount: 0, variant: v }];
    });
  };

  const setQty = (variantId, delta) =>
    setCart((c) => c.map((i) => (i.variantId === variantId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)));

  const confirm = async () => {
    setPayError('');
    setSaving(true);
    try {
      const items = cart.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty, price: i.price }));
      const payEntries = Object.entries(payments).filter(([, v]) => Number(v) > 0);
      const res = await api('/sales', {
        method: 'POST',
        body: {
          customerId: null,
          items,
          payments: payEntries.map(([method, amount]) => ({ method, amount: Number(amount) })),
          discount: totalDiscount,
          tax: 0,
        },
      });
      setDone({ nro: res.number, fecha: res.fecha, items: cart, total, pagos: payments });
      setCart([]); setShowPay(false); setPayments({ efectivo: '' });
    } catch (err) {
      setPayError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Panel izquierdo: búsqueda y resultados */}
      <div className="flex w-1/2 min-w-0 flex-col gap-3 lg:w-3/5">
        <div className="relative">
          <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar o escanear código de barras, referencia, SKU…"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pr-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="grid flex-1 auto-rows-min grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={`rounded-xl border p-3 text-left transition ${selected?.id === p.id ? 'border-brand-500 bg-brand-600/10' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{p.name}</span>
              </div>
              <p className="text-xs text-slate-400">{p.reference || p.code}{p.brand ? ` · ${p.brand}` : ''}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base font-bold text-brand-400">{formatCOP(p.salePrice)}</span>
                <span className={`text-xs font-medium ${p.totalStock <= 0 ? 'text-red-400' : 'text-slate-400'}`}>{p.totalStock} und</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Panel derecho: variante + carrito */}
      <div className="flex w-1/2 flex-col gap-3 lg:w-2/5">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 min-h-40">
          {selected ? <VariantPicker variant={selected} onSelect={addToCart} /> : <p className="text-sm text-slate-400">Seleccione un producto para elegir talla y color.</p>}
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
            <span className="text-sm font-semibold text-white">Carrito · {cart.reduce((s, i) => s + i.qty, 0)} art</span>
            <button onClick={() => setCart([])} className="text-xs text-slate-500 hover:text-red-400">Vaciar</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">El carrito está vacío</p>
            ) : cart.map((i) => (
              <div key={i.variantId} className="mb-2 rounded-lg bg-slate-700/60 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{i.name}</p>
                    <p className="text-xs text-slate-400">{i.color || 'U'} · {i.size || 'Única'} · {i.sku}</p>
                  </div>
                  <button onClick={() => setCart((c) => c.filter((x) => x.variantId !== i.variantId))} className="text-slate-500 hover:text-red-400"><Trash2 size={15} /></button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(i.variantId, -1)} className="rounded bg-slate-600 p-1 text-white"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm font-semibold text-white">{i.qty}</span>
                    <button onClick={() => setQty(i.variantId, 1)} className="rounded bg-slate-600 p-1 text-white"><Plus size={14} /></button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatCOP(i.price * i.qty)}</p>
                    <p className="text-xs text-slate-400">{formatCOP(i.price)} c/u</p>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Desc %</span>
                  <input type="number" min={0} max={100} value={i.discount} onChange={(e) => setCart((c) => c.map((x) => x.variantId === i.variantId ? { ...x, discount: Number(e.target.value) } : x))}
                    className="w-16 rounded bg-slate-600 px-2 py-0.5 text-xs text-white" />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-700 p-4">
            {totalDiscount > 0 && <div className="flex justify-between text-sm text-amber-400"><span>Descuentos</span><span>-{formatCOP(totalDiscount)}</span></div>}
            <div className="flex justify-between text-lg font-bold text-white"><span>Total</span><span>{formatCOP(total)}</span></div>
            <Button variant="primary" className="mt-3 w-full py-3 text-base" disabled={cart.length === 0}
              onClick={() => { setShowPay(true); setActiveMethod('efectivo'); }}>
              Cobrar {formatCOP(total)}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      {showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Pago de la venta</h3>
            <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-500">Total a cobrar</span>
              <span className="text-xl font-bold text-gray-900">{formatCOP(total)}</span>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Métodos de pago</p>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {methods.map((m) => (
                <button key={m.id} onClick={() => setActiveMethod(m.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium ${activeMethod === m.id ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <m.icon size={20} style={m.color ? { color: m.color } : undefined} /> {m.label}
                </button>
              ))}
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Monto ({methods.find((m) => m.id === activeMethod)?.label}):</span>
                <span className="font-semibold text-gray-800">{formatCOP(payTotal)}</span>
              </div>
              <input type="number" placeholder={activeMethod === 'efectivo' ? 'Efectivo recibido' : 'Valor a abonar'}
                value={payments[activeMethod] ?? ''}
                onChange={(e) => setPayments((p) => ({ ...p, [activeMethod]: e.target.value }))}
                className="input w-full text-right text-lg" autoFocus />
              {activeMethod === 'efectivo' && total - payTotal > 0 && (
                <input type="number" placeholder="Vuelto sugerido"
                  value={Math.max(0, payTotal - total) || ''} className="input w-full bg-gray-50 text-right" disabled />
              )}
              {payTotal > total && <p className="text-sm text-green-600">Cambio: {formatCOP(change)}</p>}
              {payTotal < total && <p className="text-sm text-amber-600">Faltan {formatCOP(total - payTotal)}</p>}
            </div>

<div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowPay(false)}>Cancelar</Button>
              <Button className="flex-1" disabled={payTotal < total || saving} onClick={confirm}>
                {saving ? 'Guardando…' : <><CheckCircle2 size={16} /> Confirmar</>}
              </Button>
            </div>
            {payError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{payError}</p>}
          </div>
        </div>
      )}

      {/* Comprobante */}
      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <div className="mb-3 flex flex-col items-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"><CheckCircle2 size={26} /></span>
              <h3 className="mt-2 text-lg font-bold text-gray-900">Venta realizada</h3>
              <p className="text-sm text-gray-500">Comprobante {done.nro}</p>
            </div>
            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-semibold text-gray-800">Bodega de Ropa</p>
              <p className="text-xs text-gray-500">NIT 901.234.567-1 · Cali</p>
              <div className="my-2 border-t border-dashed border-gray-300" />
              {"items" in done && done.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span>{i.qty}× {i.name} ({i.color}/{i.size})</span><span>{formatCOP(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="my-2 border-t border-dashed border-gray-300" />
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatCOP(total)}</span></div>
              {Object.entries(done.pagos).filter(([_, v]) => Number(v) > 0).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs"><span className="capitalize">{k}</span><span>{formatCOP(v)}</span></div>
              ))}
              <p className="mt-3 text-center text-[10px] text-gray-400">Vendedor: {user?.name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => { printTicket(`Venta ${done.nro}`, buildTicketHTML(done, user)); }}><Printer size={16} /> Imprimir</Button>
              <Button className="flex-1" onClick={() => setDone(null)}>Nueva venta</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}