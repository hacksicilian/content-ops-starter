-- ============================================================
-- TELECOM MANAGEMENT APP - SUPABASE SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extended profile for auth.users)
-- ============================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'controller', 'im_swap', 'im_tss', 'backoffice', 'viewer')),
    avatar_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: auto-crear perfil en public.users cuando se crea un usuario en auth.users
-- Esto evita tener que hacer INSERT manual después de crear usuarios en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DEPLOYMENTS (núcleo del panel de control)
-- ============================================================
CREATE TABLE public.deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_code TEXT NOT NULL,
    site_name TEXT NOT NULL,
    region TEXT,
    province TEXT,
    technology TEXT CHECK (technology IN ('4G', '5G', '3G', 'FTTX', 'OTRO')),
    type TEXT NOT NULL CHECK (type IN ('SWAP', 'TSS', 'CLEANUP', 'INTEGRACION', 'OTRO')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED')),
    im_assigned UUID REFERENCES public.users(id),
    planned_date DATE,
    actual_date DATE,
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TASKS (Kanban cards linked to deployments)
-- ============================================================
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID REFERENCES public.deployments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
    assigned_to UUID REFERENCES public.users(id),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    due_date DATE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- STOCK ITEMS (inventario)
-- ============================================================
CREATE TABLE public.stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT DEFAULT 'UN',
    quantity_total NUMERIC(10,2) DEFAULT 0,
    quantity_available NUMERIC(10,2) DEFAULT 0,
    quantity_reserved NUMERIC(10,2) DEFAULT 0,
    min_stock NUMERIC(10,2) DEFAULT 0,
    location TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- STOCK MOVEMENTS (entradas, salidas, inversas, transferencias)
-- ============================================================
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'RETURN', 'TRANSFER', 'ADJUSTMENT')),
    quantity NUMERIC(10,2) NOT NULL,
    deployment_id UUID REFERENCES public.deployments(id),
    reference_number TEXT,
    notes TEXT,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- UNPRODUCTIVE HOURS (horas improductivas)
-- ============================================================
CREATE TABLE public.unproductive_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    date DATE NOT NULL,
    hours NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    category TEXT NOT NULL CHECK (category IN ('CLIMA', 'ACCESO', 'ESPERA_MATERIAL', 'ADMIN', 'CAPACITACION', 'FALLA_EQUIPO', 'OTRO')),
    description TEXT,
    deployment_id UUID REFERENCES public.deployments(id),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- HR RECORDS (novedades de RRHH)
-- ============================================================
CREATE TABLE public.hr_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    date DATE NOT NULL,
    end_date DATE,
    type TEXT NOT NULL CHECK (type IN ('LICENCIA', 'AUSENCIA', 'VACACIONES', 'CAPACITACION', 'GUARDIA', 'OTRO')),
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PLANNING ITEMS (planificación de despliegues)
-- ============================================================
CREATE TABLE public.planning_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID REFERENCES public.deployments(id),
    title TEXT NOT NULL,
    planned_start DATE NOT NULL,
    planned_end DATE NOT NULL,
    resources_needed TEXT,
    responsible UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INVOICES (facturación)
-- ============================================================
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID REFERENCES public.deployments(id),
    number TEXT NOT NULL,
    provider TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'REJECTED')),
    issue_date DATE NOT NULL,
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SITE ACCESSES (accesos a sitios)
-- ============================================================
CREATE TABLE public.site_accesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_code TEXT NOT NULL,
    site_name TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('LLAVE', 'CODIGO', 'PERMISO_PROPIETARIO', 'MUNICIPAL', 'OTRO')),
    status TEXT NOT NULL DEFAULT 'VIGENTE' CHECK (status IN ('VIGENTE', 'VENCIDO', 'EN_GESTION', 'CANCELADO')),
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    valid_from DATE,
    valid_until DATE,
    notes TEXT,
    managed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_deployments_updated_at BEFORE UPDATE ON public.deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_unproductive_hours_updated_at BEFORE UPDATE ON public.unproductive_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_hr_records_updated_at BEFORE UPDATE ON public.hr_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_planning_items_updated_at BEFORE UPDATE ON public.planning_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_site_accesses_updated_at BEFORE UPDATE ON public.site_accesses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unproductive_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_accesses ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all
CREATE POLICY "users_read" ON public.users FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller'))
);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin_all_users" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Deployments: all authenticated users can read; write restricted by role
CREATE POLICY "deployments_read" ON public.deployments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "deployments_write" ON public.deployments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller', 'im_swap', 'im_tss'))
);

-- Tasks: all authenticated users can read; write by role
CREATE POLICY "tasks_read" ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_write" ON public.tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller', 'im_swap', 'im_tss'))
);

-- Stock: all can read; write by role
CREATE POLICY "stock_items_read" ON public.stock_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stock_items_write" ON public.stock_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller', 'im_swap', 'im_tss'))
);
CREATE POLICY "stock_movements_read" ON public.stock_movements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stock_movements_write" ON public.stock_movements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller', 'im_swap', 'im_tss'))
);

-- Hours: users can read/write their own; admin/controller can read all
CREATE POLICY "hours_read_own" ON public.unproductive_hours FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller'))
);
CREATE POLICY "hours_write_own" ON public.unproductive_hours FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hours_update_own" ON public.unproductive_hours FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller'))
);
CREATE POLICY "hours_delete_admin" ON public.unproductive_hours FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller'))
);

-- HR: backoffice and admin manage
CREATE POLICY "hr_read" ON public.hr_records FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller', 'backoffice'))
);
CREATE POLICY "hr_write" ON public.hr_records FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'backoffice'))
);

-- Planning: all read; admin/controller write
CREATE POLICY "planning_read" ON public.planning_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "planning_write" ON public.planning_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller'))
);

-- Invoices: backoffice, controller, admin
CREATE POLICY "invoices_read" ON public.invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'controller', 'backoffice'))
);
CREATE POLICY "invoices_write" ON public.invoices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'backoffice'))
);

-- Site accesses: backoffice, admin manage; others read
CREATE POLICY "accesses_read" ON public.site_accesses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "accesses_write" ON public.site_accesses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'backoffice'))
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Dashboard KPIs
CREATE VIEW public.v_dashboard_kpis AS
SELECT
    COUNT(*) FILTER (WHERE status = 'DONE') AS deployments_done,
    COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS deployments_in_progress,
    COUNT(*) FILTER (WHERE status = 'PENDING') AS deployments_pending,
    COUNT(*) FILTER (WHERE status = 'BLOCKED') AS deployments_blocked,
    COUNT(*) AS deployments_total,
    ROUND(AVG(progress_pct) FILTER (WHERE status != 'CANCELLED'), 1) AS avg_progress
FROM public.deployments
WHERE status != 'CANCELLED';

-- Unproductive hours summary
CREATE VIEW public.v_hours_summary AS
SELECT
    u.name as user_name,
    u.role,
    uh.category,
    DATE_TRUNC('month', uh.date) AS month,
    SUM(uh.hours) AS total_hours
FROM public.unproductive_hours uh
JOIN public.users u ON u.id = uh.user_id
GROUP BY u.name, u.role, uh.category, DATE_TRUNC('month', uh.date);

-- Stock alerts
CREATE VIEW public.v_stock_alerts AS
SELECT
    id, code, name, category, unit,
    quantity_available, min_stock,
    (min_stock - quantity_available) AS deficit
FROM public.stock_items
WHERE quantity_available < min_stock AND active = true
ORDER BY deficit DESC;
