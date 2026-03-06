import React, { useEffect, useState } from 'react';

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  descripcion: string | null;
  imagenUrl: string | null;
  stockActual: number;
}

export default function TiendaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoria, setCategoria] = useState('');
  const [carrito, setCarrito] = useState<Record<string, number>>({});

  useEffect(() => {
    const qs = categoria ? `?categoria=${encodeURIComponent(categoria)}&activo=true` : '?activo=true';
    fetch(`/api/tienda/productos${qs}`).then((r) => r.json()).then(setProductos);
  }, [categoria]);

  const categorias = [...new Set(productos.map((p) => p.categoria))];
  const totalItems = Object.values(carrito).reduce((s, n) => s + n, 0);

  function toggleCarrito(id: string) {
    setCarrito((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-700">🌿 Natura — Liliana</h1>
            <p className="text-xs text-gray-500">Productos de belleza y cuidado personal</p>
          </div>
          <a href="/tienda/carrito" className="relative bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            🛒 Carrito
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filtro por categoría */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setCategoria('')} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${!categoria ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
            Todos
          </button>
          {categorias.map((c) => (
            <button key={c} onClick={() => setCategoria(c)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${categoria === c ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.filter((p) => p.stockActual > 0).map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {p.imagenUrl ? (
                <img src={p.imagenUrl} alt={p.nombre} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-4xl">🌿</div>
              )}
              <div className="p-4">
                <div className="text-xs text-green-600 font-medium mb-1">{p.categoria}</div>
                <h3 className="font-medium text-gray-800 text-sm leading-tight mb-2">{p.nombre}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">{formatPeso(p.precioVenta)}</span>
                  <button
                    onClick={() => toggleCarrito(p.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {productos.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🌿</div>
              <p>No hay productos disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatPeso(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
