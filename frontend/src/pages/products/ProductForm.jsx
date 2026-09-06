import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { api, formatCOP } from '../../api';
import Spinner from '../../components/Spinner';

const emptyVariant = { sizeId: '', colorId: '', sku: '', barcode: '', stock: 0, cost: 0, price: 0 };

const emptyProduct = {
  code: '', reference: '', name: '', description: '',
  categoryId: '', subcategoryId: '', brandId: '',
  material: '', gender: '', season: '',
  purchasePrice: 0, avgCost: 0, salePrice: 0, wholesalePrice: 0, promoPrice: 0,
  taxRate: 0, stockMin: 5, stockMax: 100, location: '', active: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyProduct);
  const [variants, setVariants] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/catalog/categories'), api('/catalog/brands'), api('/catalog/sizes'), api('/catalog/colors')])
      .then(([cats, brands, sizes, colors]) => setCatalog({ cats, brands, sizes, colors }));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api(`/products/${id}`).then((p) => {
      setForm({
        code: p.code || '', reference: p.reference || '', name: p.name || '', description: p.description || '',
        categoryId: p.categoryId ?? '', subcategoryId: p.subcategoryId ?? '', brandId: p.brandId ?? '',
        material: p.material || '', gender: p.gender || '', season: p.season || '',
        purchasePrice: p.purchasePrice || 0, avgCost: p.avgCost || 0, salePrice: p.salePrice || 0,
        wholesalePrice: p.wholesalePrice || 0, promoPrice: p.promoPrice || 0,
        taxRate: p.taxRate || 0, stockMin: p.stockMin || 5, stockMax: p.stockMax || 100,
        location: p.location || '', active: p.active,
      });
      setVariants(p.variants.map((v) => ({
        id: v.id,
        sizeId: v.sizeId ?? '',
        colorId: v.colorId ?? '',
        sku: v.sku || '',
        barcode: v.barcode || '',
        stock: v.stock,
        cost: v.cost,
        price: v.price,
      })));
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addVariant = () => setVariants((v) => [...v, { ...emptyVariant }]);
  const updVariant = (i, k) => (e) => {
    const val = e.target.value;
    setVariants((vs) => vs.map((v, idx) => {
      if (idx !== i) return v;
      const nv = { ...v, [k]: val };
      // Auto SKU
      if (k === 'sizeId' || k === 'colorId') {
        const size = catalog?.sizes.find((s) => s.id === Number(val === '' ? -1 : val));
        // simplificado: el SKU se genera al guardar si no existe
      }
      return nv;
    }));
  };
  const delVariant = (i) => setVariants((vs) => vs.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        subcategoryId: form.subcategoryId ? Number(form.subcategoryId) : null,
        brandId: form.brandId ? Number(form.brandId) : null,
        purchasePrice: Number(form.purchasePrice) || 0,
        avgCost: Number(form.purchasePrice) || 0,
        salePrice: Number(form.salePrice) || 0,
        wholesalePrice: Number(form.wholesalePrice) || 0,
        promoPrice: Number(form.promoPrice) || 0,
        taxRate: Number(form.taxRate) || 0,
        stockMin: Number(form.stockMin) || 5,
        stockMax: Number(form.stockMax) || 100,
        variants: variants.map((v) => ({
          ...v,
          id: v.id || undefined,
          sizeId: v.sizeId ? Number(v.sizeId) : null,
          colorId: v.colorId ? Number(v.colorId) : null,
          stock: Number(v.stock) || 0,
          cost: Number(v.cost) || Number(form.purchasePrice) || 0,
          price: Number(v.price) || Number(form.salePrice) || 0,
          sku: v.sku || `${form.reference || form.code}-${v.colorId}-${v.sizeId}`,
        })),
      };
      if (isEdit) await api(`/products/${id}`, { method: 'PUT', body: payload });
      else await api('/products', { method: 'POST', body: payload });
      navigate('/inventario/productos');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner full />;

  const cats = catalog?.cats || [];

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/inventario/productos')} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>
            <p className="text-sm text-gray-500">{isEdit ? form.code : 'Complete la información del catálogo'}</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          <Save size={18} /> {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

      {/* Información básica */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Información básica</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
            <input value={form.name} onChange={set('name')} className="input w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Referencia</label>
            <input value={form.reference} onChange={set('reference')} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Código interno / SKU base</label>
            <input value={form.code} onChange={set('code')} className="input w-full font-mono" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Categoría *</label>
            <select value={form.categoryId} onChange={set('categoryId')} className="input w-full" required>
              <option value="">Seleccione…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Subcategoría</label>
            <select value={form.subcategoryId} onChange={set('subcategoryId')} className="input w-full">
              <option value="">Sin subcategoría</option>
              {(cats.find((c) => c.id === Number(form.categoryId))?.subcategories || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Marca</label>
            <select value={form.brandId} onChange={set('brandId')} className="input w-full">
              <option value="">Sin marca</option>
              {catalog?.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Género</label>
            <select value={form.gender} onChange={set('gender')} className="input w-full">
              <option value="">Sin especificar</option>
              <option>Hombre</option><option>Mujer</option><option>Unisex</option><option>Niño</option><option>Niña</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Temporada</label>
            <select value={form.season} onChange={set('season')} className="input w-full">
              <option value="">Todas</option>
              <option>Primavera</option><option>Verano</option><option>Otoño</option><option>Invierno</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ubicación en bodega</label>
            <input value={form.location} onChange={set('location')} className="input w-full" placeholder="A1-05" />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="input w-full" />
          </div>
        </div>
      </div>

      {/* Precios */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Precios y costos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio de compra (costo) *</label>
            <input type="number" value={form.purchasePrice} onChange={set('purchasePrice')} className="input w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio de venta *</label>
            <input type="number" value={form.salePrice} onChange={set('salePrice')} className="input w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio mayorista</label>
            <input type="number" value={form.wholesalePrice} onChange={set('wholesalePrice')} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio promocional</label>
            <input type="number" value={form.promoPrice} onChange={set('promoPrice')} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">IVA / impuesto %</label>
            <input type="number" value={form.taxRate} onChange={set('taxRate')} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Stock mínimo</label>
            <input type="number" value={form.stockMin} onChange={set('stockMin')} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Stock máximo</label>
            <input type="number" value={form.stockMax} onChange={set('stockMax')} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Margen estimado</label>
            <div className="input w-full bg-gray-50">
              {form.salePrice ? ((Number(form.salePrice) - Number(form.purchasePrice)) / Number(form.salePrice) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Variantes */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Variantes (talla × color)</h2>
          <button type="button" onClick={addVariant} className="flex items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50">
            <Plus size={16} /> Agregar variante
          </button>
        </div>
        {variants.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Sin variantes. Agregue combinaciones de talla y color para controlar stock independiente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-3 py-2">Talla</th>
                  <th className="px-3 py-2">Color</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Código barras</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-right">Costo</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((v, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <select value={v.sizeId} onChange={updVariant(i, 'sizeId')} className="input w-20">
                        <option value="">—</option>
                        {catalog?.sizes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={v.colorId} onChange={updVariant(i, 'colorId')} className="input w-24">
                        <option value="">—</option>
                        {catalog?.colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2"><input value={v.sku} onChange={updVariant(i, 'sku')} className="input w-32 font-mono text-xs" /></td>
                    <td className="px-3 py-2"><input value={v.barcode} onChange={updVariant(i, 'barcode')} className="input w-32 font-mono text-xs" /></td>
                    <td className="px-3 py-2"><input type="number" value={v.stock} onChange={updVariant(i, 'stock')} className="input w-20 text-right" /></td>
                    <td className="px-3 py-2"><input type="number" value={v.cost} onChange={updVariant(i, 'cost')} className="input w-28 text-right" /></td>
                    <td className="px-3 py-2"><input type="number" value={v.price} onChange={updVariant(i, 'price')} className="input w-28 text-right" /></td>
                    <td className="px-3 py-2 text-right text-gray-600">{formatCOP((v.cost || 0) * (v.stock || 0))}</td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => delVariant(i)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </form>
  );
}