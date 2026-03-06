'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
    done: number;
    inProgress: number;
    pending: number;
    blocked: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export function DeploymentProgressChart({ done, inProgress, pending, blocked }: Props) {
    const data = [
        { name: 'Completados', value: done, fill: '#22c55e' },
        { name: 'En Progreso', value: inProgress, fill: '#3b82f6' },
        { name: 'Pendientes', value: pending, fill: '#f59e0b' },
        { name: 'Bloqueados', value: blocked, fill: '#ef4444' }
    ].filter(d => d.value > 0);

    const total = done + inProgress + pending + blocked;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="font-semibold text-gray-900">Estado de Despliegues</h3>
                <span className="text-sm text-gray-500">{total} total</span>
            </div>
            <div className="card-body">
                {total === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                        Sin datos aún
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        <div className="flex-shrink-0">
                            <PieChart width={180} height={180}>
                                <Pie
                                    data={data}
                                    cx={85}
                                    cy={85}
                                    innerRadius={55}
                                    outerRadius={80}
                                    dataKey="value"
                                    paddingAngle={3}
                                >
                                    {data.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, '']} />
                            </PieChart>
                        </div>
                        <div className="flex-1 space-y-3">
                            {[
                                { label: 'Completados', value: done, color: 'bg-green-500' },
                                { label: 'En Progreso', value: inProgress, color: 'bg-blue-500' },
                                { label: 'Pendientes', value: pending, color: 'bg-yellow-500' },
                                { label: 'Bloqueados', value: blocked, color: 'bg-red-500' }
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
                                    <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                                    <span className="font-semibold text-gray-900">{item.value}</span>
                                    <span className="text-xs text-gray-400 w-10 text-right">
                                        {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
