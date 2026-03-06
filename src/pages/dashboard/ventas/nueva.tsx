import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/dashboard/Layout';

const CANALES = [
  { value: 'FISICO', label: '🏪 Local físico' },
  { value: 'WHATSAPP', label: '💬 WhatsApp' },
  { value: 'INSTAGRAM', label: '📸 Instagram' },
  { value: 'ONLINE', label: '🌐 Tienda online' },
  { value: 'MERCADOLIBRE', label: '🛒 MercadoLibre' }
];

interface ProductoOpt {
  id: string;
  nombre: string;
  precioVenta: number;
  stockActual: number;
}

interface ItemCarrito {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export default function NuevaVentaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [productos, setProductos] = useState<ProductoOpt[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [canal, setCanal] = useState('FISICO');
  const [clienteId, setClienteId] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/productos').then((r) => r.json()).then(setProductos);
    fetch('/api/clientes').then((r) => r.json()).then(setClientes);
  }, []);

  function agregarProducto(prod: ProductoOpt) {
    setItems((prev) => {
      const existe = prev.find((i) => i.productoId === prod.id);
      if (existe) return prev.map((i) => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { productoId: prod.id, nombre: prod.nombre, cantidad: 1, precioUnitario: prod.precioVenta }];
    });
    setProdSearch('');
  }

  function actualizarCantidad(productoId: string, cantidad: number) {
    if (cantidad <= 0) setItems((prev) => prev.filter((i) => i.productoId !== productoId));
    else setItems((prev) => prev.map((i) => i.productoId === productoId ? { ...i, cantidad } : i));
  }

  function actualizarPrecio(productoId: string, precio: number) {
    setItems((prev) => prev.map((i) => i.productoId === productoId ? { ...i, precioUnitario: precio } : i));
  }

  const total = items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { setError('Agregá al menos un producto'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canal, clienteId: clienteId || undefined, items, notas, estadoPago: 'PAGADO' })
    });
    setLoading(false);
    if (res.ok) {
      router.push('/dashboard/ventas');
    } else {
      const d = await res.json();
      setError(d.error || 'Error al registrar venta');
    }
  }

  const prodsFiltrados = productos.filter(
    (p) => p.stockActual > 0 && (!prodSearch || p.nombre.toLowerCase().includes(prodSearch.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <a href="/dashboard/ventas" className="text-gray-400 hover:text-gray-600">← Ventas</a>
          <h1 className="text-2xl font-bold text-gray-800">Nueva venta</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Canal y cliente */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canal de venta</label>
              <select value={canal} onChange={(e) => setCanal(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {CANALES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (opcional)</label>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Sin cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Buscador de productos */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar y agregar productos</label>
            <input
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              placeholder="Escribí el nombre del producto..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
            />
            {prodSearch && (
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {prodsFiltrados.slice(0, 8).map((p) => (
                  <button key={p.id} type="button" onClick={() => agregarProducto(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-green-50 flex justify-between items-center text-sm border-b last:border-0">
                    <span>{p.nombre}</span>
                    <span className="text-gray-500">{formatPeso(p.precioVenta)} · stock: {p.stockActual}</span>
                  </button>
                ))}
                {prodsFiltrados.length === 0 && <div className="px-4 py-3 text-gray-400 text-sm">Sin resultados</div>}
              </div>
            )}
          </div>

          {/* Carrito */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-medium text-gray-700">Productos en la venta</h3>
              </div>
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.productoId} className="px-6 py-3 flex items-center gap-4">
                    <div className="flex-1 font-medium text-gray-800">{item.nombre}</div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100">−</button>
                      <span className="w-8 text-center font-medium">{item.cantidad}</span>
                      <button type="button" onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100">+</button>
                    </div>
                    <input type="number" value={item.precioUnitario} onChange={(e) => actualizarPrecio(item.productoId, Number(e.target.value))}
                      className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right" />
                    <div className="w-24 text-right font-medium">{formatPeso(item.cantidad * item.precioUnitario)}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <span className="text-lg font-bold text-gray-800">Total: {formatPeso(total)}</span>
              </div>
            </div>
          )}

          {/* Notas y confirmar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-3">
              <a href="/dashboard/ventas" className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</a>
              <button type="submit" disabled={loading || items.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {loading ? 'Registrando...' : `✅ Confirmar venta ${items.length > 0 ? formatPeso(total) : ''}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function formatPeso(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
