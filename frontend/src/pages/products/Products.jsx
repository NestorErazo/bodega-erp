import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, PackageX, Eye } from 'lucide-react';
import { api, formatCOP } from '../../api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoryId) params.set('categoryId', categoryId);
    if (stockFilter === 'low') params.set('lowStock', 'true');
    api(`/products?${params.toString()}`)
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [q, categoryId, stockFilter]);
  useEffect(() => { api('/catalog/categories').then(setCatalog); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">Catálogo con variantes por talla y color</p>
        </div>
        <Link to="/inventario/productos/nuevo" className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus size={18} /> Nuevo producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, código, referencia, SKU…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="">Todas las categorías</option>
          {catalog?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="">Todo el stock</option>
          <option value="low">Stock bajo / agotado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Variantes</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10}><Spinner /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">No hay productos que coincidan.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.colorLabel || ''}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.reference || p.code}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-gray-600">{p.brand || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCOP(p.avgCost)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCOP(p.salePrice)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${p.totalStock <= 0 ? 'text-red-600' : p.totalStock <= p.stockMin ? 'text-amber-600' : 'text-gray-800'}`}>
                      {p.totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{p.variants.length}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/inventario/productos/${p.id}`} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-600" title="Ver/Editar">
                        <Pencil size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}