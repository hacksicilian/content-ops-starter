import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/dashboard/Layout';

const CANAL_LABELS: Record<string, string> = {
  FISICO: '🏪 Local', WHATSAPP: '💬 WhatsApp', INSTAGRAM: '📸 Instagram',
  ONLINE: '🌐 Online', MERCADOLIBRE: '🛒 MercadoLibre'
};
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  PAGADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-gray-100 text-gray-600',
  DEVUELTO: 'bg-red-100 text-red-700'
};

interface Venta {
  id: string;
  fecha: string;
  canal: string;
  total: number;
  estadoPago: string;
  cliente: { nombre: string } | null;
  vendedor: { nombre: string };
  items: { producto: { nombre: string }; cantidad: number }[];
}

export default function VentasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [canal, setCanal] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    const qs = canal ? `?canal=${canal}` : '';
    fetch(`/api/ventas${qs}`).then((r) => r.json()).then(setVentas);
  }, [canal]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
          <a href="/dashboard/ventas/nueva" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Nueva venta
          </a>
        </div>

        <div>
          <select value={canal} onChange={(e) => setCanal(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Todos los canales</option>
            {Object.entries(CANAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Canal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Productos</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventas.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(v.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                  <td className="px-4 py-3 text-gray-800">{v.cliente?.nombre || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3">{CANAL_LABELS[v.canal] || v.canal}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {v.items.map((i) => `${i.producto.nombre} x${i.cantidad}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatPeso(v.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[v.estadoPago]}`}>
                      {v.estadoPago}
                    </span>
                  </td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay ventas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function formatPeso(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
