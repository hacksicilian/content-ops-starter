'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, ACCESS_STATUS_CONFIG } from '@/lib/utils';
import type { SiteAccess, SiteAccessStatus, SiteAccessType } from '@/types';

const ACCESS_TYPES = ['LLAVE', 'CODIGO', 'PERMISO_PROPIETARIO', 'MUNICIPAL', 'OTRO'];
const TYPE_LABELS: Record<string, string> = {
    LLAVE: 'Llave', CODIGO: 'Código', PERMISO_PROPIETARIO: 'Permiso Propietario', MUNICIPAL: 'Permiso Municipal', OTRO: 'Otro'
};

interface Props {
    accesses: SiteAccess[];
    users: { id: string; name: string }[];
    currentUserId: string;
}

export function AccesosClient({ accesses: initial, users, currentUserId }: Props) {
    const [accesses, setAccesses] = useState<SiteAccess[]>(initial);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<SiteAccess | null>(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');

    const filtered = accesses.filter(a => {
        const matchStatus = !filterStatus || a.status === filterStatus;
        const matchSearch = !search || a.site_code.toLowerCase().includes(search.toLowerCase()) || a.site_name.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const expiringSoon = accesses.filter(a => {
        if (!a.valid_until || a.status !== 'VIGENTE') return false;
        const daysLeft = Math.ceil((new Date(a.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 30 && daysLeft > 0;
    }).length;

    const expired = accesses.filter(a => a.status === 'VENCIDO').length;

    const handleSave = async (data: any) => {
        const supabase = createClient();
        if (editing) {
            const { data: updated } = await supabase.from('site_accesses').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id).select('*, managed_by_user:users!managed_by(name)').single();
            if (updated) setAccesses(prev => prev.map(a => a.id === editing.id ? updated as any : a));
        } else {
            const { data: created } = await supabase.from('site_accesses').insert({ ...data, managed_by: currentUserId }).select('*, managed_by_user:users!managed_by(name)').single();
            if (created) setAccesses(prev => [created as any, ...prev]);
        }
        setShowModal(false);
        setEditing(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este acceso?')) return;
        const supabase = createClient();
        await supabase.from('site_accesses').delete().eq('id', id);
        setAccesses(prev => prev.filter(a => a.id !== id));
    };

    const handleStatusChange = async (id: string, status: SiteAccessStatus) => {
        const supabase = createClient();
        await supabase.from('site_accesses').update({ status }).eq('id', id);
        setAccesses(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    };

    return (
        <div className="space-y-4">
            {/* Alerts */}
            {(expiringSoon > 0 || expired > 0) && (
                <div className="flex gap-4">
                    {expired > 0 && (
                        <div className="card p-4 flex-1 bg-red-50 border-red-200">
                            <div className="text-xl font-bold text-red-700">{expired}</div>
                            <div className="text-sm text-red-600">Accesos vencidos</div>
                        </div>
                    )}
                    {expiringSoon > 0 && (
                        <div className="card p-4 flex-1 bg-yellow-50 border-yellow-200">
                            <div className="text-xl font-bold text-yellow-700">{expiringSoon}</div>
                            <div className="text-sm text-yellow-600">Vencen en ≤ 30 días</div>
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="card">
                <div className="flex items-center justify-between px-6 py-4 border-b flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <input type="text" placeholder="Buscar sitio..." value={search} onChange={e => setSearch(e.target.value)} className="form-input w-48" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-40">
                            <option value="">Todos</option>
                            <option value="VIGENTE">Vigente</option>
                            <option value="VENCIDO">Vencido</option>
                            <option value="EN_GESTION">En Gestión</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </div>
                    <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">+ Acceso</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr><th>Sitio</th><th>Tipo Acceso</th><th>Estado</th><th>Contacto</th><th>Vigencia</th><th>Gestionado por</th><th>Notas</th><th></th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => {
                                const statusCfg = ACCESS_STATUS_CONFIG[a.status];
                                const daysLeft = a.valid_until ? Math.ceil((new Date(a.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                                return (
                                    <tr key={a.id}>
                                        <td>
                                            <div className="font-semibold text-gray-900">{a.site_code}</div>
                                            <div className="text-xs text-gray-500">{a.site_name}</div>
                                        </td>
                                        <td><span className="badge bg-slate-100 text-slate-700">{TYPE_LABELS[a.access_type] || a.access_type}</span></td>
                                        <td>
                                            <select
                                                value={a.status}
                                                onChange={e => handleStatusChange(a.id, e.target.value as SiteAccessStatus)}
                                                className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${statusCfg.bg} ${statusCfg.color}`}
                                            >
                                                <option value="VIGENTE">Vigente</option>
                                                <option value="VENCIDO">Vencido</option>
                                                <option value="EN_GESTION">En Gestión</option>
                                                <option value="CANCELADO">Cancelado</option>
                                            </select>
                                        </td>
                                        <td>
                                            {a.contact_name && <div className="text-sm text-gray-700">{a.contact_name}</div>}
                                            {a.contact_phone && <div className="text-xs text-gray-500">{a.contact_phone}</div>}
                                            {!a.contact_name && !a.contact_phone && '—'}
                                        </td>
                                        <td>
                                            {a.valid_until ? (
                                                <div>
                                                    <div className={`text-sm ${daysLeft !== null && daysLeft <= 30 && a.status === 'VIGENTE' ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}>
                                                        {formatDate(a.valid_until)}
                                                    </div>
                                                    {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && a.status === 'VIGENTE' && (
                                                        <div className="text-xs text-yellow-600">Vence en {daysLeft}d</div>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="text-gray-500 text-sm">{(a as any).managed_by_user?.name || '—'}</td>
                                        <td className="text-gray-500 text-sm max-w-xs truncate">{a.notes || '—'}</td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button onClick={() => { setEditing(a); setShowModal(true); }} className="btn-ghost btn-sm p-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                <button onClick={() => handleDelete(a.id)} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">Sin accesos registrados</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && <AccesosModal access={editing} users={users} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />}
        </div>
    );
}

function AccesosModal({ access, users, onSave, onClose }: { access: SiteAccess | null; users: any[]; onSave: (d: any) => void; onClose: () => void }) {
    const [form, setForm] = useState({
        site_code: access?.site_code || '', site_name: access?.site_name || '', access_type: access?.access_type || 'LLAVE',
        status: access?.status || 'VIGENTE', contact_name: access?.contact_name || '', contact_phone: access?.contact_phone || '',
        contact_email: access?.contact_email || '', valid_from: access?.valid_from ? access.valid_from.split('T')[0] : '',
        valid_until: access?.valid_until ? access.valid_until.split('T')[0] : '', notes: access?.notes || '', managed_by: access?.managed_by || users[0]?.id || ''
    });
    const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const d = { ...form }; if (!d.valid_from) delete (d as any).valid_from; if (!d.valid_until) delete (d as any).valid_until; onSave(d); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
                    <h2 className="font-semibold">{access ? 'Editar Acceso' : 'Nuevo Acceso'}</h2>
                    <button onClick={onClose} className="btn-ghost p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">Código Sitio *</label><input type="text" value={form.site_code} onChange={e => set('site_code', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Nombre Sitio *</label><input type="text" value={form.site_name} onChange={e => set('site_name', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Tipo Acceso</label><select value={form.access_type} onChange={e => set('access_type', e.target.value)} className="form-select">{ACCESS_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}</select></div>
                        <div><label className="form-label">Estado</label><select value={form.status} onChange={e => set('status', e.target.value)} className="form-select"><option value="VIGENTE">Vigente</option><option value="EN_GESTION">En Gestión</option><option value="VENCIDO">Vencido</option><option value="CANCELADO">Cancelado</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">Contacto</label><input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="form-input" placeholder="Nombre" /></div>
                        <div><label className="form-label">Teléfono</label><input type="text" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className="form-input" placeholder="+54 11..." /></div>
                        <div><label className="form-label">Vigencia desde</label><input type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} className="form-input" /></div>
                        <div><label className="form-label">Vigencia hasta</label><input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} className="form-input" /></div>
                    </div>
                    <div><label className="form-label">Gestionado por</label><select value={form.managed_by} onChange={e => set('managed_by', e.target.value)} className="form-select">{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div><label className="form-label">Notas</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="form-input" rows={3} /></div>
                    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}
