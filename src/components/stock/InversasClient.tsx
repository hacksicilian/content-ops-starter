'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/utils';

interface Props {
    returns: any[];
}

export function InversasClient({ returns: initial }: Props) {
    const [returns] = useState(initial);
    const [search, setSearch] = useState('');

    const filtered = returns.filter(r =>
        !search ||
        r.stock_item?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.stock_item?.code?.toLowerCase().includes(search.toLowerCase()) ||
        r.deployment?.site_code?.toLowerCase().includes(search.toLowerCase())
    );

    const totalItems = returns.length;
    const totalQty = returns.reduce((acc: number, r: any) => acc + Number(r.quantity), 0);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
                        <div className="text-sm text-gray-500">Registros de inversas</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{totalQty}</div>
                        <div className="text-sm text-gray-500">Unidades devueltas</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="font-semibold text-gray-900">Historial de Devoluciones</h3>
                    <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="form-input w-56" />
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Sitio de origen</th>
                                <th>N° Referencia</th>
                                <th>Registrado por</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r: any) => (
                                <tr key={r.id}>
                                    <td className="text-sm text-gray-500 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                                    <td>
                                        <div className="font-medium text-gray-900">{r.stock_item?.name || '—'}</div>
                                        <div className="text-xs text-gray-400">{r.stock_item?.code} · {r.stock_item?.category}</div>
                                    </td>
                                    <td className="font-semibold text-yellow-700">{r.quantity} {r.stock_item?.unit || 'UN'}</td>
                                    <td className="text-gray-600">
                                        {r.deployment ? (
                                            <div>
                                                <div className="font-medium">{r.deployment.site_code}</div>
                                                <div className="text-xs text-gray-400">{r.deployment.site_name}</div>
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td className="text-gray-500 font-mono text-sm">{r.reference_number || '—'}</td>
                                    <td className="text-gray-500 text-sm">{r.user?.name || '—'}</td>
                                    <td className="text-gray-500 text-sm max-w-xs truncate">{r.notes || '—'}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin devoluciones registradas</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
