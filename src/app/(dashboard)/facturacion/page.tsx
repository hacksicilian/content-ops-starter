import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { FacturacionClient } from '@/components/facturacion/FacturacionClient';

export default async function FacturacionPage() {
    const supabase = await createClient();

    const [{ data: invoices }, { data: deployments }] = await Promise.all([
        supabase
            .from('invoices')
            .select('*, deployment:deployments!deployment_id(site_code, site_name), created_by_user:users!created_by(name)')
            .order('issue_date', { ascending: false }),
        supabase.from('deployments').select('id, site_code, site_name').order('site_code')
    ]);

    return (
        <>
            <Header title="Facturación" subtitle="Control de facturas y estados de pago" />
            <main className="app-content">
                <FacturacionClient invoices={invoices || []} deployments={deployments || []} />
            </main>
        </>
    );
}
