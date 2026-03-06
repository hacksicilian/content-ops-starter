import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { StockClient } from '@/components/stock/StockClient';

export default async function StockPage() {
    const supabase = await createClient();

    const [{ data: items }, { data: movements }] = await Promise.all([
        supabase.from('stock_items').select('*').eq('active', true).order('category').order('name'),
        supabase
            .from('stock_movements')
            .select('*, stock_item:stock_items!stock_item_id(code, name), user:users!user_id(name), deployment:deployments!deployment_id(site_code)')
            .order('created_at', { ascending: false })
            .limit(50)
    ]);

    const itemsWithAlert = (items || []).map((item: any) => ({
        ...item,
        is_low_stock: item.quantity_available < item.min_stock
    }));

    return (
        <>
            <Header title="Stock" subtitle="Control de inventario y materiales" />
            <main className="app-content">
                <StockClient items={itemsWithAlert} movements={movements || []} />
            </main>
        </>
    );
}
