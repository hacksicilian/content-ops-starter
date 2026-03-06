'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, getInitials } from '@/lib/utils';
import { hasPermission } from '@/types';
import type { User, UserRole } from '@/types';

interface NavItem {
    href: string;
    label: string;
    module: string;
    icon: React.ReactNode;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const iconClass = 'w-5 h-5 flex-shrink-0';

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Principal',
        items: [
            {
                href: '/dashboard',
                label: 'Dashboard',
                module: 'dashboard',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                )
            },
            {
                href: '/panel',
                label: 'Panel de Control',
                module: 'panel',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                )
            },
            {
                href: '/kanban',
                label: 'Kanban',
                module: 'kanban',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                )
            },
            {
                href: '/planificacion',
                label: 'Planificación',
                module: 'planificacion',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                )
            }
        ]
    },
    {
        title: 'Logística',
        items: [
            {
                href: '/stock',
                label: 'Stock',
                module: 'stock',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                )
            },
            {
                href: '/stock/inversas',
                label: 'Inversas',
                module: 'stock.inversas',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                )
            }
        ]
    },
    {
        title: 'Equipo',
        items: [
            {
                href: '/horas',
                label: 'Horas Improductivas',
                module: 'horas',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            },
            {
                href: '/rrhh',
                label: 'RRHH',
                module: 'rrhh',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )
            }
        ]
    },
    {
        title: 'Admin',
        items: [
            {
                href: '/admin/usuarios',
                label: 'Usuarios',
                module: 'admin',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )
            }
        ]
    },
    {
        title: 'Backoffice',
        items: [
            {
                href: '/facturacion',
                label: 'Facturación',
                module: 'facturacion',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                )
            },
            {
                href: '/accesos',
                label: 'Accesos a Sitios',
                module: 'accesos',
                icon: (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                )
            }
        ]
    }
];

interface SidebarProps {
    user: User;
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();

    const handleLogout = async () => {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <aside className="app-sidebar">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-white font-bold text-sm">TelecomOps</div>
                        <div className="text-slate-400 text-xs">Gestión de Despliegues</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {NAV_SECTIONS.map(section => {
                    const visibleItems = section.items.filter(item =>
                        hasPermission(user.role as UserRole, item.module)
                    );
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={section.title}>
                            <div className="nav-section">{section.title}</div>
                            {visibleItems.map(item => {
                                const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn('nav-item', isActive && 'active')}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* User profile */}
            <div className="px-3 py-4 border-t border-slate-700">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{user.name}</div>
                        <div className="text-slate-400 text-xs capitalize">{user.role.replace('_', ' ')}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
}
