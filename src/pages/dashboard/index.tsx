import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/dashboard/Layout';

interface Stats {
  ventas: {
    hoy: { total: number; cantidad: number };
    semana: { total: number; cantidad: number };
    mes: { total: number; cantidad: number };
  };
  porCanal: { canal: string; total: number; cantidad: number }[];
  alertas: {
    vencimientos: { id: string; fechaVencimiento: string; cantidad: number; producto: { nombre: string } }[];
    stockBajo: { id: string; nombre: string; stockMinimo: number; stockActual: number }[];
  };
}

const CANAL_LABELS: Record<string, string> = {
  FISICO: '🏪 Local físico',
  WHATSAPP: '💬 WhatsApp',
  INSTAGRAM: '📸 Instagram',
  ONLINE: '🌐 Tienda online',
  MERCADOLIBRE: '🛒 MercadoLibre'
};

export default function DashboardHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/dashboard/stats').then((r) => r.json()).then(setStats);
  }, []);

  if (status === 'loading' || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>
      </DashboardLayout>
    );
  }

  const totalAlertas = stats.alertas.vencimientos.length + stats.alertas.stockBajo.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bienvenida, {session?.user?.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen de tu negocio Natura</p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Ventas hoy" value={formatPeso(stats.ventas.hoy.total)} sub={`${stats.ventas.hoy.cantidad} transacciones`} color="green" />
          <MetricCard title="Ventas esta semana" value={formatPeso(stats.ventas.semana.total)} sub={`${stats.ventas.semana.cantidad} transacciones`} color="blue" />
          <MetricCard title="Ventas este mes" value={formatPeso(stats.ventas.mes.total)} sub={`${stats.ventas.mes.cantidad} transacciones`} color="purple" />
        </div>

        {/* Alertas */}
        {totalAlertas > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h2 className="font-semibold text-red-700 mb-3">⚠️ Alertas ({totalAlertas})</h2>
            <div className="space-y-2">
              {stats.alertas.vencimientos.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-red-800">🗓️ <strong>{l.producto.nombre}</strong> — vence {new Date(l.fechaVencimiento).toLocaleDateString('es-AR')}</span>
                  <span className="text-red-600 font-medium">{l.cantidad} u.</span>
                </div>
              ))}
              {stats.alertas.stockBajo.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-orange-800">📉 <strong>{p.nombre}</strong> — stock bajo</span>
                  <span className="text-orange-600 font-medium">{p.stockActual}/{p.stockMinimo} min</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ventas por canal */}
        {stats.porCanal.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-4">📊 Ventas del mes por canal</h2>
            <div className="space-y-3">
              {stats.porCanal.map((c) => (
                <div key={c.canal} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{CANAL_LABELS[c.canal] || c.canal}</span>
                  <div className="text-right">
                    <span className="font-medium text-gray-800">{formatPeso(c.total)}</span>
                    <span className="text-xs text-gray-400 ml-2">({c.cantidad} ventas)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction href="/dashboard/ventas/nueva" label="Nueva venta" icon="💰" />
          <QuickAction href="/dashboard/inventario/agregar-lote" label="Agregar stock" icon="📦" />
          <QuickAction href="/dashboard/productos/nuevo" label="Nuevo producto" icon="➕" />
          <QuickAction href="/dashboard/clientes" label="Ver clientes" icon="👥" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200'
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color] || 'bg-gray-50 border-gray-200'}`}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a href={href} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors block">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
    </a>
  );
}

function formatPeso(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
