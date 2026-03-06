import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { PanelClient } from '@/components/panel/PanelClient';

export default async function PanelPage() {
    const supabase = await createClient();

    const [{ data: deployments }, { data: users }] = await Promise.all([
        supabase
            .from('deployments')
            .select('*, im_user:users!im_assigned(id, name, role)')
            .order('priority', { ascending: false })
            .order('planned_date', { ascending: true }),
        supabase
            .from('users')
            .select('id, name, role')
            .in('role', ['im_swap', 'im_tss', 'admin'])
            .eq('active', true)
    ]);

    return (
        <>
            <Header title="Panel de Control" subtitle="Seguimiento diario de despliegues" />
            <main className="app-content">
                <PanelClient deployments={deployments || []} users={users || []} />
            </main>
        </>
    );
}
