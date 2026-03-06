'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORY_LABELS: Record<string, string> = {
    CLIMA: 'Clima',
    ACCESO: 'Acceso',
    ESPERA_MATERIAL: 'Material',
    ADMIN: 'Admin',
    CAPACITACION: 'Capac.',
    FALLA_EQUIPO: 'Equipo',
    OTRO: 'Otro'
};

interface Props {
    data: Record<string, number>;
}

export function HoursByCategoryChart({ data }: Props) {
    const chartData = Object.entries(data).map(([key, value]) => ({
        name: CATEGORY_LABELS[key] || key,
        horas: Number(value.toFixed(1))
    }));

    return (
        <div className="card h-full">
            <div className="card-header">
                <h3 className="font-semibold text-gray-900">Horas Improductivas</h3>
                <span className="text-sm text-gray-500">Este mes</span>
            </div>
            <div className="card-body">
                {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                        Sin registros este mes
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => [`${v}h`, 'Horas']} />
                            <Bar dataKey="horas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
