import Link from 'next/link';
import { formatDate, DEPLOYMENT_STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils';
import type { Deployment } from '@/types';

interface Props {
    deployments: Deployment[];
}

export function RecentDeployments({ deployments }: Props) {
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="font-semibold text-gray-900">Despliegues Recientes</h3>
                <Link href="/panel" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Ver todos →
                </Link>
            </div>
            <div className="overflow-x-auto">
                {deployments.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">Sin despliegues registrados</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Sitio</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Prioridad</th>
                                <th>Responsable</th>
                                <th>Fecha Plan.</th>
                                <th>Avance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deployments.map(d => {
                                const status = DEPLOYMENT_STATUS_CONFIG[d.status];
                                const priority = PRIORITY_CONFIG[d.priority];
                                return (
                                    <tr key={d.id}>
                                        <td>
                                            <div className="font-medium text-gray-900">{d.site_code}</div>
                                            <div className="text-xs text-gray-500">{d.site_name}</div>
                                        </td>
                                        <td>
                                            <span className="badge bg-slate-100 text-slate-700">{d.type}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${status.bg} ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${priority.bg} ${priority.color}`}>
                                                {priority.label}
                                            </span>
                                        </td>
                                        <td className="text-gray-600">
                                            {(d as any).im_user?.name || '—'}
                                        </td>
                                        <td className="text-gray-500">{formatDate(d.planned_date)}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                                                    <div
                                                        className="bg-indigo-500 h-1.5 rounded-full"
                                                        style={{ width: `${d.progress_pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{d.progress_pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
