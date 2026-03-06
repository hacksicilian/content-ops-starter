import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { HorasClient } from '@/components/horas/HorasClient';

export default async function HorasPage() {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('users').select('role').eq('id', authUser!.id).single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'controller';

    // Admins see all; IMs see only their own
    let query = supabase
        .from('unproductive_hours')
        .select('*, user:users!user_id(id, name, role), deployment:deployments!deployment_id(site_code, site_name)')
        .order('date', { ascending: false });

    if (!isAdmin) {
        query = query.eq('user_id', authUser!.id);
    }

    const { data: hours } = await query;
    const { data: deployments } = await supabase.from('deployments').select('id, site_code, site_name').order('site_code');

    return (
        <>
            <Header title="Horas Improductivas" subtitle="Registro y seguimiento de horas no productivas" />
            <main className="app-content">
                <HorasClient hours={hours || []} deployments={deployments || []} isAdmin={isAdmin} userId={authUser!.id} />
            </main>
        </>
    );
}
