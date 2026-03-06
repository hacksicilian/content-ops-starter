'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getInitials } from '@/lib/utils';
import type { User, HRRecord, HRFormData, UserRole } from '@/types';

const HR_TYPES = [
    { value: 'LICENCIA', label: 'Licencia' },
    { value: 'AUSENCIA', label: 'Ausencia' },
    { value: 'VACACIONES', label: 'Vacaciones' },
    { value: 'CAPACITACION', label: 'Capacitación' },
    { value: 'GUARDIA', label: 'Guardia' },
    { value: 'OTRO', label: 'Otro' }
];

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'PMO / Admin',
    controller: 'Controller',
    im_swap: 'IM Swap & Cleanup',
    im_tss: 'IM TSS',
    backoffice: 'Backoffice',
    viewer: 'Jefe (Viewer)'
};

interface Props {
    users: User[];
    records: HRRecord[];
}

export function RRHHClient({ users, records: initial }: Props) {
    const [records, setRecords] = useState<HRRecord[]>(initial);
    const [showModal, setShowModal] = useState(false);
    const [tab, setTab] = useState<'team' | 'records'>('team');
    const [filterUser, setFilterUser] = useState('');

    const filteredRecords = records.filter(r =>
        !filterUser || (r as any).user?.id === filterUser
    );

    const handleSave = async (data: HRFormData) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: created } = await supabase
            .from('hr_records')
            .insert({ ...data, created_by: user?.id })
            .select('*, user:users!user_id(id, name, role), created_by_user:users!created_by(name)')
            .single();
        if (created) setRecords(prev => [created as any, ...prev]);
        setShowModal(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este registro?')) return;
        const supabase = createClient();
        await supabase.from('hr_records').delete().eq('id', id);
        setRecords(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setTab('team')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'team' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Equipo</button>
                    <button onClick={() => setTab('records')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'records' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Novedades</button>
                </div>
                {tab === 'records' && (
                    <button onClick={() => setShowModal(true)} className="btn-primary">+ Novedad</button>
                )}
            </div>

            {tab === 'team' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(user => {
                        const userRecords = records.filter((r: any) => r.user?.id === user.id);
                        const thisMonth = userRecords.filter(r => r.date.startsWith(new Date().toISOString().slice(0, 7)));
                        return (
                            <div key={user.id} className="card p-5">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0">
                                        {getInitials(user.name)}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{user.name}</div>
                                        <div className="text-sm text-gray-500">{ROLE_LABELS[user.role]}</div>
                                        <div className="text-xs text-gray-400">{user.email}</div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 pt-3">
                                    <div className="text-xs text-gray-500">Novedades este mes: <span className="font-semibold text-gray-700">{thisMonth.length}</span></div>
                                    {thisMonth.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {thisMonth.slice(0, 2).map(r => (
                                                <div key={r.id} className="text-xs text-gray-600 flex items-center gap-1">
                                                    <span className="badge bg-purple-100 text-purple-600 text-xs">{HR_TYPES.find(t => t.value === r.type)?.label}</span>
                                                    <span>{formatDate(r.date)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h3 className="font-semibold text-gray-900">Registro de Novedades</h3>
                        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="form-select w-48">
                            <option value="">Todos</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr><th>Fecha</th><th>Personal</th><th>Tipo</th><th>Hasta</th><th>Notas</th><th></th></tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(r => (
                                    <tr key={r.id}>
                                        <td className="text-sm text-gray-600">{formatDate(r.date)}</td>
                                        <td className="font-medium text-gray-900">{(r as any).user?.name || '—'}</td>
                                        <td><span className="badge bg-purple-100 text-purple-700">{HR_TYPES.find(t => t.value === r.type)?.label || r.type}</span></td>
                                        <td className="text-gray-500 text-sm">{r.end_date ? formatDate(r.end_date) : '—'}</td>
                                        <td className="text-gray-500 text-sm max-w-xs truncate">{r.notes || '—'}</td>
                                        <td><button onClick={() => handleDelete(r.id)} className="btn-ghost btn-sm text-red-500 p-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>
                                    </tr>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin novedades</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <HRModal users={users} onSave={handleSave} onClose={() => setShowModal(false)} />
            )}
        </div>
    );
}

function HRModal({ users, onSave, onClose }: { users: User[]; onSave: (d: HRFormData) => void; onClose: () => void }) {
    const [form, setForm] = useState<HRFormData>({ user_id: '', date: new Date().toISOString().split('T')[0], end_date: '', type: 'AUSENCIA', notes: '' });
    const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const d = { ...form }; if (!d.end_date) delete d.end_date; onSave(d); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-semibold">Nueva Novedad RRHH</h2>
                    <button onClick={onClose} className="btn-ghost p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="form-label">Personal *</label><select value={form.user_id} onChange={e => set('user_id', e.target.value)} className="form-select" required><option value="">Seleccionar...</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div><label className="form-label">Tipo *</label><select value={form.type} onChange={e => set('type', e.target.value)} className="form-select">{HR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">Desde *</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Hasta</label><input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value || undefined)} className="form-input" /></div>
                    </div>
                    <div><label className="form-label">Notas</label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="form-input" rows={3} /></div>
                    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}
