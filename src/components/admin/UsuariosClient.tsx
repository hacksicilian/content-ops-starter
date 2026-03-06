'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getInitials } from '@/lib/utils';
import type { User, UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'PMO / Admin',
    controller: 'Controller',
    im_swap: 'IM Swap & Cleanup',
    im_tss: 'IM TSS',
    backoffice: 'Backoffice',
    viewer: 'Jefe (Viewer)'
};

const ROLE_COLORS: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-700',
    controller: 'bg-blue-100 text-blue-700',
    im_swap: 'bg-green-100 text-green-700',
    im_tss: 'bg-teal-100 text-teal-700',
    backoffice: 'bg-orange-100 text-orange-700',
    viewer: 'bg-gray-100 text-gray-600'
};

interface Props {
    users: User[];
}

export function UsuariosClient({ users: initial }: Props) {
    const [users, setUsers] = useState<User[]>(initial);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);

    const handleRoleChange = async (id: string, role: UserRole) => {
        const supabase = createClient();
        const { error } = await supabase.from('users').update({ role }).eq('id', id);
        if (!error) setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    };

    const handleToggleActive = async (id: string, active: boolean) => {
        const supabase = createClient();
        const { error } = await supabase.from('users').update({ active }).eq('id', id);
        if (!error) setUsers(prev => prev.map(u => u.id === id ? { ...u, active } : u));
    };

    const handleSave = async (data: { name: string; email: string; role: UserRole }) => {
        const supabase = createClient();

        if (editing) {
            const { data: updated } = await supabase.from('users').update(data).eq('id', editing.id).select().single();
            if (updated) setUsers(prev => prev.map(u => u.id === editing.id ? updated as User : u));
        }
        // Note: Creating new users requires inviting via Supabase Auth — show info instead
        setShowModal(false);
        setEditing(null);
    };

    return (
        <div className="space-y-4">
            <div className="card p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                        <strong>Para invitar nuevos usuarios:</strong> Ir al panel de Supabase → Authentication → Users → Invite User. Una vez creado, el perfil aparece aquí y podés asignar el rol correspondiente.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => (
                    <div key={user.id} className={`card p-5 ${!user.active ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${user.active ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
                                {getInitials(user.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 truncate">{user.name}</span>
                                    {!user.active && <span className="badge bg-gray-100 text-gray-500 text-xs">Inactivo</span>}
                                </div>
                                <div className="text-sm text-gray-500 truncate">{user.email}</div>
                                <div className="mt-2">
                                    <select
                                        value={user.role}
                                        onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${ROLE_COLORS[user.role]}`}
                                    >
                                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                            <option key={role} value={role}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400">Desde {formatDate(user.created_at)}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(user.id, !user.active)}
                                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${user.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                >
                                    {user.active ? 'Desactivar' : 'Activar'}
                                </button>
                                <button
                                    onClick={() => { setEditing(user); setShowModal(true); }}
                                    className="btn-ghost btn-sm p-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="font-semibold text-gray-900">Resumen de permisos por módulo</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table text-xs">
                        <thead>
                            <tr>
                                <th>Módulo</th>
                                {users.map(u => <th key={u.id}>{u.name.split(' ')[0]}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { module: 'dashboard', label: 'Dashboard' },
                                { module: 'panel', label: 'Panel de Control' },
                                { module: 'kanban', label: 'Kanban' },
                                { module: 'stock', label: 'Stock' },
                                { module: 'stock.inversas', label: 'Inversas' },
                                { module: 'planificacion', label: 'Planificación' },
                                { module: 'horas', label: 'Horas Impr.' },
                                { module: 'rrhh', label: 'RRHH' },
                                { module: 'facturacion', label: 'Facturación' },
                                { module: 'accesos', label: 'Accesos' }
                            ].map(row => (
                                <tr key={row.module}>
                                    <td className="font-medium text-gray-700">{row.label}</td>
                                    {users.map(u => {
                                        const { hasPermission } = require('@/types');
                                        const has = hasPermission(u.role, row.module);
                                        return (
                                            <td key={u.id} className="text-center">
                                                {has
                                                    ? <span className="text-green-500">✓</span>
                                                    : <span className="text-gray-300">—</span>
                                                }
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && editing && (
                <UserModal user={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
            )}
        </div>
    );
}

function UserModal({ user, onSave, onClose }: { user: User; onSave: (d: any) => void; onClose: () => void }) {
    const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role });
    const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-semibold">Editar Usuario</h2>
                    <button onClick={onClose} className="btn-ghost p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="form-label">Nombre</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="form-input" required /></div>
                    <div><label className="form-label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="form-input" required /></div>
                    <div><label className="form-label">Rol</label><select value={form.role} onChange={e => set('role', e.target.value as UserRole)} className="form-select">{Object.entries(ROLE_LABELS).map(([r, l]) => <option key={r} value={r}>{l}</option>)}</select></div>
                    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}
