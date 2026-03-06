'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';
import type { StockItem, StockMovement } from '@/types';

interface Props {
    items: StockItem[];
    movements: StockMovement[];
}

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
    IN:         { label: 'Entrada',       color: 'text-green-700 bg-green-100' },
    OUT:        { label: 'Salida',        color: 'text-red-700 bg-red-100' },
    RETURN:     { label: 'Devolución',    color: 'text-yellow-700 bg-yellow-100' },
    TRANSFER:   { label: 'Transferencia', color: 'text-blue-700 bg-blue-100' },
    ADJUSTMENT: { label: 'Ajuste',        color: 'text-purple-700 bg-purple-100' }
};

export function StockClient({ items: initial, movements: initialMovements }: Props) {
    const [items, setItems] = useState<StockItem[]>(initial);
    const [movements, setMovements] = useState<StockMovement[]>(initialMovements);
    const [tab, setTab] = useState<'inventory' | 'movements'>('inventory');
    const [showItemModal, setShowItemModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [search, setSearch] = useState('');

    const filtered = items.filter(i =>
        !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
    );

    const lowStockCount = items.filter(i => i.is_low_stock).length;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{items.length}</div>
                        <div className="text-sm text-gray-500">Productos en catálogo</div>
                    </div>
                </div>
                <div className={`card p-4 flex items-center gap-3 ${lowStockCount > 0 ? 'border-red-200 bg-red-50' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                        <svg className={`w-5 h-5 ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-700' : 'text-green-700'}`}>{lowStockCount}</div>
                        <div className="text-sm text-gray-500">Stock bajo mínimo</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{movements.length}</div>
                        <div className="text-sm text-gray-500">Movimientos recientes</div>
                    </div>
                </div>
            </div>

            {/* Tabs + toolbar */}
            <div className="card">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setTab('inventory')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'inventory' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
                            Inventario
                        </button>
                        <button onClick={() => setTab('movements')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'movements' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
                            Movimientos
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="form-input w-48" />
                        {tab === 'inventory' ? (
                            <button onClick={() => { setEditingItem(null); setShowItemModal(true); }} className="btn-primary">
                                + Producto
                            </button>
                        ) : (
                            <button onClick={() => setShowMovementModal(true)} className="btn-primary">
                                + Movimiento
                            </button>
                        )}
                    </div>
                </div>

                {tab === 'inventory' ? (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Disponible</th>
                                    <th>Reservado</th>
                                    <th>Total</th>
                                    <th>Stock Mín.</th>
                                    <th>Ubicación</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(item => (
                                    <tr key={item.id}>
                                        <td className="font-mono text-sm font-medium text-gray-700">{item.code}</td>
                                        <td>
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            {item.is_low_stock && (
                                                <div className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    Stock bajo mínimo
                                                </div>
                                            )}
                                        </td>
                                        <td><span className="badge bg-slate-100 text-slate-600">{item.category}</span></td>
                                        <td>
                                            <span className={`font-semibold ${item.is_low_stock ? 'text-red-600' : 'text-green-600'}`}>
                                                {item.quantity_available} {item.unit}
                                            </span>
                                        </td>
                                        <td className="text-gray-500">{item.quantity_reserved} {item.unit}</td>
                                        <td className="text-gray-600">{item.quantity_total} {item.unit}</td>
                                        <td className="text-gray-500">{item.min_stock} {item.unit}</td>
                                        <td className="text-gray-500 text-sm">{item.location || '—'}</td>
                                        <td>
                                            <button onClick={() => { setEditingItem(item); setShowItemModal(true); }} className="btn-ghost btn-sm">
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={9} className="text-center py-10 text-gray-400">Sin productos</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Producto</th>
                                    <th>Tipo</th>
                                    <th>Cantidad</th>
                                    <th>Despliegue</th>
                                    <th>Referencia</th>
                                    <th>Usuario</th>
                                    <th>Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map((m: any) => {
                                    const typeConfig = MOVEMENT_LABELS[m.type] || { label: m.type, color: 'bg-gray-100 text-gray-700' };
                                    return (
                                        <tr key={m.id}>
                                            <td className="text-sm text-gray-500">{formatDateTime(m.created_at)}</td>
                                            <td>
                                                <div className="font-medium text-gray-900">{m.stock_item?.name || '—'}</div>
                                                <div className="text-xs text-gray-400">{m.stock_item?.code}</div>
                                            </td>
                                            <td><span className={`badge ${typeConfig.color}`}>{typeConfig.label}</span></td>
                                            <td className="font-semibold text-gray-900">{m.quantity}</td>
                                            <td className="text-gray-500 text-sm">{m.deployment?.site_code || '—'}</td>
                                            <td className="text-gray-500 text-sm">{m.reference_number || '—'}</td>
                                            <td className="text-gray-500 text-sm">{m.user?.name || '—'}</td>
                                            <td className="text-gray-500 text-sm max-w-xs truncate">{m.notes || '—'}</td>
                                        </tr>
                                    );
                                })}
                                {movements.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-10 text-gray-400">Sin movimientos</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showItemModal && <StockItemModal item={editingItem} onClose={() => setShowItemModal(false)} onSave={saved => { setItems(prev => editingItem ? prev.map(i => i.id === editingItem.id ? saved : i) : [saved, ...prev]); setShowItemModal(false); }} />}
            {showMovementModal && <StockMovementModal items={items} onClose={() => setShowMovementModal(false)} onSave={m => { setMovements(prev => [m, ...prev]); setShowMovementModal(false); }} />}
        </div>
    );
}

function StockItemModal({ item, onClose, onSave }: { item: StockItem | null; onClose: () => void; onSave: (i: StockItem) => void }) {
    const [form, setForm] = useState({ code: item?.code || '', name: item?.name || '', category: item?.category || '', unit: item?.unit || 'UN', quantity_total: item?.quantity_total || 0, quantity_available: item?.quantity_available || 0, quantity_reserved: item?.quantity_reserved || 0, min_stock: item?.min_stock || 0, location: item?.location || '', notes: item?.notes || '' });
    const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        if (item) {
            const { data } = await supabase.from('stock_items').update(form).eq('id', item.id).select().single();
            if (data) onSave(data as any);
        } else {
            const { data } = await supabase.from('stock_items').insert(form).select().single();
            if (data) onSave(data as any);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-semibold">{item ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <button onClick={onClose} className="btn-ghost p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">Código *</label><input type="text" value={form.code} onChange={e => set('code', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Nombre *</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Categoría *</label><input type="text" value={form.category} onChange={e => set('category', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Unidad</label><input type="text" value={form.unit} onChange={e => set('unit', e.target.value)} className="form-input" /></div>
                        <div><label className="form-label">Disponible</label><input type="number" step="0.01" value={form.quantity_available} onChange={e => set('quantity_available', Number(e.target.value))} className="form-input" /></div>
                        <div><label className="form-label">Stock Mínimo</label><input type="number" step="0.01" value={form.min_stock} onChange={e => set('min_stock', Number(e.target.value))} className="form-input" /></div>
                        <div className="col-span-2"><label className="form-label">Ubicación</label><input type="text" value={form.location} onChange={e => set('location', e.target.value)} className="form-input" /></div>
                    </div>
                    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}

function StockMovementModal({ items, onClose, onSave }: { items: StockItem[]; onClose: () => void; onSave: (m: StockMovement) => void }) {
    const [form, setForm] = useState({ stock_item_id: '', type: 'OUT', quantity: 1, reference_number: '', notes: '' });
    const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase.from('stock_movements').insert({ ...form, user_id: user?.id }).select('*, stock_item:stock_items!stock_item_id(code, name), user:users!user_id(name)').single();
        if (data) onSave(data as any);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-semibold">Registrar Movimiento</h2>
                    <button onClick={onClose} className="btn-ghost p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="form-label">Producto *</label><select value={form.stock_item_id} onChange={e => set('stock_item_id', e.target.value)} className="form-select" required><option value="">Seleccionar...</option>{items.map(i => <option key={i.id} value={i.id}>{i.code} — {i.name}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">Tipo *</label><select value={form.type} onChange={e => set('type', e.target.value)} className="form-select"><option value="IN">Entrada</option><option value="OUT">Salida</option><option value="RETURN">Devolución</option><option value="TRANSFER">Transferencia</option><option value="ADJUSTMENT">Ajuste</option></select></div>
                        <div><label className="form-label">Cantidad *</label><input type="number" step="0.01" min="0.01" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} className="form-input" required /></div>
                    </div>
                    <div><label className="form-label">N° Referencia</label><input type="text" value={form.reference_number} onChange={e => set('reference_number', e.target.value)} className="form-input" placeholder="OT, remito, etc." /></div>
                    <div><label className="form-label">Notas</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="form-input" rows={2} /></div>
                    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Registrar</button></div>
                </form>
            </div>
        </div>
    );
}
