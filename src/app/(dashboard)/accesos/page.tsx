import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { AccesosClient } from '@/components/accesos/AccesosClient';

export default async function AccesosPage() {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    const [{ data: accesses }, { data: users }] = await Promise.all([
        supabase
            .from('site_accesses')
            .select('*, managed_by_user:users!managed_by(name)')
            .order('status')
            .order('site_code'),
        supabase.from('users').select('id, name').eq('active', true)
    ]);

    return (
        <>
            <Header title="Accesos a Sitios" subtitle="Gestión de permisos y accesos" />
            <main className="app-content">
                <AccesosClient accesses={accesses || []} users={users || []} currentUserId={authUser!.id} />
            </main>
        </>
    );
}
