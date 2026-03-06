import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { RRHHClient } from '@/components/rrhh/RRHHClient';

export default async function RRHHPage() {
    const supabase = await createClient();

    const [{ data: users }, { data: records }] = await Promise.all([
        supabase.from('users').select('*').eq('active', true).order('name'),
        supabase
            .from('hr_records')
            .select('*, user:users!user_id(id, name, role), created_by_user:users!created_by(name)')
            .order('date', { ascending: false })
            .limit(100)
    ]);

    return (
        <>
            <Header title="RRHH" subtitle="Gestión del equipo y novedades" />
            <main className="app-content">
                <RRHHClient users={users || []} records={records || []} />
            </main>
        </>
    );
}
