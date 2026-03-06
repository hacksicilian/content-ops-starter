'use client';

import { useState } from 'react';
import type { Deployment, DeploymentFormData, User, DeploymentStatus, DeploymentType, Technology, Priority } from '@/types';

interface Props {
    deployment: Deployment | null;
    users: Pick<User, 'id' | 'name' | 'role'>[];
    onSave: (data: DeploymentFormData) => void;
    onClose: () => void;
}

export function DeploymentModal({ deployment, users, onSave, onClose }: Props) {
    const [form, setForm] = useState<DeploymentFormData>({
        site_code: deployment?.site_code || '',
        site_name: deployment?.site_name || '',
        region: deployment?.region || '',
        province: deployment?.province || '',
        technology: deployment?.technology || undefined,
        type: deployment?.type || 'SWAP',
        status: deployment?.status || 'PENDING',
        im_assigned: deployment?.im_assigned || '',
        planned_date: deployment?.planned_date ? deployment.planned_date.split('T')[0] : '',
        priority: deployment?.priority || 'MEDIUM',
        progress_pct: deployment?.progress_pct || 0,
        notes: deployment?.notes || ''
    });

    const set = (field: keyof DeploymentFormData, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...form };
        if (!data.im_assigned) delete data.im_assigned;
        if (!data.technology) delete data.technology;
        if (!data.planned_date) delete data.planned_date;
        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {deployment ? 'Editar Despliegue' : 'Nuevo Despliegue'}
                    </h2>
                    <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Código de Sitio *</label>
                            <input type="text" value={form.site_code} onChange={e => set('site_code', e.target.value)} className="form-input" placeholder="Ej: BUE-001" required />
                        </div>
                        <div>
                            <label className="form-label">Nombre del Sitio *</label>
                            <input type="text" value={form.site_name} onChange={e => set('site_name', e.target.value)} className="form-input" placeholder="Nombre del sitio" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Región</label>
                            <input type="text" value={form.region || ''} onChange={e => set('region', e.target.value)} className="form-input" placeholder="GBA Norte, AMBA, etc." />
                        </div>
                        <div>
                            <label className="form-label">Provincia</label>
                            <input type="text" value={form.province || ''} onChange={e => set('province', e.target.value)} className="form-input" placeholder="Buenos Aires, CABA, etc." />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="form-label">Tipo *</label>
                            <select value={form.type} onChange={e => set('type', e.target.value as DeploymentType)} className="form-select">
                                <option value="SWAP">SWAP</option>
                                <option value="TSS">TSS</option>
                                <option value="CLEANUP">CLEANUP</option>
                                <option value="INTEGRACION">INTEGRACIÓN</option>
                                <option value="OTRO">OTRO</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Tecnología</label>
                            <select value={form.technology || ''} onChange={e => set('technology', e.target.value as Technology || undefined)} className="form-select">
                                <option value="">Sin especificar</option>
                                <option value="4G">4G</option>
                                <option value="5G">5G</option>
                                <option value="3G">3G</option>
                                <option value="FTTX">FTTX</option>
                                <option value="OTRO">OTRO</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Estado *</label>
                            <select value={form.status} onChange={e => set('status', e.target.value as DeploymentStatus)} className="form-select">
                                <option value="PENDING">Pendiente</option>
                                <option value="IN_PROGRESS">En Progreso</option>
                                <option value="DONE">Completado</option>
                                <option value="BLOCKED">Bloqueado</option>
                                <option value="CANCELLED">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="form-label">Prioridad</label>
                            <select value={form.priority} onChange={e => set('priority', e.target.value as Priority)} className="form-select">
                                <option value="LOW">Baja</option>
                                <option value="MEDIUM">Media</option>
                                <option value="HIGH">Alta</option>
                                <option value="CRITICAL">Crítica</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">IM Responsable</label>
                            <select value={form.im_assigned || ''} onChange={e => set('im_assigned', e.target.value || undefined)} className="form-select">
                                <option value="">Sin asignar</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Fecha Planificada</label>
                            <input type="date" value={form.planned_date || ''} onChange={e => set('planned_date', e.target.value || undefined)} className="form-input" />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Avance: {form.progress_pct}%</label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={form.progress_pct}
                            onChange={e => set('progress_pct', Number(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Notas</label>
                        <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="form-input" rows={3} placeholder="Observaciones, detalles del sitio, contingencias..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">
                            {deployment ? 'Guardar Cambios' : 'Crear Despliegue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
