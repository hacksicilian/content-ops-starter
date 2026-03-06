import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/dashboard/Layout';

const CATEGORIAS = ['Perfumes', 'Maquillaje', 'Cuidado del cabello', 'Cuidado de la piel', 'Cuidado corporal', 'Fragancias masculinas', 'Natura Kids', 'Bienestar', 'General'];

export default function NuevoProductoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', codigoNatura: '', descripcion: '', categoria: 'General', precioVenta: '', precioCosto: '', stockMinimo: '3' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (status === 'unauthenticated') { router.push('/login'); return null; }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, precioVenta: Number(form.precioVenta), precioCosto: Number(form.precioCosto), stockMinimo: Number(form.stockMinimo) })
    });
    setLoading(false);
    if (res.ok) {
      router.push('/dashboard/productos');
    } else {
      const d = await res.json();
      setError(d.error || 'Error al guardar');
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <a href="/dashboard/productos" className="text-gray-400 hover:text-gray-600">← Productos</a>
          <h1 className="text-2xl font-bold text-gray-800">Nuevo producto</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <FormField label="Nombre *" value={form.nombre} onChange={(v) => set('nombre', v)} required />
          <FormField label="Código Natura" value={form.codigoNatura} onChange={(v) => set('codigoNatura', v)} placeholder="Ej: 12345" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Precio venta (ARS) *" value={form.precioVenta} onChange={(v) => set('precioVenta', v)} type="number" required />
            <FormField label="Precio costo (ARS)" value={form.precioCosto} onChange={(v) => set('precioCosto', v)} type="number" />
          </div>
          <FormField label="Stock mínimo" value={form.stockMinimo} onChange={(v) => set('stockMinimo', v)} type="number" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <a href="/dashboard/productos" className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</a>
            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function FormField({ label, value, onChange, type = 'text', required = false, placeholder = '' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
    </div>
  );
}
