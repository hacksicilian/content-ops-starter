'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, INVOICE_STATUS_CONFIG } from '@/lib/utils';
import type { Invoice, InvoiceFormData, InvoiceStatus, Deployment } from '@/types';

interface Props {
    invoices: Invoice[];
    deployments: Pick<Deployment, 'id' | 'site_code' | 'site_name'>[];
}

export function FacturacionClient({ invoices: initial, deployments }: Props) {
    const [invoices, setInvoices] = useState<Invoice[]>(initial);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Invoice | null>(null);
    const [filterStatus, setFilterStatus] = useState('');

    const filtered = invoices.filter(i => !filterStatus || i.status === filterStatus);

    const totals = {
        pending: invoices.filter(i => i.status === 'PENDING').reduce((a, i) => a + Number(i.amount), 0),
        approved: invoices.filter(i => i.status === 'APPROVED').reduce((a, i) => a + Number(i.amount), 0),
        paid: invoices.filter(i => i.status === 'PAID').reduce((a, i) => a + Number(i.amount), 0)
    };

    const handleStatusChange = async (id: string, status: InvoiceStatus) => {
        const supabase = createClient();
        const update: any = { status, updated_at: new Date().toISOString() };
        if (status === 'PAID') update.paid_date = new Date().toISOString().split('T')[0];
        await supabase.from('invoices').update(update).eq('id', id);
        setInvoices(prev => prev.map(i => i.id === id ? { ...i, status, ...(status === 'PAID' ? { paid_date: update.paid_date } : {}) } : i));
    };

    const handleSave = async (data: InvoiceFormData) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (editing) {
            const { data: updated } = await supabase.from('invoices').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id).select('*, deployment:deployments!deployment_id(site_code, site_name)').single();
            if (updated) setInvoices(prev => prev.map(i => i.id === editing.id ? updated as any : i));
        } else {
            const { data: created } = await supabase.from('invoices').insert({ ...data, created_by: user?.id }).select('*, deployment:deployments!deployment_id(site_code, site_name)').single();
            if (created) setInvoices(prev => [created as any, ...prev]);
        }
        setShowModal(false);
        setEditing(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta factura?')) return;
        const supabase = createClient();
        await supabase.from('invoices').delete().eq('id', id);
        setInvoices(prev => prev.filter(i => i.id !== id));
    };

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Pendiente', value: totals.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
                    { label: 'Aprobado', value: totals.approved, color: 'text-blue-700', bg: 'bg-blue-50' },
                    { label: 'Pagado', value: totals.paid, color: 'text-green-700', bg: 'bg-green-50' }
                ].map(s => (
                    <div key={s.label} className={`card p-5 ${s.bg}`}>
                        <div className={`text-xl font-bold ${s.color}`}>{formatCurrency(s.value)}</div>
                        <div className="text-sm text-gray-600">{s.label}</div>
                        <div className="text-xs text-gray-400">{invoices.filter(i => INVOICE_STATUS_CONFIG[i.status].label === s.label || (s.label === 'Pendiente' && i.status === 'PENDING') || (s.label === 'Aprobado' && i.status === 'APPROVED') || (s.label === 'Pagado' && i.status === 'PAID')).length} facturas</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-44">
                        <option value="">Todos los estados</option>
                        <option value="PENDING">Pendiente</option>
                        <option value="APPROVED">Aprobada</option>
                        <option value="PAID">Pagada</option>
                        <option value="REJECTED">Rechazada</option>
                    </select>
                    <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">+ Factura</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr><th>N° Factura</th><th>Proveedor</th><th>Importe</th><th>Estado</th><th>Emisión</th><th>Vencimiento</th><th>Sitio</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(inv => {
                                const statusCfg = INVOICE_STATUS_CONFIG[inv.status];
                                const isOverdue = inv.due_date && inv.status !== 'PAID' && new Date(inv.due_date) < new Date();
                                return (
                                    <tr key={inv.id}>
                                        <td className="font-mono text-sm font-medium text-gray-700">{inv.number}</td>
                                        <td className="font-medium text-gray-900">{inv.provider}</td>
                                        <td className="font-semibold text-gray-900">{formatCurrency(inv.amount, inv.currency)}</td>
                                        <td>
                                            <select
                                                value={inv.status}
                                                onChange={e => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                                                className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${statusCfg.bg} ${statusCfg.color}`}
                                            >
                                                <option value="PENDING">Pendiente</option>
                                                <option value="APPROVED">Aprobada</option>
                                                <option value="PAID">Pagada</option>
                                                <option value="REJECTED">Rechazada</option>
                                            </select>
                                        </td>
                                        <td className="text-gray-500 text-sm">{formatDate(inv.issue_date)}</td>
                                        <td className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                            {inv.due_date ? formatDate(inv.due_date) : '—'}
                                            {isOverdue && ' ⚠️'}
                                        </td>
                                        <td className="text-gray-500 text-sm">{(inv as any).deployment?.site_code || '—'}</td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button onClick={() => { setEditing(inv); setShowModal(true); }} className="btn-ghost btn-sm p-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                <button onClick={() => handleDelete(inv.id)} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">Sin facturas</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <InvoiceModal invoice={editing} deployments={deployments} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
            )}
        </div>
    );
}

function InvoiceModal({ invoice, deployments, onSave, onClose }: { invoice: Invoice | null; deployments: any[]; onSave: (d: InvoiceFormData) => void; onClose: () => void }) {
    const [form, setForm] = useState<InvoiceFormData>({
        number: invoice?.number || '',
        provider: invoice?.provider || '',
        amount: invoice?.amount || 0,
        currency: invoice?.currency || 'ARS',
        status: invoice?.status || 'PENDING',
        issue_date: invoice?.issue_date ? invoice.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
        due_date: invoice?.due_date ? invoice.due_date.split('T')[0] : '',
        deployment_id: invoice?.deployment_id || '',
        notes: invoice?.notes || ''
    });
    const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const d = { ...form }; if (!d.deployment_id) delete d.deployment_id; if (!d.due_date) delete d.due_date; onSave(d); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-semibold">{invoice ? 'Editar Factura' : 'Nueva Factura'}</h2>
                    <button onClick={onClose} className="btn-ghost p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label">N° Factura *</label><input type="text" value={form.number} onChange={e => set('number', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Proveedor *</label><input type="text" value={form.provider} onChange={e => set('provider', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Importe *</label><input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', Number(e.target.value))} className="form-input" required /></div>
                        <div><label className="form-label">Moneda</label><select value={form.currency} onChange={e => set('currency', e.target.value)} className="form-select"><option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
                        <div><label className="form-label">Fecha Emisión *</label><input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} className="form-input" required /></div>
                        <div><label className="form-label">Fecha Venc.</label><input type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value || undefined)} className="form-input" /></div>
                    </div>
                    <div><label className="form-label">Estado</label><select value={form.status} onChange={e => set('status', e.target.value as InvoiceStatus)} className="form-select"><option value="PENDING">Pendiente</option><option value="APPROVED">Aprobada</option><option value="PAID">Pagada</option><option value="REJECTED">Rechazada</option></select></div>
                    <div><label className="form-label">Despliegue</label><select value={form.deployment_id || ''} onChange={e => set('deployment_id', e.target.value || undefined)} className="form-select"><option value="">Sin sitio</option>{deployments.map(d => <option key={d.id} value={d.id}>{d.site_code} — {d.site_name}</option>)}</select></div>
                    <div><label className="form-label">Notas</label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="form-input" rows={2} /></div>
                    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}
