'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import type { UnproductiveHour, HoursFormData, Deployment } from '@/types';

const CATEGORIES = [
    { value: 'CLIMA', label: 'Condiciones Climáticas' },
    { value: 'ACCESO', label: 'Problemas de Acceso' },
    { value: 'ESPERA_MATERIAL', label: 'Espera de Material' },
    { value: 'ADMIN', label: 'Gestiones Administrativas' },
    { value: 'CAPACITACION', label: 'Capacitación' },
    { value: 'FALLA_EQUIPO', label: 'Falla de Equipo' },
    { value: 'OTRO', label: 'Otro' }
];

interface Props {
    hours: UnproductiveHour[];
    deployments: Pick<Deployment, 'id' | 'site_code' | 'site_name'>[];
    isAdmin: boolean;
    userId: string;
}

export function HorasClient({ hours: initial, deployments, isAdmin, userId }: Props) {
    const [hours, setHours] = useState<UnproductiveHour[]>(initial);
    const [showModal, setShowModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterUser, setFilterUser] = useState('');

    const totalHours = hours.reduce((acc, h) => acc + Number(h.hours), 0);
    const thisMonth = hours.filter(h => h.date.startsWith(new Date().toISOString().slice(0, 7)));
    const thisMonthHours = thisMonth.reduce((acc, h) => acc + Number(h.hours), 0);

    const byCategory = CATEGORIES.map(cat => ({
        ...cat,
        total: hours.filter(h => h.category === cat.value).reduce((acc, h) => acc + Number(h.hours), 0)
    })).filter(c => c.total > 0);

    const users = isAdmin ? [...new Set(hours.map((h: any) => h.user?.name).filter(Boolean))] : [];

    const filtered = hours.filter(h => {
        const matchCat = !filterCategory || h.category === filterCategory;
        const matchUser = !filterUser || (h as any).user?.name === filterUser;
        return matchCat && matchUser;
    });

    const handleSave = async (data: HoursFormData) => {
        const supabase = createClient();
        const { data: created } = await supabase
            .from('unproductive_hours')
            .insert({ ...data, user_id: userId })
            .select('*, user:users!user_id(id, name, role), deployment:deployments!deployment_id(site_code, site_name)')
            .single();
        if (created) setHours(prev => [created as any, ...prev]);
        setShowModal(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este registro?')) return;
        const supabase = createClient();
        await supabase.from('unproductive_hours').delete().eq('id', id);
        setHours(prev => prev.filter(h => h.id !== id));
    };

    return (
        <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4">
                    <div className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</div>
                    <div className="text-sm text-gray-500">Total histórico</div>
                </div>
                <div className="card p-4">
                    <div className="text-2xl font-bold text-indigo-600">{thisMonthHours.toFixed(1)}h</div>
                    <div className="text-sm text-gray-500">Este mes</div>
                </div>
                <div className="card p-4">
                    <div className="text-2xl font-bold text-gray-900">{byCategory.length > 0 ? byCategory.sort((a,b) => b.total - a.total)[0].label : '—'}</div>
                    <div className="text-sm text-gray-500">Categoría más frecuente</div>
                </div>
            </div>

            {/* Category breakdown */}
            {byCategory.length > 0 && (
                <div className="card p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Distribución por categoría</h3>
                    <div className="space-y-2">
                        {byCategory.sort((a, b) => b.total - a.total).map(cat => (
                            <div key={cat.value} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 w-48 flex-shrink-0">{cat.label}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-indigo-500 h-2 rounded-full"
                                        style={{ width: `${(cat.total / totalHours) * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-700 w-16 text-right">{cat.total.toFixed(1)}h</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="form-select w-52">
                            <option value="">Todas las categorías</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        {isAdmin && users.length > 0 && (
                            <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="form-select w-44">
                                <option value="">Todos los usuarios</option>
                                {users.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        )}
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary">+ Registrar Horas</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                {isAdmin && <th>Usuario</th>}
                                <th>Horas</th>
                                <th>Categoría</th>
                                <th>Descripción</th>
                                <th>Sitio</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(h => (
                                <tr key={h.id}>
                                    <td className="text-sm text-gray-600">{formatDate(h.date)}</td>
                                    {isAdmin && <td className="text-gray-700 font-medium">{(h as any).user?.name || '—'}</td>}
                                    <td><span className="font-semibold text-indigo-600">{h.hours}h</span></td>
                                    <td><span className="badge bg-purple-100 text-purple-700">{CATEGORIES.find(c => c.value === h.category)?.label || h.category}</span></td>
                                    <td className="text-gray-600 max-w-xs truncate">{h.description || '—'}</td>
                                    <td className="text-gray-500 text-sm">{(h as any).deployment?.site_code || '—'}</td>
                                    <td>
                                        {(isAdmin || h.user_id === userId) && (
                                            <button onClick={() => handleDelete(h.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50 p-1.5">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-gray-400">Sin registros</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <HorasModal deployments={deployments} onSave={handleSave} onClose={() => setShowModal(false)} />
            )}
        </div>
    );
}

function HorasModal({ deployments, onSave, onClose }: { deployments: any[]; onSave: (d: HoursFormData) => void; onClose: () => void }) {
    const [form, setForm] = useState<HoursFormData>({ date: new Date().toISOString().split('T')[0], hours: 1, category: 'OTRO', description: '', deployment_id: '' });
    const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...form };
        if (!data.deployment_id) delete data.deployment_id;
        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-semibold">Registrar Horas Improductivas</h2>
                    <button onClick={onClose} className="btn-ghost p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">Fecha *</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Horas *</label><input type="number" step="0.5" min="0.5" max="24" value={form.hours} onChange={e => set('hours', Number(e.target.value))} className="form-input" required /></div>
                    </div>
                    <div><label className="form-label">Categoría *</label><select value={form.category} onChange={e => set('category', e.target.value)} className="form-select" required>{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                    <div><label className="form-label">Descripción</label><textarea value={form.description || ''} onChange={e => set('description', e.target.value)} className="form-input" rows={3} placeholder="Detallá la causa..." /></div>
                    <div><label className="form-label">Sitio relacionado</label><select value={form.deployment_id || ''} onChange={e => set('deployment_id', e.target.value || undefined)} className="form-select"><option value="">Sin sitio específico</option>{deployments.map(d => <option key={d.id} value={d.id}>{d.site_code} — {d.site_name}</option>)}</select></div>
                    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}
