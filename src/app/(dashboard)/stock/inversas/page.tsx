import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { InversasClient } from '@/components/stock/InversasClient';

export default async function InversasPage() {
    const supabase = await createClient();

    const { data: returns } = await supabase
        .from('stock_movements')
        .select('*, stock_item:stock_items!stock_item_id(code, name, category, unit), user:users!user_id(name), deployment:deployments!deployment_id(site_code, site_name)')
        .eq('type', 'RETURN')
        .order('created_at', { ascending: false });

    return (
        <>
            <Header title="Inversas" subtitle="Devoluciones y retiros de materiales" />
            <main className="app-content">
                <InversasClient returns={returns || []} />
            </main>
        </>
    );
}
