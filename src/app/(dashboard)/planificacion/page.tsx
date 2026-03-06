import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { PlanificacionClient } from '@/components/planificacion/PlanificacionClient';

export default async function PlanificacionPage() {
    const supabase = await createClient();

    const [{ data: items }, { data: deployments }, { data: users }] = await Promise.all([
        supabase
            .from('planning_items')
            .select('*, deployment:deployments!deployment_id(id, site_code, site_name, type, status), responsible_user:users!responsible(id, name), created_by_user:users!created_by(name)')
            .order('planned_start', { ascending: true }),
        supabase.from('deployments').select('id, site_code, site_name, type').neq('status', 'CANCELLED').order('site_code'),
        supabase.from('users').select('id, name, role').eq('active', true)
    ]);

    return (
        <>
            <Header title="Planificación" subtitle="Timeline de despliegues y asignación de recursos" />
            <main className="app-content">
                <PlanificacionClient items={items || []} deployments={deployments || []} users={users || []} />
            </main>
        </>
    );
}
