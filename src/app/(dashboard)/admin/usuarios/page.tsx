import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { UsuariosClient } from '@/components/admin/UsuariosClient';

export default async function UsuariosPage() {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('users').select('role').eq('id', authUser!.id).single();

    // Only admins can access this page
    if (profile?.role !== 'admin') redirect('/dashboard');

    const { data: users } = await supabase.from('users').select('*').order('name');

    return (
        <>
            <Header title="Administración de Usuarios" subtitle="Gestión de accesos y roles del sistema" />
            <main className="app-content">
                <UsuariosClient users={users || []} />
            </main>
        </>
    );
}
