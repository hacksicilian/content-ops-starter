'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, DEPLOYMENT_STATUS_CONFIG } from '@/lib/utils';
import type { PlanningItem, Deployment, User } from '@/types';

interface Props {
    items: PlanningItem[];
    deployments: Pick<Deployment, 'id' | 'site_code' | 'site_name' | 'type'>[];
    users: Pick<User, 'id' | 'name' | 'role'>[];
}

const WEEKS_TO_SHOW = 8;

function getWeekLabel(date: Date): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
}

function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function PlanificacionClient({ items: initial, deployments, users }: Props) {
    const [items, setItems] = useState<PlanningItem[]>(initial);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<PlanningItem | null>(null);
    const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');

    // Build weeks array starting from current week
    const weeks = useMemo(() => {
        const start = startOfWeek(new Date());
        return Array.from({ length: WEEKS_TO_SHOW }, (_, i) => {
            const w = new Date(start);
            w.setDate(w.getDate() + i * 7);
            return w;
        });
    }, []);

    const handleSave = async (data: any) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (editing) {
            const { data: updated } = await supabase
                .from('planning_items')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', editing.id)
                .select('*, deployment:deployments!deployment_id(id, site_code, site_name, type, status), responsible_user:users!responsible(id, name)')
                .single();
            if (updated) setItems(prev => prev.map(i => i.id === editing.id ? updated as any : i));
        } else {
            const { data: created } = await supabase
                .from('planning_items')
                .insert({ ...data, created_by: user?.id })
                .select('*, deployment:deployments!deployment_id(id, site_code, site_name, type, status), responsible_user:users!responsible(id, name)')
                .single();
            if (created) setItems(prev => [...prev, created as any].sort((a, b) => a.planned_start.localeCompare(b.planned_start)));
        }
        setShowModal(false);
        setEditing(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este ítem de planificación?')) return;
        const supabase = createClient();
        await supabase.from('planning_items').delete().eq('id', id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    // For gantt: determine which weeks each item spans
    const itemsWithSpan = items.map(item => {
        const start = new Date(item.planned_start);
        const end = new Date(item.planned_end);
        const weekStart = weeks[0];
        const weekEnd = new Date(weeks[WEEKS_TO_SHOW - 1]);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const colStart = weeks.findIndex(w => {
            const wEnd = new Date(w);
            wEnd.setDate(wEnd.getDate() + 6);
            return start <= wEnd && end >= w;
        });

        if (colStart === -1) return { ...item, colStart: -1, colSpan: 0 };

        let colSpan = 0;
        for (let i = colStart; i < WEEKS_TO_SHOW; i++) {
            const wEnd = new Date(weeks[i]);
            wEnd.setDate(wEnd.getDate() + 6);
            if (end >= weeks[i] && start <= wEnd) colSpan++;
            else break;
        }

        return { ...item, colStart, colSpan: Math.max(1, colSpan) };
    });

    const STATUS_COLORS: Record<string, string> = {
        PENDING: 'bg-yellow-400',
        CONFIRMED: 'bg-indigo-500',
        CANCELLED: 'bg-gray-300'
    };

    const DEPLOY_TYPE_COLOR: Record<string, string> = {
        SWAP: 'bg-blue-500', TSS: 'bg-purple-500', CLEANUP: 'bg-green-500', INTEGRACION: 'bg-orange-500', OTRO: 'bg-gray-500'
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setViewMode('gantt')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'gantt' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>
                        Vista Gantt
                    </button>
                    <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>
                        Lista
                    </button>
                </div>
                <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
                    + Planificar
                </button>
            </div>

            {viewMode === 'gantt' ? (
                <div className="card overflow-x-auto">
                    <div className="min-w-[900px]">
                        {/* Header weeks */}
                        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `240px repeat(${WEEKS_TO_SHOW}, 1fr)` }}>
                            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase border-r border-gray-200">Despliegue / Tarea</div>
                            {weeks.map((w, i) => (
                                <div key={i} className="px-2 py-3 text-center text-xs font-medium text-gray-600 border-r border-gray-100 last:border-r-0">
                                    <div className="font-semibold">Sem {i + 1}</div>
                                    <div className="text-gray-400">{getWeekLabel(w)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Today marker row */}
                        <div className="grid" style={{ gridTemplateColumns: `240px repeat(${WEEKS_TO_SHOW}, 1fr)` }}>
                            <div className="border-r border-gray-200 h-0" />
                            {weeks.map((w, i) => {
                                const now = new Date();
                                const wEnd = new Date(w); wEnd.setDate(wEnd.getDate() + 6);
                                const isCurrentWeek = now >= w && now <= wEnd;
                                return (
                                    <div key={i} className={`h-0.5 ${isCurrentWeek ? 'bg-red-400' : ''}`} />
                                );
                            })}
                        </div>

                        {/* Rows */}
                        {items.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">Sin planificaciones. Agregá la primera.</div>
                        ) : (
                            itemsWithSpan.map((item, idx) => {
                                const depl = (item as any).deployment;
                                const resp = (item as any).responsible_user;
                                const color = depl ? (DEPLOY_TYPE_COLOR[depl.type] || 'bg-gray-500') : 'bg-indigo-500';
                                const statusColor = STATUS_COLORS[item.status] || 'bg-gray-300';

                                return (
                                    <div
                                        key={item.id}
                                        className="grid border-b border-gray-100 hover:bg-gray-50 group"
                                        style={{ gridTemplateColumns: `240px repeat(${WEEKS_TO_SHOW}, 1fr)` }}
                                    >
                                        {/* Label */}
                                        <div className="px-4 py-3 border-r border-gray-200 flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 text-sm truncate">{item.title}</div>
                                                {depl && <div className="text-xs text-gray-500">{depl.site_code} · {depl.type}</div>}
                                                {resp && <div className="text-xs text-gray-400">{resp.name}</div>}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <button onClick={() => { setEditing(item as any); setShowModal(true); }} className="p-1 text-gray-400 hover:text-gray-600">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Timeline cells */}
                                        {Array.from({ length: WEEKS_TO_SHOW }, (_, colIdx) => {
                                            const isStart = item.colStart === colIdx;
                                            const isActive = colIdx >= item.colStart && colIdx < item.colStart + item.colSpan && item.colStart !== -1;

                                            return (
                                                <div key={colIdx} className="relative py-3 px-1 border-r border-gray-100 last:border-r-0">
                                                    {isActive && (
                                                        <div className={`h-6 rounded ${color} opacity-80 relative flex items-center`}>
                                                            {isStart && (
                                                                <span className="px-2 text-white text-xs font-medium truncate">
                                                                    {item.title}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Legend */}
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-6 flex-wrap">
                        {Object.entries(DEPLOY_TYPE_COLOR).map(([type, color]) => (
                            <div key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className={`w-3 h-3 rounded ${color}`} />
                                {type}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr><th>Título</th><th>Despliegue</th><th>Inicio Plan.</th><th>Fin Plan.</th><th>Responsable</th><th>Estado</th><th>Recursos</th><th></th></tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const depl = (item as any).deployment;
                                const resp = (item as any).responsible_user;
                                const statusColors: Record<string, string> = { PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700', CANCELLED: 'bg-gray-100 text-gray-500' };
                                const statusLabels: Record<string, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmado', CANCELLED: 'Cancelado' };
                                return (
                                    <tr key={item.id}>
                                        <td className="font-medium text-gray-900">{item.title}</td>
                                        <td>{depl ? <div><div className="font-medium text-sm">{depl.site_code}</div><div className="text-xs text-gray-500">{depl.type}</div></div> : '—'}</td>
                                        <td className="text-gray-600 text-sm">{formatDate(item.planned_start)}</td>
                                        <td className="text-gray-600 text-sm">{formatDate(item.planned_end)}</td>
                                        <td className="text-gray-600 text-sm">{resp?.name || '—'}</td>
                                        <td><span className={`badge ${statusColors[item.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabels[item.status] || item.status}</span></td>
                                        <td className="text-gray-500 text-sm max-w-xs truncate">{item.resources_needed || '—'}</td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button onClick={() => { setEditing(item); setShowModal(true); }} className="btn-ghost btn-sm p-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                <button onClick={() => handleDelete(item.id)} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">Sin planificaciones</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <PlanningModal item={editing} deployments={deployments} users={users} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
            )}
        </div>
    );
}

function PlanningModal({ item, deployments, users, onSave, onClose }: { item: PlanningItem | null; deployments: any[]; users: any[]; onSave: (d: any) => void; onClose: () => void }) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        title: item?.title || '',
        deployment_id: item?.deployment_id || '',
        planned_start: item?.planned_start ? item.planned_start.split('T')[0] : today,
        planned_end: item?.planned_end ? item.planned_end.split('T')[0] : today,
        responsible: item?.responsible || '',
        status: item?.status || 'PENDING',
        resources_needed: item?.resources_needed || '',
        notes: item?.notes || ''
    });
    const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const d = { ...form };
        if (!d.deployment_id) delete (d as any).deployment_id;
        if (!d.responsible) delete (d as any).responsible;
        onSave(d);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-semibold">{item ? 'Editar Planificación' : 'Nueva Planificación'}</h2>
                    <button onClick={onClose} className="btn-ghost p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="form-label">Título *</label><input type="text" value={form.title} onChange={e => set('title', e.target.value)} className="form-input" required /></div>
                    <div><label className="form-label">Despliegue relacionado</label><select value={form.deployment_id} onChange={e => set('deployment_id', e.target.value)} className="form-select"><option value="">Sin despliegue</option>{deployments.map(d => <option key={d.id} value={d.id}>{d.site_code} — {d.site_name} ({d.type})</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">Inicio *</label><input type="date" value={form.planned_start} onChange={e => set('planned_start', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Fin *</label><input type="date" value={form.planned_end} min={form.planned_start} onChange={e => set('planned_end', e.target.value)} className="form-input" required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">Responsable</label><select value={form.responsible} onChange={e => set('responsible', e.target.value)} className="form-select"><option value="">Sin asignar</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                        <div><label className="form-label">Estado</label><select value={form.status} onChange={e => set('status', e.target.value)} className="form-select"><option value="PENDING">Pendiente</option><option value="CONFIRMED">Confirmado</option><option value="CANCELLED">Cancelado</option></select></div>
                    </div>
                    <div><label className="form-label">Recursos necesarios</label><input type="text" value={form.resources_needed} onChange={e => set('resources_needed', e.target.value)} className="form-input" placeholder="Personal, equipos, materiales..." /></div>
                    <div><label className="form-label">Notas</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="form-input" rows={2} /></div>
                    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}
