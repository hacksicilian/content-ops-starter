import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { KanbanClient } from '@/components/kanban/KanbanClient';

export default async function KanbanPage() {
    const supabase = await createClient();

    const [{ data: tasks }, { data: users }, { data: deployments }] = await Promise.all([
        supabase
            .from('tasks')
            .select('*, assigned_user:users!assigned_to(id, name), deployment:deployments!deployment_id(id, site_code, site_name)')
            .order('sort_order', { ascending: true }),
        supabase.from('users').select('id, name, role').eq('active', true),
        supabase.from('deployments').select('id, site_code, site_name').neq('status', 'CANCELLED').order('site_code')
    ]);

    return (
        <>
            <Header title="Kanban" subtitle="Gestión visual de tareas" />
            <main className="app-content overflow-x-auto">
                <KanbanClient tasks={tasks || []} users={users || []} deployments={deployments || []} />
            </main>
        </>
    );
}
