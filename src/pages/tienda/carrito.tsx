import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface ItemCarrito {
  id: string;
  nombre: string;
  precioVenta: number;
  cantidad: number;
}

export default function CarritoPage() {
  const router = useRouter();
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // En producción el carrito vendría de localStorage o contexto
  // Aquí simplificamos con datos de ejemplo + query params
  useEffect(() => {
    const stored = localStorage.getItem('carrito');
    if (stored) setItems(JSON.parse(stored));
  }, []);

  const total = items.reduce((s, i) => s + i.cantidad * i.precioVenta, 0);

  function cambiarCantidad(id: string, cantidad: number) {
    if (cantidad <= 0) setItems((prev) => prev.filter((i) => i.id !== id));
    else setItems((prev) => prev.map((i) => i.id === id ? { ...i, cantidad } : i));
  }

  async function handleCheckout() {
    if (items.length === 0) return;
    setLoading(true);
    const res = await fetch('/api/mercadopago/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ id: i.id, title: i.nombre, quantity: i.cantidad, unit_price: i.precioVenta })),
        clienteNombre: nombre,
        clienteEmail: email
      })
    });
    const data = await res.json();
    setLoading(false);
    if (data.initPoint) {
      localStorage.removeItem('carrito');
      window.location.href = data.initPoint;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/tienda" className="text-gray-400 hover:text-gray-600">← Seguir comprando</a>
          <h1 className="text-xl font-bold text-gray-800">Tu carrito</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🛒</div>
            <p>Tu carrito está vacío</p>
            <a href="/tienda" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg text-sm">Ver productos</a>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.nombre}</p>
                    <p className="text-sm text-gray-500">{formatPeso(item.precioVenta)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => cambiarCantidad(item.id, item.cantidad - 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">−</button>
                    <span className="w-8 text-center font-medium">{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.id, item.cantidad + 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">+</button>
                  </div>
                  <span className="font-medium w-24 text-right">{formatPeso(item.cantidad * item.precioVenta)}</span>
                </div>
              ))}
              <div className="px-6 py-4 bg-gray-50 flex justify-between font-bold text-gray-800">
                <span>Total</span>
                <span>{formatPeso(total)}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-medium text-gray-800">Tus datos (opcional)</h3>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={handleCheckout} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50">
                {loading ? 'Procesando...' : '💳 Pagar con Mercado Pago'}
              </button>
              <p className="text-xs text-gray-400 text-center">Serás redirigido a Mercado Pago para completar el pago</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatPeso(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
