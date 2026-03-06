'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, DEPLOYMENT_STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils';
import type { Deployment, DeploymentStatus, DeploymentType, Priority, User } from '@/types';
import { DeploymentModal } from './DeploymentModal';
import { createClient } from '@/lib/supabase/client';

interface Props {
    deployments: Deployment[];
    users: Pick<User, 'id' | 'name' | 'role'>[];
}

const STATUS_OPTIONS: DeploymentStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED'];
const TYPE_OPTIONS: DeploymentType[] = ['SWAP', 'TSS', 'CLEANUP', 'INTEGRACION', 'OTRO'];

export function PanelClient({ deployments: initial, users }: Props) {
    const router = useRouter();
    const [deployments, setDeployments] = useState<Deployment[]>(initial);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Deployment | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterIM, setFilterIM] = useState<string>('');

    const filtered = useMemo(() => {
        return deployments.filter(d => {
            const matchSearch = !search || d.site_code.toLowerCase().includes(search.toLowerCase()) || d.site_name.toLowerCase().includes(search.toLowerCase());
            const matchStatus = !filterStatus || d.status === filterStatus;
            const matchType = !filterType || d.type === filterType;
            const matchIM = !filterIM || d.im_assigned === filterIM;
            return matchSearch && matchStatus && matchType && matchIM;
        });
    }, [deployments, search, filterStatus, filterType, filterIM]);

    const handleSave = async (data: any) => {
        const supabase = createClient();

        if (editing) {
            const { data: updated, error } = await supabase
                .from('deployments')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', editing.id)
                .select('*, im_user:users!im_assigned(id, name, role)')
                .single();

            if (!error && updated) {
                setDeployments(prev => prev.map(d => d.id === editing.id ? updated as any : d));
            }
        } else {
            const { data: created, error } = await supabase
                .from('deployments')
                .insert(data)
                .select('*, im_user:users!im_assigned(id, name, role)')
                .single();

            if (!error && created) {
                setDeployments(prev => [created as any, ...prev]);
            }
        }

        setModalOpen(false);
        setEditing(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminár este despliegue? Esta acción no se puede deshacer.')) return;
        const supabase = createClient();
        const { error } = await supabase.from('deployments').delete().eq('id', id);
        if (!error) setDeployments(prev => prev.filter(d => d.id !== id));
    };

    const handleStatusChange = async (id: string, status: DeploymentStatus) => {
        const supabase = createClient();
        const { error } = await supabase.from('deployments').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
        if (!error) setDeployments(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-48">
                        <input
                            type="text"
                            placeholder="Buscar por código o nombre de sitio..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-40">
                        <option value="">Todos los estados</option>
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{DEPLOYMENT_STATUS_CONFIG[s].label}</option>
                        ))}
                    </select>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-select w-36">
                        <option value="">Todos los tipos</option>
                        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={filterIM} onChange={e => setFilterIM(e.target.value)} className="form-select w-44">
                        <option value="">Todos los IMs</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button
                        onClick={() => { setEditing(null); setModalOpen(true); }}
                        className="btn-primary ml-auto"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Despliegue
                    </button>
                </div>
            </div>

            {/* Summary counts */}
            <div className="flex gap-3 flex-wrap">
                {STATUS_OPTIONS.slice(0, 4).map(s => {
                    const count = deployments.filter(d => d.status === s).length;
                    const cfg = DEPLOYMENT_STATUS_CONFIG[s];
                    return (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterStatus === s ? cfg.bg + ' ' + cfg.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            {cfg.label}: {count}
                        </button>
                    );
                })}
                <span className="ml-auto text-sm text-gray-500 self-center">
                    {filtered.length} de {deployments.length} despliegues
                </span>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Sitio</th>
                                <th>Tipo</th>
                                <th>Tecnología</th>
                                <th>Estado</th>
                                <th>Prioridad</th>
                                <th>Responsable</th>
                                <th>Fecha Plan.</th>
                                <th>Avance</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-10 text-gray-400">
                                        Sin despliegues para los filtros seleccionados
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(d => {
                                    const status = DEPLOYMENT_STATUS_CONFIG[d.status];
                                    const priority = PRIORITY_CONFIG[d.priority];
                                    return (
                                        <tr key={d.id}>
                                            <td>
                                                <div className="font-semibold text-gray-900">{d.site_code}</div>
                                                <div className="text-xs text-gray-500">{d.site_name}</div>
                                                {d.region && <div className="text-xs text-gray-400">{d.region}</div>}
                                            </td>
                                            <td>
                                                <span className="badge bg-slate-100 text-slate-700">{d.type}</span>
                                            </td>
                                            <td className="text-gray-600">{d.technology || '—'}</td>
                                            <td>
                                                <select
                                                    value={d.status}
                                                    onChange={e => handleStatusChange(d.id, e.target.value as DeploymentStatus)}
                                                    className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${status.bg} ${status.color}`}
                                                >
                                                    {STATUS_OPTIONS.map(s => (
                                                        <option key={s} value={s}>{DEPLOYMENT_STATUS_CONFIG[s].label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`badge ${priority.bg} ${priority.color}`}>
                                                    {priority.label}
                                                </span>
                                            </td>
                                            <td className="text-gray-600">
                                                {(d as any).im_user?.name || '—'}
                                            </td>
                                            <td className="text-gray-500 text-sm">{formatDate(d.planned_date)}</td>
                                            <td>
                                                <div className="flex items-center gap-2 min-w-24">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-indigo-500 h-2 rounded-full"
                                                            style={{ width: `${d.progress_pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-8">{d.progress_pct}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => { setEditing(d); setModalOpen(true); }}
                                                        className="btn-ghost btn-sm p-1.5"
                                                        title="Editar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(d.id)}
                                                        className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50"
                                                        title="Eliminar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <DeploymentModal
                    deployment={editing}
                    users={users}
                    onSave={handleSave}
                    onClose={() => { setModalOpen(false); setEditing(null); }}
                />
            )}
        </div>
    );
}
