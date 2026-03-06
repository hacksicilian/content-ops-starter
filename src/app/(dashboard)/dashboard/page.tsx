import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DeploymentProgressChart } from '@/components/dashboard/DeploymentProgressChart';
import { HoursByCategoryChart } from '@/components/dashboard/HoursByCategoryChart';
import { RecentDeployments } from '@/components/dashboard/RecentDeployments';
import { StockAlerts } from '@/components/dashboard/StockAlerts';

export default async function DashboardPage() {
    const supabase = await createClient();

    const [
        { data: kpis },
        { data: deployments },
        { data: stockAlerts },
        { data: hoursData },
        { data: blockedTasks }
    ] = await Promise.all([
        supabase.from('v_dashboard_kpis').select('*').single(),
        supabase.from('deployments').select('*, im_user:users!im_assigned(name, role)').order('updated_at', { ascending: false }).limit(8),
        supabase.from('v_stock_alerts').select('*').limit(5),
        supabase.from('unproductive_hours').select('category, hours').gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('tasks').select('id').eq('status', 'BLOCKED')
    ]);

    const hoursByCategory = (hoursData || []).reduce<Record<string, number>>((acc, h: any) => {
        acc[h.category] = (acc[h.category] || 0) + Number(h.hours);
        return acc;
    }, {});

    return (
        <>
            <Header title="Dashboard" subtitle="Resumen general de operaciones" />
            <main className="app-content space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Completados"
                        value={kpis?.deployments_done ?? 0}
                        total={kpis?.deployments_total ?? 0}
                        color="green"
                        icon="check"
                    />
                    <KpiCard
                        title="En Progreso"
                        value={kpis?.deployments_in_progress ?? 0}
                        total={kpis?.deployments_total ?? 0}
                        color="blue"
                        icon="progress"
                    />
                    <KpiCard
                        title="Pendientes"
                        value={kpis?.deployments_pending ?? 0}
                        total={kpis?.deployments_total ?? 0}
                        color="yellow"
                        icon="clock"
                    />
                    <KpiCard
                        title="Bloqueados"
                        value={kpis?.deployments_blocked ?? 0}
                        total={kpis?.deployments_total ?? 0}
                        color="red"
                        icon="blocked"
                    />
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <DeploymentProgressChart
                            done={kpis?.deployments_done ?? 0}
                            inProgress={kpis?.deployments_in_progress ?? 0}
                            pending={kpis?.deployments_pending ?? 0}
                            blocked={kpis?.deployments_blocked ?? 0}
                        />
                    </div>
                    <div>
                        <HoursByCategoryChart data={hoursByCategory} />
                    </div>
                </div>

                {/* Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <RecentDeployments deployments={deployments || []} />
                    </div>
                    <div>
                        <StockAlerts alerts={stockAlerts || []} />
                    </div>
                </div>

                {/* Summary bar */}
                {kpis && kpis.deployments_total > 0 && (
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Avance General del Proyecto</h3>
                            <span className="text-2xl font-bold text-indigo-600">{kpis.avg_progress ?? 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${kpis.avg_progress ?? 0}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>{kpis.deployments_done} de {kpis.deployments_total} despliegues completados</span>
                            {blockedTasks && blockedTasks.length > 0 && (
                                <span className="text-red-600 font-medium">{blockedTasks.length} tareas bloqueadas</span>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
