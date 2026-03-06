'use client';

import { useState } from 'react';
import type { Task, TaskFormData, User, Deployment, TaskStatus, Priority } from '@/types';

interface Props {
    task: Task | null;
    defaultStatus: TaskStatus;
    users: Pick<User, 'id' | 'name' | 'role'>[];
    deployments: Pick<Deployment, 'id' | 'site_code' | 'site_name'>[];
    onSave: (data: TaskFormData) => void;
    onClose: () => void;
}

export function TaskModal({ task, defaultStatus, users, deployments, onSave, onClose }: Props) {
    const [form, setForm] = useState<TaskFormData>({
        deployment_id: task?.deployment_id || '',
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || defaultStatus,
        assigned_to: task?.assigned_to || '',
        priority: task?.priority || 'MEDIUM',
        due_date: task?.due_date ? task.due_date.split('T')[0] : ''
    });

    const set = (field: keyof TaskFormData, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...form };
        if (!data.deployment_id) delete data.deployment_id;
        if (!data.assigned_to) delete data.assigned_to;
        if (!data.due_date) delete data.due_date;
        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">{task ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                    <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="form-label">Título *</label>
                        <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className="form-input" placeholder="Descripción corta de la tarea" required />
                    </div>

                    <div>
                        <label className="form-label">Descripción</label>
                        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} className="form-input" rows={3} placeholder="Detalles adicionales..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Estado</label>
                            <select value={form.status} onChange={e => set('status', e.target.value as TaskStatus)} className="form-select">
                                <option value="TODO">Por Hacer</option>
                                <option value="IN_PROGRESS">En Progreso</option>
                                <option value="BLOCKED">Bloqueado</option>
                                <option value="DONE">Completado</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Prioridad</label>
                            <select value={form.priority} onChange={e => set('priority', e.target.value as Priority)} className="form-select">
                                <option value="LOW">Baja</option>
                                <option value="MEDIUM">Media</option>
                                <option value="HIGH">Alta</option>
                                <option value="CRITICAL">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Asignado a</label>
                            <select value={form.assigned_to || ''} onChange={e => set('assigned_to', e.target.value || undefined)} className="form-select">
                                <option value="">Sin asignar</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Vencimiento</label>
                            <input type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value || undefined)} className="form-input" />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Despliegue relacionado</label>
                        <select value={form.deployment_id || ''} onChange={e => set('deployment_id', e.target.value || undefined)} className="form-select">
                            <option value="">Sin despliegue</option>
                            {deployments.map(d => (
                                <option key={d.id} value={d.id}>{d.site_code} — {d.site_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">{task ? 'Guardar' : 'Crear Tarea'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
