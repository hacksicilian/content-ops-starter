import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/dashboard/Layout';

interface Lote {
  id: string;
  cantidad: number;
  cantidadInicial: number;
  precioCosto: number;
  fechaVencimiento: string | null;
  numeroLote: string | null;
  fechaIngreso: string;
  producto: { nombre: string; categoria: string };
}

export default function InventarioPage() {
  const { status } = useSession();
  const router = useRouter();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [alertas, setAlertas] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/inventario/lotes').then((r) => r.json()).then(setLotes);
    fetch('/api/inventario/alertas').then((r) => r.json()).then(setAlertas);
  }, []);

  const ahora = new Date();

  function estadoVencimiento(fechaStr: string | null) {
    if (!fechaStr) return 'ok';
    const fecha = new Date(fechaStr);
    const dias = Math.ceil((fecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return 'vencido';
    if (dias <= 30) return 'proximo';
    return 'ok';
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <a href="/dashboard/inventario/agregar-lote" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Agregar stock
          </a>
        </div>

        {/* Resumen de alertas */}
        {alertas && (alertas.vencidos?.length > 0 || alertas.proximos?.length > 0 || alertas.stockBajo?.length > 0) && (
          <div className="grid grid-cols-3 gap-4">
            <AlertCard title="Vencidos" count={alertas.vencidos?.length} color="red" icon="🚫" />
            <AlertCard title="Vencen en 30 días" count={alertas.proximos?.length} color="orange" icon="⏰" />
            <AlertCard title="Stock bajo" count={alertas.stockBajo?.length} color="yellow" icon="📉" />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Producto</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Lote / Ingreso</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vencimiento</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lotes.map((l) => {
                const estado = estadoVencimiento(l.fechaVencimiento);
                return (
                  <tr key={l.id} className={`hover:bg-gray-50 ${estado === 'vencido' ? 'bg-red-50' : estado === 'proximo' ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{l.producto.nombre}</div>
                      <div className="text-xs text-gray-400">{l.producto.categoria}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {l.numeroLote && <div className="text-xs">#{l.numeroLote}</div>}
                      <div className="text-xs text-gray-400">{new Date(l.fechaIngreso).toLocaleDateString('es-AR')}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium">{l.cantidad}</span>
                      <span className="text-xs text-gray-400 ml-1">/{l.cantidadInicial}</span>
                    </td>
                    <td className="px-4 py-3">
                      {l.fechaVencimiento ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          estado === 'vencido' ? 'bg-red-100 text-red-700' :
                          estado === 'proximo' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {estado === 'vencido' ? '🚫 ' : estado === 'proximo' ? '⚠️ ' : '✅ '}
                          {new Date(l.fechaVencimiento).toLocaleDateString('es-AR')}
                        </span>
                      ) : <span className="text-gray-400 text-xs">Sin vencimiento</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatPeso(l.precioCosto)}</td>
                  </tr>
                );
              })}
              {lotes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay lotes en inventario</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AlertCard({ title, count, color, icon }: { title: string; count: number; color: string; icon: string }) {
  const colors: Record<string, string> = { red: 'bg-red-50 border-red-200 text-red-700', orange: 'bg-orange-50 border-orange-200 text-orange-700', yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700' };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-2xl">{icon}</div>
      <div className="text-2xl font-bold mt-1">{count}</div>
      <div className="text-sm">{title}</div>
    </div>
  );
}

function formatPeso(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
