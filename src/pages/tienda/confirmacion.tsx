import React from 'react';
import { useRouter } from 'next/router';

export default function ConfirmacionPage() {
  const router = useRouter();
  const { status, ventaId } = router.query;

  const mensajes: Record<string, { titulo: string; desc: string; icon: string; color: string }> = {
    success: { titulo: '¡Pago aprobado!', desc: 'Tu pedido fue confirmado. Te contactaremos pronto.', icon: '✅', color: 'text-green-600' },
    failure: { titulo: 'El pago no pudo procesarse', desc: 'Podés intentarlo nuevamente o elegir otro método de pago.', icon: '❌', color: 'text-red-600' },
    pending: { titulo: 'Pago pendiente', desc: 'Tu pago está en proceso. Te avisaremos cuando se confirme.', icon: '⏳', color: 'text-yellow-600' }
  };

  const info = mensajes[String(status)] || mensajes.pending;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{info.icon}</div>
        <h1 className={`text-2xl font-bold mb-2 ${info.color}`}>{info.titulo}</h1>
        <p className="text-gray-500 mb-6">{info.desc}</p>
        {ventaId && <p className="text-xs text-gray-400 mb-6">Referencia: {ventaId}</p>}
        <div className="space-y-3">
          <a href="/tienda" className="block w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium text-sm">
            Seguir comprando
          </a>
          {status === 'failure' && (
            <button onClick={() => router.back()} className="block w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Intentar nuevamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
