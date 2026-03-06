import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DeploymentStatus, TaskStatus, Priority, InvoiceStatus, SiteAccessStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

// ── Date helpers ───────────────────────────────────────────
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: es });
}

export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
}

export function timeAgo(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function toInputDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
}

// ── Status labels & colors ────────────────────────────────
export const DEPLOYMENT_STATUS_CONFIG: Record<DeploymentStatus, { label: string; color: string; bg: string }> = {
    PENDING:     { label: 'Pendiente',    color: 'text-gray-600',   bg: 'bg-gray-100' },
    IN_PROGRESS: { label: 'En Progreso',  color: 'text-blue-700',   bg: 'bg-blue-100' },
    DONE:        { label: 'Completado',   color: 'text-green-700',  bg: 'bg-green-100' },
    BLOCKED:     { label: 'Bloqueado',    color: 'text-red-700',    bg: 'bg-red-100' },
    CANCELLED:   { label: 'Cancelado',    color: 'text-gray-400',   bg: 'bg-gray-50' }
};

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
    TODO:        { label: 'Por Hacer',    color: 'text-gray-600',   bg: 'bg-gray-100' },
    IN_PROGRESS: { label: 'En Progreso',  color: 'text-blue-700',   bg: 'bg-blue-100' },
    BLOCKED:     { label: 'Bloqueado',    color: 'text-red-700',    bg: 'bg-red-100' },
    DONE:        { label: 'Hecho',        color: 'text-green-700',  bg: 'bg-green-100' }
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
    LOW:      { label: 'Baja',     color: 'text-gray-500',   bg: 'bg-gray-100' },
    MEDIUM:   { label: 'Media',    color: 'text-yellow-700', bg: 'bg-yellow-100' },
    HIGH:     { label: 'Alta',     color: 'text-orange-700', bg: 'bg-orange-100' },
    CRITICAL: { label: 'Crítica',  color: 'text-red-700',    bg: 'bg-red-100' }
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
    PENDING:  { label: 'Pendiente',  color: 'text-yellow-700', bg: 'bg-yellow-100' },
    APPROVED: { label: 'Aprobada',   color: 'text-blue-700',   bg: 'bg-blue-100' },
    PAID:     { label: 'Pagada',     color: 'text-green-700',  bg: 'bg-green-100' },
    REJECTED: { label: 'Rechazada',  color: 'text-red-700',    bg: 'bg-red-100' }
};

export const ACCESS_STATUS_CONFIG: Record<SiteAccessStatus, { label: string; color: string; bg: string }> = {
    VIGENTE:     { label: 'Vigente',      color: 'text-green-700',  bg: 'bg-green-100' },
    VENCIDO:     { label: 'Vencido',      color: 'text-red-700',    bg: 'bg-red-100' },
    EN_GESTION:  { label: 'En Gestión',   color: 'text-yellow-700', bg: 'bg-yellow-100' },
    CANCELADO:   { label: 'Cancelado',    color: 'text-gray-400',   bg: 'bg-gray-50' }
};

// ── Number/currency helpers ───────────────────────────────
export function formatCurrency(amount: number, currency = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
}

export function formatNumber(n: number): string {
    return new Intl.NumberFormat('es-AR').format(n);
}

// ── Misc ──────────────────────────────────────────────────
export function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function slugify(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}
