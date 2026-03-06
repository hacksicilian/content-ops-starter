// ============================================================
// GLOBAL TYPES - Telecom Management App
// ============================================================

export type UserRole = 'admin' | 'controller' | 'im_swap' | 'im_tss' | 'backoffice' | 'viewer';

export type DeploymentStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'CANCELLED';
export type DeploymentType = 'SWAP' | 'TSS' | 'CLEANUP' | 'INTEGRACION' | 'OTRO';
export type Technology = '4G' | '5G' | '3G' | 'FTTX' | 'OTRO';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export type StockMovementType = 'IN' | 'OUT' | 'RETURN' | 'TRANSFER' | 'ADJUSTMENT';

export type HoursCategory = 'CLIMA' | 'ACCESO' | 'ESPERA_MATERIAL' | 'ADMIN' | 'CAPACITACION' | 'FALLA_EQUIPO' | 'OTRO';

export type HRRecordType = 'LICENCIA' | 'AUSENCIA' | 'VACACIONES' | 'CAPACITACION' | 'GUARDIA' | 'OTRO';

export type InvoiceStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export type SiteAccessType = 'LLAVE' | 'CODIGO' | 'PERMISO_PROPIETARIO' | 'MUNICIPAL' | 'OTRO';
export type SiteAccessStatus = 'VIGENTE' | 'VENCIDO' | 'EN_GESTION' | 'CANCELADO';

// ============================================================
// USER
// ============================================================
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar_url?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================================
// DEPLOYMENT
// ============================================================
export interface Deployment {
    id: string;
    site_code: string;
    site_name: string;
    region?: string;
    province?: string;
    technology?: Technology;
    type: DeploymentType;
    status: DeploymentStatus;
    im_assigned?: string;
    im_user?: User;
    planned_date?: string;
    actual_date?: string;
    priority: Priority;
    progress_pct: number;
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface DeploymentFormData {
    site_code: string;
    site_name: string;
    region?: string;
    province?: string;
    technology?: Technology;
    type: DeploymentType;
    status: DeploymentStatus;
    im_assigned?: string;
    planned_date?: string;
    priority: Priority;
    progress_pct: number;
    notes?: string;
}

// ============================================================
// TASK (Kanban)
// ============================================================
export interface Task {
    id: string;
    deployment_id?: string;
    deployment?: Deployment;
    title: string;
    description?: string;
    status: TaskStatus;
    assigned_to?: string;
    assigned_user?: User;
    priority: Priority;
    due_date?: string;
    sort_order: number;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface TaskFormData {
    deployment_id?: string;
    title: string;
    description?: string;
    status: TaskStatus;
    assigned_to?: string;
    priority: Priority;
    due_date?: string;
}

export interface KanbanColumn {
    id: TaskStatus;
    title: string;
    tasks: Task[];
    color: string;
}

// ============================================================
// STOCK
// ============================================================
export interface StockItem {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    quantity_total: number;
    quantity_available: number;
    quantity_reserved: number;
    min_stock: number;
    location?: string;
    notes?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    is_low_stock?: boolean;
}

export interface StockMovement {
    id: string;
    stock_item_id: string;
    stock_item?: StockItem;
    type: StockMovementType;
    quantity: number;
    deployment_id?: string;
    deployment?: Deployment;
    reference_number?: string;
    notes?: string;
    user_id?: string;
    user?: User;
    created_at: string;
}

export interface StockMovementFormData {
    stock_item_id: string;
    type: StockMovementType;
    quantity: number;
    deployment_id?: string;
    reference_number?: string;
    notes?: string;
}

// ============================================================
// UNPRODUCTIVE HOURS
// ============================================================
export interface UnproductiveHour {
    id: string;
    user_id: string;
    user?: User;
    date: string;
    hours: number;
    category: HoursCategory;
    description?: string;
    deployment_id?: string;
    deployment?: Deployment;
    approved_by?: string;
    approved_at?: string;
    created_at: string;
    updated_at: string;
}

export interface HoursFormData {
    date: string;
    hours: number;
    category: HoursCategory;
    description?: string;
    deployment_id?: string;
}

// ============================================================
// HR RECORDS
// ============================================================
export interface HRRecord {
    id: string;
    user_id: string;
    user?: User;
    date: string;
    end_date?: string;
    type: HRRecordType;
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface HRFormData {
    user_id: string;
    date: string;
    end_date?: string;
    type: HRRecordType;
    notes?: string;
}

// ============================================================
// PLANNING
// ============================================================
export interface PlanningItem {
    id: string;
    deployment_id?: string;
    deployment?: Deployment;
    title: string;
    planned_start: string;
    planned_end: string;
    resources_needed?: string;
    responsible?: string;
    responsible_user?: User;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

// ============================================================
// INVOICES
// ============================================================
export interface Invoice {
    id: string;
    deployment_id?: string;
    deployment?: Deployment;
    number: string;
    provider: string;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    issue_date: string;
    due_date?: string;
    paid_date?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface InvoiceFormData {
    deployment_id?: string;
    number: string;
    provider: string;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    issue_date: string;
    due_date?: string;
    notes?: string;
}

// ============================================================
// SITE ACCESSES
// ============================================================
export interface SiteAccess {
    id: string;
    site_code: string;
    site_name: string;
    access_type: SiteAccessType;
    status: SiteAccessStatus;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    valid_from?: string;
    valid_until?: string;
    notes?: string;
    managed_by?: string;
    managed_by_user?: User;
    created_at: string;
    updated_at: string;
}

// ============================================================
// DASHBOARD KPIs
// ============================================================
export interface DashboardKPIs {
    deployments_done: number;
    deployments_in_progress: number;
    deployments_pending: number;
    deployments_blocked: number;
    deployments_total: number;
    avg_progress: number;
}

// ============================================================
// API RESPONSE HELPERS
// ============================================================
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
}

// ============================================================
// ROLE PERMISSIONS
// ============================================================
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    admin: ['*'],
    controller: ['dashboard', 'panel', 'kanban', 'stock', 'stock.inversas', 'planificacion', 'horas', 'rrhh', 'facturacion', 'reportes'],
    im_swap: ['dashboard', 'panel', 'kanban', 'stock', 'stock.inversas', 'horas', 'planificacion'],
    im_tss: ['dashboard', 'panel', 'kanban', 'stock', 'stock.inversas', 'horas', 'planificacion'],
    backoffice: ['dashboard', 'rrhh', 'facturacion', 'accesos', 'horas'],
    viewer: ['dashboard', 'reportes']
};

export function hasPermission(role: UserRole, module: string): boolean {
    const perms = ROLE_PERMISSIONS[role];
    return perms.includes('*') || perms.includes(module);
}
