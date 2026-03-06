import Link from 'next/link';

interface Alert {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    quantity_available: number;
    min_stock: number;
    deficit: number;
}

interface Props {
    alerts: Alert[];
}

export function StockAlerts({ alerts }: Props) {
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="font-semibold text-gray-900">Alertas de Stock</h3>
                <Link href="/stock" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Ver stock →
                </Link>
            </div>
            <div className="card-body">
                {alerts.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                        <svg className="w-8 h-8 mx-auto mb-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Stock en niveles normales
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{alert.name}</div>
                                    <div className="text-xs text-gray-500">{alert.code} · {alert.category}</div>
                                    <div className="text-xs text-red-600 mt-1">
                                        Disponible: <strong>{alert.quantity_available} {alert.unit}</strong> · Mínimo: {alert.min_stock} {alert.unit}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
