import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/dashboard/Layout';

export default function AgregarLotePage() {
  const { status } = useSession();
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [form, setForm] = useState({ productoId: '', cantidad: '', precioCosto: '', fechaVencimiento: '', numeroLote: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/productos').then((r) => r.json()).then(setProductos);
  }, []);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/inventario/lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cantidad: Number(form.cantidad), precioCosto: Number(form.precioCosto) })
    });
    setLoading(false);
    if (res.ok) {
      router.push('/dashboard/inventario');
    } else {
      const d = await res.json();
      setError(d.error || 'Error al guardar');
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <a href="/dashboard/inventario" className="text-gray-400 hover:text-gray-600">← Inventario</a>
          <h1 className="text-2xl font-bold text-gray-800">Agregar stock</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
            <select value={form.productoId} onChange={(e) => set('productoId', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Seleccionar producto...</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
              <input type="number" min="1" value={form.cantidad} onChange={(e) => set('cantidad', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio costo (ARS)</label>
              <input type="number" value={form.precioCosto} onChange={(e) => set('precioCosto', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
            <input type="date" value={form.fechaVencimiento} onChange={(e) => set('fechaVencimiento', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400 mt-1">Importante: ingresar siempre para controlar vencimientos</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de lote (opcional)</label>
            <input type="text" value={form.numeroLote} onChange={(e) => set('numeroLote', e.target.value)} placeholder="Ej: LOT-2024-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <a href="/dashboard/inventario" className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</a>
            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Guardando...' : 'Agregar stock'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
