import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/dashboard/Layout';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface Producto {
  id: string;
  codigoNatura: string | null;
  nombre: string;
  categoria: string;
  precioVenta: number;
  precioCosto: number;
  activo: boolean;
  stockActual: number;
  stockMinimo: number;
}

export default function ProductosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const cargar = () => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`/api/productos${qs}`).then((r) => r.json()).then(setProductos);
  };

  useEffect(() => { cargar(); }, [search]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true);
    setImportResult(null);

    let rows: Record<string, string>[] = [];

    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      rows = result.data as Record<string, string>[];
    } else {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { raw: false }) as Record<string, string>[];
    }

    const res = await fetch('/api/productos/importar-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    const result = await res.json();
    setImportResult(result);
    setImportando(false);
    cargar();
    if (fileRef.current) fileRef.current.value = '';
  }

  const filtrados = productos.filter((p) =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileRef}
              onChange={handleFile}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importando}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {importando ? 'Importando...' : '📥 Importar Excel Natura'}
            </button>
            <a href="/dashboard/productos/nuevo" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              + Nuevo producto
            </a>
          </div>
        </div>

        {importResult && (
          <div className={`p-4 rounded-lg text-sm ${importResult.errores?.length ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            ✅ <strong>{importResult.creados}</strong> creados, <strong>{importResult.actualizados}</strong> actualizados
            {importResult.errores?.length > 0 && <span className="text-red-600 ml-2">⚠️ {importResult.errores.length} errores</span>}
          </div>
        )}

        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Producto</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Categoría</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Precio venta</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{p.nombre}</div>
                    {p.codigoNatura && <div className="text-xs text-gray-400">Cód. {p.codigoNatura}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.categoria}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPeso(p.precioVenta)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${p.stockActual <= p.stockMinimo ? 'text-red-600' : 'text-gray-800'}`}>
                      {p.stockActual}
                    </span>
                    {p.stockActual <= p.stockMinimo && <span className="text-xs text-red-500 ml-1">⚠️</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/dashboard/productos/${p.id}/editar`} className="text-blue-600 hover:underline text-xs">Editar</a>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay productos</td></tr>
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
